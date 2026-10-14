"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, LocateFixed, Send, X, Lightbulb, AlertTriangle, CheckCircle2, Clock, WifiOff } from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL, RISK_COLOR, type Category, type Risk } from "@/lib/constants";
import { compressImage } from "@/lib/client/image";
import { enqueueReport } from "@/lib/client/offline-queue";
import { cn } from "@/lib/format";

type Area = { id: string; name: string; code: string };
type Geo = { lat: number; lng: number; accuracy: number; at: Date };

const RISK_HELP: Record<Risk, string> = {
  RENDAH: "Cedera ringan, dapat ditangani dengan P3K.",
  SEDANG: "Cedera memerlukan perawatan medis, kehilangan hari kerja.",
  TINGGI: "Cedera serius atau cacat tetap, kerusakan besar.",
  EKSTREM: "Potensi fatalitas atau kecelakaan massal.",
};

export function ReportForm({ areas, userAreaId, path }: { areas: Area[]; userAreaId: string | null; path: "A" | "B" }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Array<{ blob: Blob; url: string; name: string }>>([]);
  const [category, setCategory] = useState<Category | "">("");
  const [risk, setRisk] = useState<Risk | "">("");
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "locked" | "denied" | "unsupported">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number?: string; offline?: boolean } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, at: new Date() });
        setGeoState("locked");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    locate();
  }, []);

  const addPhoto = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const next = [...photos];
    for (const f of Array.from(files)) {
      if (next.length >= 3) break;
      const { blob } = await compressImage(f);
      next.push({ blob, url: URL.createObjectURL(blob), name: `foto-${Date.now()}.jpg` });
    }
    setPhotos(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    if (photos.length === 0) return "Ambil minimal satu foto dari kamera.";
    if (!category) return "Pilih kategori bahaya.";
    if (!risk) return "Pilih tingkat risiko awal.";
    if (description.trim().length < 10) return "Uraian bahaya minimal 10 karakter.";
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const fields: Record<string, string> = {
      category,
      riskLevel: risk,
      description: description.trim(),
      suggestion: suggestion.trim(),
      areaLabel: areaLabel.trim(),
      lat: geo ? String(geo.lat) : "",
      lng: geo ? String(geo.lng) : "",
      accuracyM: geo ? String(Math.round(geo.accuracy)) : "",
    };
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const clientCreatedAt = new Date().toISOString();
    const fd = new FormData();
    Object.entries(fields).forEach(([k, val]) => fd.append(k, val));
    fd.append("clientCreatedAt", clientCreatedAt);
    fd.append("clientId", clientId);
    photos.forEach((p) => fd.append("photos", new File([p.blob], p.name, { type: "image/jpeg" })));

    try {
      if (!navigator.onLine) throw new TypeError("offline");
      const res = await fetch("/api/laporan", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Gagal mengirim laporan.");
        setBusy(false);
        return;
      }
      setDone({ number: body.number });
      setTimeout(() => router.push(`/laporan/${body.id}`), 1400);
    } catch {
      // Tanpa sinyal: simpan ke antrean luring
      await enqueueReport({ clientId, fields, clientCreatedAt, photos: photos.map((p) => ({ name: p.name, type: "image/jpeg", blob: p.blob })) });
      setDone({ offline: true });
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card p-8 text-center anim-scale-in">
        <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full", done.offline ? "bg-amber/15 text-[#8a6a0a]" : "bg-brand-100 text-brand-700")}>
          {done.offline ? <WifiOff size={30} /> : <CheckCircle2 size={32} />}
        </div>
        <h2 className="mt-4 text-xl font-bold">{done.offline ? "Tersimpan di perangkat" : "Laporan terkirim"}</h2>
        <p className="mt-2 text-sm text-ink-500">
          {done.offline
            ? "Tidak ada sinyal. Laporan akan dikirim otomatis dengan penanda waktu sinkronisasi saat jaringan tersedia."
            : `Nomor laporan ${done.number}. ${path === "A" ? "Superintendent akan memverifikasi." : "Manager akan memutuskan."}`}
        </p>
        {done.offline && (
          <button className="btn-primary mt-6" onClick={() => router.push("/laporan")}>
            Kembali ke daftar laporan
          </button>
        )}
      </div>
    );
  }

  const fmt = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d) + " WIB";

  return (
    <div className="space-y-4 stagger">
      {/* Foto */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink-900">Foto dari kamera <span className="text-red">*</span></h3>
          <span className="text-xs text-ink-500">{photos.length}/3</span>
        </div>
        <p className="mt-1 text-xs text-ink-500">Foto hanya dapat diambil langsung dari kamera untuk menjaga akurasi bukti.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl border border-ink-200 anim-scale-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute right-1 top-1 rounded-full bg-ink-900/70 p-1 text-white" aria-label="Hapus foto">
                <X size={14} />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <Camera size={26} />
              <span className="text-xs font-semibold">Ambil foto</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addPhoto(e.target.files)} />
      </section>

      {/* Kategori dan risiko */}
      <section className="card p-5">
        <h3 className="font-bold text-ink-900">Kategori bahaya <span className="text-red">*</span></h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={cn("chip", category === c && "chip-active")}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <h3 className="mt-5 font-bold text-ink-900">Tingkat risiko awal <span className="text-red">*</span></h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RISKS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRisk(r)}
              className={cn("rounded-xl border px-3 py-2.5 text-left transition-all", risk === r ? "border-transparent text-white shadow-soft" : "border-ink-200 bg-white hover:border-ink-300")}
              style={risk === r ? { background: RISK_COLOR[r] } : undefined}
            >
              <div className="text-sm font-bold">{RISK_LABEL[r]}</div>
              <div className={cn("mt-0.5 text-[11px] leading-snug", risk === r ? "text-white/85" : "text-ink-500")}>{RISK_HELP[r]}</div>
            </button>
          ))}
        </div>
        {(risk === "TINGGI" || risk === "EKSTREM") && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange/10 px-3 py-2 text-xs text-ink-800 anim-fade-in">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange" />
            Risiko Tinggi dan Ekstrem dieskalasi langsung ke Manager dan memperoleh bonus poin bila terverifikasi.
          </div>
        )}
      </section>

      {/* Lokasi dan waktu */}
      <section className={cn("card p-5 border-l-4", geoState === "locked" ? "border-l-brand-500" : "border-l-amber")}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink-900">Otomatis terkunci</h3>
          <button type="button" onClick={locate} className="btn-ghost btn-sm">
            <LocateFixed size={14} /> {geoState === "locating" ? "Mencari..." : "Perbarui GPS"}
          </button>
        </div>
        <div className="mt-2 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-ink-700">
            <MapPin size={15} className="text-brand-600" />
            {geoState === "locked" && geo ? (
              <span>
                GPS terkunci, akurasi {Math.round(geo.accuracy)} m <span className="text-ink-400">({geo.lat.toFixed(5)}, {geo.lng.toFixed(5)})</span>
              </span>
            ) : geoState === "locating" ? (
              <span className="text-ink-500">Mengunci posisi GPS...</span>
            ) : geoState === "denied" ? (
              <span className="text-[#8a6a0a]">Izin lokasi ditolak. Laporan tetap bisa dikirim dan akan ditandai untuk ditinjau.</span>
            ) : (
              <span className="text-ink-500">GPS tidak tersedia di perangkat ini.</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-ink-700">
            <Clock size={15} className="text-brand-600" />
            <span>{now ? fmt(now) : "-"} <span className="text-ink-400">(cap waktu final dari server)</span></span>
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Keterangan lokasi (opsional)</label>
          <input className="input" placeholder="Contoh: Gudang bahan baku, dekat jalur forklift 2" value={areaLabel} onChange={(e) => setAreaLabel(e.target.value)} list="area-list" />
          <datalist id="area-list">
            {areas.map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>
          <p className="help">Area kerja ditentukan otomatis dari koordinat GPS{userAreaId ? ", cadangan dari area profil Anda" : ""}.</p>
        </div>
      </section>

      {/* Uraian */}
      <section className="card p-5">
        <label className="label">Uraian bahaya <span className="text-red">*</span></label>
        <textarea className="input min-h-24" placeholder="Tulis uraian singkat: apa bahayanya, di mana, siapa yang terpapar." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <div className="mt-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-gold" />
          <label className="label mb-0">Usulan perbaikan (opsional, bernilai bonus poin bila diterapkan)</label>
        </div>
        <textarea className="input mt-1.5 min-h-20" placeholder="Contoh: pasang penutup kabel dan rambu peringatan." value={suggestion} onChange={(e) => setSuggestion(e.target.value)} maxLength={2000} />
      </section>

      {error && <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red anim-fade-in">{error}</div>}

      <button type="button" onClick={submit} disabled={busy} className="btn-primary btn-lg w-full">
        <Send size={18} /> {busy ? "Mengirim..." : "Kirim laporan"}
      </button>
      <p className="text-center text-xs text-ink-400">Nomor laporan unik, identitas, dan peran pelapor terekam otomatis.</p>
    </div>
  );
}
