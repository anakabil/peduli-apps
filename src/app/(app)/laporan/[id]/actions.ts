"use server";

import { makeThumb } from "@/lib/image";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { verifyReport, decideReport, updateProgress, closeReport, resubmitReport, WorkflowError } from "@/lib/workflow";
import { CATEGORIES, RISKS, CONTROLS, type Category, type Risk, REJECT_REASONS, type RejectReason } from "@/lib/constants";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
import { db } from "@/lib/db";
import { audit } from "@/lib/notify";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function run(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, message: message ?? undefined };
  } catch (e) {
    if (e instanceof WorkflowError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Terjadi kesalahan. Coba lagi." };
  }
}

export async function verifyAction(reportId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const result = String(fd.get("result"));
  if (!["VALID", "REVISI", "TOLAK"].includes(result)) return { ok: false, error: "Hasil verifikasi tidak valid." };
  const note = String(fd.get("note") ?? "");
  const reasonRaw = String(fd.get("rejectReason") ?? "");
  if (reasonRaw && !(REJECT_REASONS as readonly string[]).includes(reasonRaw)) return { ok: false, error: "Alasan penolakan tidak valid." };
  const r = await run(() => verifyReport(user.id, reportId, result as "VALID" | "REVISI" | "TOLAK", note, (reasonRaw || undefined) as RejectReason | undefined));
  revalidatePath(`/laporan/${reportId}`);
  revalidatePath("/verifikasi");
  return r;
}

export async function decideAction(reportId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const result = String(fd.get("result"));
  if (!["SETUJU", "TOLAK"].includes(result)) return { ok: false, error: "Hasil keputusan tidak valid." };
  const control = String(fd.get("controlHierarchy") ?? "");
  if (control && !(CONTROLS as readonly string[]).includes(control)) return { ok: false, error: "Hierarki pengendalian tidak valid." };
  const rejectRaw = String(fd.get("rejectReason") ?? "");
  if (rejectRaw && !(REJECT_REASONS as readonly string[]).includes(rejectRaw)) return { ok: false, error: "Alasan penolakan tidak valid." };
  const targetRaw = String(fd.get("targetDate") ?? "");
  if (targetRaw && !/^\d{4}-\d{2}-\d{2}$/.test(targetRaw)) return { ok: false, error: "Format tanggal target tidak valid." };
  const r = await run(() =>
    decideReport(user.id, reportId, {
      result: result as "SETUJU" | "TOLAK",
      note: String(fd.get("note") ?? ""),
      picId: String(fd.get("picId") ?? "") || null,
      picName: String(fd.get("picName") ?? "") || null,
      resourceTenaga: String(fd.get("resourceTenaga") ?? "") || null,
      resourceBiaya: String(fd.get("resourceBiaya") ?? "") || null,
      resourceMaterial: String(fd.get("resourceMaterial") ?? "") || null,
      targetDate: targetRaw ? new Date(targetRaw + "T17:00:00+07:00") : null,
      controlHierarchy: control || null,
      rejectReason: (rejectRaw || undefined) as RejectReason | undefined,
    })
  );
  revalidatePath(`/laporan/${reportId}`);
  revalidatePath("/keputusan");
  return r;
}

export async function progressAction(reportId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const pct = parseInt(String(fd.get("pct") ?? "0"), 10) || 0;
  const note = String(fd.get("note") ?? "").trim();
  const done = fd.get("done") === "true";
  let photo: { mime: string; data: Uint8Array<ArrayBuffer>; thumb?: Uint8Array<ArrayBuffer> | null } | undefined;
  const f = fd.get("photo");
  if (f instanceof File && f.size > 0) {
    if (!ALLOWED_MIME.includes(f.type)) return { ok: false, error: "Format foto harus JPEG, PNG, atau WebP." };
    if (f.size > 2 * 1024 * 1024) return { ok: false, error: "Ukuran foto maksimal 2 MB." };
    const data = new Uint8Array(await f.arrayBuffer());
    photo = { mime: f.type, data, thumb: await makeThumb(data) };
  }
  if (!note) return { ok: false, error: "Catatan progres wajib diisi." };
  const r = await run(() => updateProgress(user.id, reportId, pct, note, done, photo));
  revalidatePath(`/laporan/${reportId}`);
  revalidatePath("/tindak-lanjut");
  return r;
}

export async function closeAction(reportId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const accepted = fd.get("accepted") === "true";
  const note = String(fd.get("note") ?? "").trim();
  const suggestionApplied = fd.get("suggestionApplied") === "on";
  const r = await run(() => closeReport(user.id, reportId, accepted, note, suggestionApplied));
  revalidatePath(`/laporan/${reportId}`);
  return r;
}

export async function resubmitAction(reportId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const category = String(fd.get("category")) as Category;
  const riskLevel = String(fd.get("riskLevel")) as Risk;
  if (!CATEGORIES.includes(category) || !RISKS.includes(riskLevel)) return { ok: false, error: "Kategori atau risiko tidak valid." };
  const description = String(fd.get("description") ?? "").trim();
  if (description.length < 10) return { ok: false, error: "Uraian minimal 10 karakter." };
  const r = await run(() =>
    resubmitReport(user.id, reportId, {
      category,
      riskLevel,
      description,
      suggestion: String(fd.get("suggestion") ?? "").trim() || null,
      areaLabel: String(fd.get("areaLabel") ?? "").trim() || null,
      note: String(fd.get("note") ?? "").trim() || "Revisi dikirim",
    })
  );
  revalidatePath(`/laporan/${reportId}`);
  return r;
}

export async function auditSampleAction(reportId: string, note: string): Promise<ActionResult> {
  const user = await requireUser(["ADMIN"]);
  await db.report.update({ where: { id: reportId }, data: { auditSampled: true, events: { create: { type: "AUDIT", actorId: user.id, note: note || "Audit acak oleh tim pengelola" } } } });
  await audit(user.id, "AUDIT_ACAK", "Report", reportId, { note });
  revalidatePath(`/laporan/${reportId}`);
  return { ok: true, message: "Laporan ditandai telah diaudit." };
}
