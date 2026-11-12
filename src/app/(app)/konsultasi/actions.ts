"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { audit, notify } from "@/lib/notify";
import { CONSULT_TOPICS, CONSULT_REJECT_REASONS, CONSULT_ANSWER_ROLES, labels, type ConsultRejectReason } from "@/lib/constants";
import { bi } from "@/lib/i18n";
import { getTr } from "@/lib/i18n-server";

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
  const { tr } = await getTr();
  const topic = String(fd.get("topic") ?? "");
  const question = String(fd.get("question") ?? "").trim();
  if (!CONSULT_TOPICS.includes(topic as (typeof CONSULT_TOPICS)[number])) return { ok: false, message: tr("Pilih topik.", "Select a topic.") };
  if (question.length < 10) return { ok: false, message: tr("Tuliskan pertanyaan minimal 10 karakter.", "Write a question of at least 10 characters.") };
  if (question.length > 2000) return { ok: false, message: tr("Pertanyaan maksimal 2.000 karakter.", "Questions are limited to 2,000 characters.") };
  const c = await db.consultation.create({ data: { askerId: user.id, topic, question, anonymous: fd.get("anonymous") === "on" } });
  await notify("KONSULTASI", await admins(), bi("Konsultasi baru menunggu penyaringan", "New consultation awaiting screening"), bi(short(question), short(question)), "/konsultasi?tab=saring");
  await audit(user.id, "KONSULTASI_DIAJUKAN", "Consultation", c.id, { topic });
  done();
  return { ok: true, message: tr("Pertanyaan terkirim. Tim HSE akan meneruskannya kepada pengurus.", "Question sent. The HSE team will forward it to Management.") };
}

/** Tim HSE meneruskan pertanyaan kepada pengurus yang tepat */
export async function forwardAction(id: string, fd: FormData): Promise<Result> {
  const hse = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  const assigneeId = String(fd.get("assigneeId") ?? "");
  const screenNote = String(fd.get("screenNote") ?? "").trim() || null;
  const assignee = await db.user.findFirst({ where: { id: assigneeId, status: "ACTIVE", role: { in: CONSULT_ANSWER_ROLES } }, select: { id: true, name: true } });
  if (!assignee) return { ok: false, message: tr("Pilih pengurus penjawab.", "Select the Management member who will answer.") };
  const upd = await db.consultation.updateMany({ where: { id, status: "DIAJUKAN" }, data: { status: "DITERUSKAN", assigneeId: assignee.id, screenerId: hse.id, screenedAt: new Date(), screenNote } });
  if (upd.count !== 1) return { ok: false, message: tr("Pertanyaan sudah diproses.", "This question has already been processed.") };
  const c = await db.consultation.findUniqueOrThrow({ where: { id }, select: { askerId: true, question: true } });
  await notify("KONSULTASI", [assignee.id], bi("Pertanyaan K3 untuk Anda jawab", "OHS question for you to answer"), bi(short(c.question), short(c.question)), "/konsultasi?tab=jawab");
  await notify(
    "KONSULTASI",
    [c.askerId],
    bi("Pertanyaan Anda diteruskan kepada pengurus", "Your question has been forwarded to Management"),
    bi(`Akan dijawab oleh ${assignee.name ?? "pengurus"}.`, `To be answered by ${assignee.name ?? "Management"}.`),
    "/konsultasi",
  );
  await audit(hse.id, "KONSULTASI_DITERUSKAN", "Consultation", id, { assigneeId: assignee.id });
  done();
  return { ok: true, message: tr(`Diteruskan kepada ${assignee.name ?? "pengurus"}.`, `Forwarded to ${assignee.name ?? "Management"}.`) };
}

/** Tim HSE tidak meneruskan pertanyaan, dengan alasan yang disampaikan kepada pemohon */
export async function rejectConsultAction(id: string, fd: FormData): Promise<Result> {
  const hse = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  const reason = String(fd.get("rejectReason") ?? "") as ConsultRejectReason;
  if (!CONSULT_REJECT_REASONS.includes(reason)) return { ok: false, message: tr("Pilih alasan.", "Select a reason.") };
  const rejectNote = String(fd.get("rejectNote") ?? "").trim() || null;
  const upd = await db.consultation.updateMany({ where: { id, status: "DIAJUKAN" }, data: { status: "DITOLAK", rejectReason: reason, rejectNote, screenerId: hse.id, screenedAt: new Date() } });
  if (upd.count !== 1) return { ok: false, message: tr("Pertanyaan sudah diproses.", "This question has already been processed.") };
  const c = await db.consultation.findUniqueOrThrow({ where: { id }, select: { askerId: true } });
  const note = rejectNote ? ` ${rejectNote}` : "";
  await notify(
    "KONSULTASI",
    [c.askerId],
    bi("Pertanyaan Anda tidak diteruskan", "Your question was not forwarded"),
    bi(`${labels("id").CONSULT_REJECT_LABEL[reason]}.${note}`, `${labels("en").CONSULT_REJECT_LABEL[reason]}.${note}`),
    "/konsultasi",
  );
  await audit(hse.id, "KONSULTASI_TIDAK_DITERUSKAN", "Consultation", id, { reason });
  done();
  return { ok: true, message: tr("Pertanyaan tidak diteruskan dan pemohon diberi tahu.", "The question was not forwarded and the requester has been notified.") };
}

/** Pengurus menjawab pertanyaan yang diteruskan kepadanya */
export async function answerAction(id: string, fd: FormData): Promise<Result> {
  const user = await requireUser(CONSULT_ANSWER_ROLES);
  const { tr } = await getTr();
  const answer = String(fd.get("answer") ?? "").trim();
  if (answer.length < 10) return { ok: false, message: tr("Tuliskan jawaban minimal 10 karakter.", "Write an answer of at least 10 characters.") };
  if (answer.length > 4000) return { ok: false, message: tr("Jawaban maksimal 4.000 karakter.", "Answers are limited to 4,000 characters.") };
  const upd = await db.consultation.updateMany({ where: { id, status: "DITERUSKAN", assigneeId: user.id }, data: { status: "DIJAWAB", answer, answeredAt: new Date() } });
  if (upd.count !== 1) return { ok: false, message: tr("Pertanyaan ini tidak menunggu jawaban Anda.", "This question is not awaiting your answer.") };
  const c = await db.consultation.findUniqueOrThrow({ where: { id }, select: { askerId: true } });
  await notify("KONSULTASI", [c.askerId], bi("Pertanyaan Anda telah dijawab pengurus", "Your question has been answered by Management"), bi(short(answer), short(answer)), "/konsultasi");
  await notify("KONSULTASI", await admins(), bi("Konsultasi telah dijawab", "Consultation answered"), bi("Tinjau untuk ditampilkan di Tanya jawab.", "Review it for publication in Q&A."), "/konsultasi?tab=saring");
  await audit(user.id, "KONSULTASI_DIJAWAB", "Consultation", id);
  done();
  return { ok: true, message: tr("Jawaban terkirim kepada pemohon.", "Answer sent to the requester.") };
}

/** Tim HSE menampilkan atau menyembunyikan tanya jawab bagi seluruh pengguna (tanpa nama pemohon) */
export async function publishAction(id: string, published: boolean): Promise<Result> {
  const hse = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  const upd = await db.consultation.updateMany({ where: { id, status: "DIJAWAB" }, data: { published } });
  if (upd.count !== 1) return { ok: false, message: tr("Hanya pertanyaan yang sudah dijawab yang dapat ditampilkan.", "Only answered questions can be published.") };
  await audit(hse.id, published ? "KONSULTASI_DITAMPILKAN" : "KONSULTASI_DISEMBUNYIKAN", "Consultation", id);
  done();
  return { ok: true, message: published ? tr("Ditampilkan di Tanya jawab.", "Published in Q&A.") : tr("Disembunyikan dari Tanya jawab.", "Hidden from Q&A.") };
}
