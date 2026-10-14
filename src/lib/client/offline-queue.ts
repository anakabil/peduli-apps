"use client";

import { get, set, del, keys } from "idb-keyval";

export type QueuedReport = {
  clientId: string;
  fields: Record<string, string>;
  photos: Array<{ name: string; type: string; blob: Blob }>;
  clientCreatedAt: string;
};

const PREFIX = "peduli:queue:";

export async function enqueueReport(item: QueuedReport) {
  await set(PREFIX + item.clientId, item);
}

export async function listQueue(): Promise<QueuedReport[]> {
  const ks = (await keys()).filter((k) => typeof k === "string" && k.startsWith(PREFIX));
  const items = await Promise.all(ks.map((k) => get<QueuedReport>(k)));
  return items.filter((x): x is QueuedReport => !!x);
}

export async function removeQueued(clientId: string) {
  await del(PREFIX + clientId);
}

export async function submitQueued(item: QueuedReport) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(item.fields)) fd.append(k, v);
  fd.append("clientCreatedAt", item.clientCreatedAt);
  fd.append("syncedOffline", "true");
  fd.append("clientId", item.clientId);
  for (const p of item.photos) fd.append("photos", new File([p.blob], p.name, { type: p.type }));
  const res = await fetch("/api/laporan", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ ok: boolean; id: string; number: string }>;
}

/** Mengirim seluruh antrean; mengembalikan jumlah yang berhasil */
export async function flushQueue(onEach?: (r: { number: string }) => void) {
  const items = await listQueue();
  let sent = 0;
  for (const it of items) {
    try {
      const r = await submitQueued(it);
      await removeQueued(it.clientId);
      sent++;
      onEach?.(r);
    } catch (e) {
      // Kesalahan validasi (4xx) tidak akan berhasil dengan pengulangan, buang dari antrean
      if (e instanceof Error && /HTTP 4|wajib|maksimal|tidak valid|Format/i.test(e.message)) await removeQueued(it.clientId);
    }
  }
  return sent;
}
