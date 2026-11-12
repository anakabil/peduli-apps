import { NextResponse } from "next/server";
import { makeThumb } from "@/lib/image";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createReport, WorkflowError } from "@/lib/workflow";
import { CATEGORIES, RISKS, HAZARD_TYPES } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import type { Tr } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 30;

const makeSchema = (tr: Tr) => z.object({
  category: z.enum(CATEGORIES),
  riskLevel: z.enum(RISKS),
  // Jenis bahaya, dampak, dan lokasi diwajibkan di formulir; di sini opsional agar antrean luring versi lama tetap terkirim
  hazardType: z.enum(HAZARD_TYPES).optional().nullable(),
  description: z.string().trim().min(10, tr("Uraian minimal 10 karakter", "Description must be at least 10 characters")).max(2000),
  impact: z.string().trim().max(2000).optional().nullable(),
  immediateAction: z.string().trim().max(2000).optional().nullable(),
  suggestion: z.string().trim().max(2000).optional().nullable(),
  proposedPicId: z.string().max(64).optional().nullable(),
  areaId: z.string().max(64).optional().nullable(),
  areaLabel: z.string().trim().max(200).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  accuracyM: z.coerce.number().min(0).optional().nullable(),
  clientCreatedAt: z.string().datetime().optional().nullable(),
  syncedOffline: z.coerce.boolean().optional(),
  clientId: z.string().max(64).optional().nullable(),
});

const MAX_PHOTO = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const { tr } = await getTr();
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: tr("Belum masuk.", "Not signed in.") }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: tr("Akun belum aktif.", "Account is not active yet.") }, { status: 403 });

  const form = await req.formData();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v === "" ? null : v;
  const parsed = makeSchema(tr).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? tr("Data tidak valid.", "Invalid data.") }, { status: 400 });

  // Idempoten untuk antrean luring: kunci dibatasi per pelapor agar tidak bertabrakan antarpengguna
  const clientKey = parsed.data.clientId ? `${user.id}:${parsed.data.clientId}` : null;
  if (clientKey) {
    const r = await db.report.findUnique({ where: { clientId: clientKey }, select: { id: true, number: true } });
    if (r) return NextResponse.json({ ok: true, id: r.id, number: r.number, duplicate: true });
  }

  const photos: Array<{ mime: string; data: Uint8Array<ArrayBuffer>; thumb?: Uint8Array<ArrayBuffer> | null }> = [];
  for (const f of form.getAll("photos")) {
    if (!(f instanceof File)) continue;
    if (!ALLOWED.includes(f.type)) return NextResponse.json({ error: tr("Format foto harus JPEG, PNG, atau WebP.", "Photo format must be JPEG, PNG, or WebP.") }, { status: 400 });
    if (f.size > MAX_PHOTO) return NextResponse.json({ error: tr("Ukuran foto maksimal 2 MB.", "Maximum photo size is 2 MB.") }, { status: 400 });
    photos.push({ mime: f.type, data: new Uint8Array(await f.arrayBuffer()) });
  }
  if (photos.length === 0) return NextResponse.json({ error: tr("Foto dari kamera wajib disertakan.", "A camera photo is required.") }, { status: 400 });
  if (photos.length > 3) return NextResponse.json({ error: tr("Maksimal tiga foto.", "Maximum of three photos.") }, { status: 400 });
  await Promise.all(photos.map(async (p) => (p.thumb = await makeThumb(p.data))));

  try {
    const { report, duplicate } = await createReport({
      reporterId: user.id,
      category: parsed.data.category,
      riskLevel: parsed.data.riskLevel,
      hazardType: parsed.data.hazardType ?? null,
      description: parsed.data.description,
      impact: parsed.data.impact ?? null,
      immediateAction: parsed.data.immediateAction ?? null,
      suggestion: parsed.data.suggestion ?? null,
      proposedPicId: parsed.data.proposedPicId ?? null,
      areaId: parsed.data.areaId ?? null,
      areaLabel: parsed.data.areaLabel ?? null,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      accuracyM: parsed.data.accuracyM ?? null,
      clientCreatedAt: parsed.data.clientCreatedAt ? new Date(parsed.data.clientCreatedAt) : null,
      syncedOffline: parsed.data.syncedOffline,
      clientId: clientKey,
      photos,
    });
    return NextResponse.json({ ok: true, id: report.id, number: report.number, ...(duplicate ? { duplicate: true } : {}) });
  } catch (e) {
    if (e instanceof WorkflowError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: tr("Gagal menyimpan laporan.", "Failed to save the report.") }, { status: 500 });
  }
}
