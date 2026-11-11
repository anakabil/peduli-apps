"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { audit, notify } from "@/lib/notify";
import { CONSULT_TOPICS, CONSULT_REJECT_REASONS, CONSULT_REJECT_LABEL, CONSULT_ANSWER_ROLES, type ConsultRejectReason } from "@/lib/constants";

type Result = { ok: boolean; message: string };

const admins = async () => (await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).map((u) => u.id);
const short = (t: string, n = 90) => (t.length > n ? `${t.slice(0, n - 1)}...` : t);
const done = () => {
  revalidatePath("/konsultasi");
  revalidatePath("/beranda");
};

/** Pekerja mengajukan pertanyaan; tim HSE menerima tugas penyaringan */
export async function askAction(fd: FormData): Promise<Result> {
  const user = await requireUser();
  const topic = String(fd.get("topic") ?? "");
  const question = String(fd.get("question") ?? "").trim();
  if (!CONSULT_TOPICS.includes(topic as (typeof CONSULT_TOPICS)[number])) return { ok: false, message: "Pilih topik." };
  if (question.length < 10) return { ok: false, message: "Tuliskan pertanyaan minimal 10 karakter." };
  if (question.length > 2000) return { ok: false, message: "Pertanyaan maksimal 2.000 karakter." };
  const c = await db.consultation.create({ data: { askerId: user.id, topic, question, anonymous: fd.get("anonymous") === "on" } });
  await notify("KONSULTASI", await admins(), "Konsultasi baru menunggu penyaringan", short(question), "/konsultasi?tab=saring");
  await audit(user.id, "KONSULTASI_DIAJUKAN", "Consultation", c.id, { topic });
  done();
  return { ok: true, message: "Pertanyaan terkirim. Tim HSE akan meneruskannya kepada pengurus." };
}

/** Tim HSE meneruskan pertanyaan kepada pengurus yang tepat */
export async function forwardAction(id: string, fd: FormData): Promise<Result> {
  const hse = await requireUser(["ADMIN"]);
  const assigneeId = String(fd.get("assigneeId") ?? "");
  const screenNote = String(fd.get("screenNote") ?? "").trim() || null;
  const assignee = await db.user.findFirst({ where: { id: assigneeId, status: "ACTIVE", role: { in: CONSULT_ANSWER_ROLES } }, select: { id: true, name: true } });
  if (!assignee) return { ok: false, message: "Pilih pengurus penjawab." };
  const upd = await db.consultation.updateMany({ where: { id, status: "DIAJUKAN" }, data: { status: "DITERUSKAN", assigneeId: assignee.id, screenerId: hse.id, screenedAt: new Date(), screenNote } });
  if (upd.count !== 1) return { ok: false, message: "Pertanyaan sudah diproses." };
  const c = await db.consultation.findUniqueOrThrow({ where: { id }, select: { askerId: true, question: true } });
  await notify("KONSULTASI", [assignee.id], "Pertanyaan K3 untuk Anda jawab", short(c.question), "/konsultasi?tab=jawab");
  await notify("KONSULTASI", [c.askerId], "Pertanyaan Anda diteruskan kepada pengurus", `Akan dijawab oleh ${assignee.name ?? "pengurus"}.`, "/konsultasi");
  await audit(hse.id, "KONSULTASI_DITERUSKAN", "Consultation", id, { assigneeId: assignee.id });
  done();
  return { ok: true, message: `Diteruskan kepada ${assignee.name ?? "pengurus"}.` };
}

/** Tim HSE tidak meneruskan pertanyaan, dengan alasan yang disampaikan kepada pemohon */
export async function rejectConsultAction(id: string, fd: FormData): Promise<Result> {
  const hse = await requireUser(["ADMIN"]);
  const reason = String(fd.get("rejectReason") ?? "") as ConsultRejectReason;
  if (!CONSULT_REJECT_REASONS.includes(reason)) return { ok: false, message: "Pilih alasan." };
  const rejectNote = String(fd.get("rejectNote") ?? "").trim() || null;
  const upd = await db.consultation.updateMany({ where: { id, status: "DIAJUKAN" }, data: { status: "DITOLAK", rejectReason: reason, rejectNote, screenerId: hse.id, screenedAt: new Date() } });
  if (upd.count !== 1) return { ok: false, message: "Pertanyaan sudah diproses." };
  const c = await db.consultation.findUniqueOrThrow({ where: { id }, select: { askerId: true } });
  await notify("KONSULTASI", [c.askerId], "Pertanyaan Anda tidak diteruskan", `${CONSULT_REJECT_LABEL[reason]}.${rejectNote ? ` ${rejectNote}` : ""}`, "/konsultasi");
  await audit(hse.id, "KONSULTASI_TIDAK_DITERUSKAN", "Consultation", id, { reason });
  done();
  return { ok: true, message: "Pertanyaan tidak diteruskan dan pemohon diberi tahu." };
}

/** Pengurus menjawab pertanyaan yang diteruskan kepadanya */
export async function answerAction(id: string, fd: FormData): Promise<Result> {
  const user = await requireUser(CONSULT_ANSWER_ROLES);
  const answer = String(fd.get("answer") ?? "").trim();
  if (answer.length < 10) return { ok: false, message: "Tuliskan jawaban minimal 10 karakter." };
  if (answer.length > 4000) return { ok: false, message: "Jawaban maksimal 4.000 karakter." };
  const upd = await db.consultation.updateMany({ where: { id, status: "DITERUSKAN", assigneeId: user.id }, data: { status: "DIJAWAB", answer, answeredAt: new Date() } });
  if (upd.count !== 1) return { ok: false, message: "Pertanyaan ini tidak menunggu jawaban Anda." };
  const c = await db.consultation.findUniqueOrThrow({ where: { id }, select: { askerId: true } });
  await notify("KONSULTASI", [c.askerId], "Pertanyaan Anda telah dijawab pengurus", short(answer), "/konsultasi");
  await notify("KONSULTASI", await admins(), "Konsultasi telah dijawab", "Tinjau untuk ditampilkan di Tanya jawab.", "/konsultasi?tab=saring");
  await audit(user.id, "KONSULTASI_DIJAWAB", "Consultation", id);
  done();
  return { ok: true, message: "Jawaban terkirim kepada pemohon." };
}

/** Tim HSE menampilkan atau menyembunyikan tanya jawab bagi seluruh pengguna (tanpa nama pemohon) */
export async function publishAction(id: string, published: boolean): Promise<Result> {
  const hse = await requireUser(["ADMIN"]);
  const upd = await db.consultation.updateMany({ where: { id, status: "DIJAWAB" }, data: { published } });
  if (upd.count !== 1) return { ok: false, message: "Hanya pertanyaan yang sudah dijawab yang dapat ditampilkan." };
  await audit(hse.id, published ? "KONSULTASI_DITAMPILKAN" : "KONSULTASI_DISEMBUNYIKAN", "Consultation", id);
  done();
  return { ok: true, message: published ? "Ditampilkan di Tanya jawab." : "Disembunyikan dari Tanya jawab." };
}
