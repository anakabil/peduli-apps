"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { verifyReport, decideReport, updateProgress, closeReport, resubmitReport, WorkflowError } from "@/lib/workflow";
import { CATEGORIES, RISKS, type Category, type Risk } from "@/lib/constants";
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
  const result = String(fd.get("result")) as "VALID" | "REVISI" | "TOLAK";
  const note = String(fd.get("note") ?? "");
  const r = await run(() => verifyReport(user.id, reportId, result, note));
  revalidatePath(`/laporan/${reportId}`);
  revalidatePath("/verifikasi");
  return r;
}

export async function decideAction(reportId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const result = String(fd.get("result")) as "SETUJU" | "TOLAK";
  const targetRaw = String(fd.get("targetDate") ?? "");
  const r = await run(() =>
    decideReport(user.id, reportId, {
      result,
      note: String(fd.get("note") ?? ""),
      picId: String(fd.get("picId") ?? "") || null,
      picName: String(fd.get("picName") ?? "") || null,
      resourceTenaga: String(fd.get("resourceTenaga") ?? "") || null,
      resourceBiaya: String(fd.get("resourceBiaya") ?? "") || null,
      resourceMaterial: String(fd.get("resourceMaterial") ?? "") || null,
      targetDate: targetRaw ? new Date(targetRaw + "T17:00:00+07:00") : null,
      controlHierarchy: String(fd.get("controlHierarchy") ?? "") || null,
      rejectReason: (String(fd.get("rejectReason") ?? "") || undefined) as "GANDA" | "TIDAK_BENAR" | "TIDAK_PERLU_TINDAKAN" | undefined,
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
  let photo: { mime: string; data: Uint8Array<ArrayBuffer> } | undefined;
  const f = fd.get("photo");
  if (f instanceof File && f.size > 0) {
    if (f.size > 2 * 1024 * 1024) return { ok: false, error: "Ukuran foto maksimal 2 MB." };
    photo = { mime: f.type || "image/jpeg", data: new Uint8Array(await f.arrayBuffer()) };
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
