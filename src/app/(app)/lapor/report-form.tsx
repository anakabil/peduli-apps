"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, LocateFixed, Send, X, Lightbulb, AlertTriangle, CheckCircle2, Clock, WifiOff, TriangleAlert, UserX, Siren, PersonStanding, Leaf } from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL, RISK_COLOR, type Category, type Risk } from "@/lib/constants";
import { compressImage } from "@/lib/client/image";
import { enqueueReport } from "@/lib/client/offline-queue";
import { cn } from "@/lib/format";
import { ChoiceGrid } from "@/components/ui/choice-grid";

const CATEGORY_ICON: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  KONDISI_TIDAK_AMAN: TriangleAlert,
  TINDAKAN_TIDAK_AMAN: UserX,
  NYARIS_CELAKA: Siren,
  ERGONOMI: PersonStanding,
  LINGKUNGAN: Leaf,
};

type Area = { id: string; name: string; code: string };
type Geo = { lat: number; lng: number; accuracy: number; at: Date };

const RISK_HELP: Record<Risk, string> = {
  RENDAH: "Cedera ringan, dapat ditangani dengan P3K.",
  SEDANG: "Cedera memerlukan perawatan medis, kehilangan hari kerja.",
  TINGGI: "Cedera serius atau cacat tetap, kerusakan besar.",
  EKSTREM: "Potensi fatalitas atau kecelakaan massal.",
};

function Section({ no, title, hint, aside, children, className = "" }: { no: number; title: string; hint?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold tabular-nums text-white">{no}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink-900">{title}</h3>
          {hint && <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{hint}</p>}
        </div>
        {aside && <div className="shrink-0 pt-0.5 text-xs font-medium tabular-nums text-ink-500">{aside}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

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
    if (description.trim().length < 10) return "Uraikan bahaya minimal 10 karakter.";
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
      <Section no={1} title="Foto dari kamera" hint="Foto diambil langsung dari kamera untuk menjaga akurasi bukti." aside={`${photos.length}/3`}>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl border border-ink-200 anim-scale-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/70 text-white" aria-label="Hapus foto">
                <X size={15} />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50">
              <Camera size={26} />
              <span className="text-xs font-semibold">Ambil foto</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addPhoto(e.target.files)} />
      </Section>

      <Section no={2} title="Kategori dan tingkat risiko">
        <label className="label">Kategori bahaya <span className="text-red">*</span></label>
        <ChoiceGrid
          multiple={false}
          ariaLabel="Kategori bahaya"
          options={CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABEL[c], icon: CATEGORY_ICON[c] }))}
          selected={category ? [category] : []}
          onToggle={(k) => setCategory(k as Category)}
        />
        <label className="label mt-5">Tingkat risiko awal <span className="text-red">*</span></label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RISKS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={risk === r} onClick={() => setRisk(r)} className={cn("flex h-full flex-col justify-start rounded-xl border bg-white px-3 py-2.5 text-left transition-colors", risk === r ? "ring-1" : "border-ink-200 hover:border-ink-300")} style={risk === r ? { borderColor: RISK_COLOR[r], background: `${RISK_COLOR[r]}14`, ["--tw-ring-color" as string]: RISK_COLOR[r] } : undefined}>
              <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLOR[r] }} />
                {RISK_LABEL[r]}
              </span>
              <span className="mt-1 text-xs leading-snug text-ink-600">{RISK_HELP[r]}</span>
            </button>
          ))}
        </div>
        {(risk === "TINGGI" || risk === "EKSTREM") && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange/10 px-3 py-2 text-xs text-ink-800 anim-fade-in">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange" />
            Risiko Tinggi dan Ekstrem dieskalasi langsung ke Manager dan memperoleh bonus poin bila terverifikasi.
          </div>
        )}
      </Section>

      <Section no={3} title="Uraian bahaya" hint="Jelaskan apa bahayanya, di mana, dan siapa yang dapat terpapar.">
        <label className="label">Uraian bahaya <span className="text-red">*</span></label>
        <textarea className="input min-h-28" placeholder="Tulis uraian singkat: apa bahayanya, di mana, siapa yang terpapar." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <label className="label mt-4 flex items-start gap-1.5"><Lightbulb size={14} className="mt-0.5 shrink-0 text-ink-400" /> <span>Usulan perbaikan <span className="font-normal text-ink-500">(opsional, bonus poin bila diterapkan)</span></span></label>
        <textarea className="input min-h-20" placeholder="Contoh: pasang penutup kabel permanen dan tambahkan rambu peringatan." value={suggestion} onChange={(e) => setSuggestion(e.target.value)} maxLength={2000} />
      </Section>

      <Section no={4} title="Lokasi dan waktu" hint="Terekam otomatis saat laporan dibuat." className={geoState === "locked" ? "border-l-4 border-l-brand-500" : "border-l-4 border-l-amber"}>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-start gap-2.5 text-ink-800">
            <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
            {geoState === "locked" && geo ? (
              <span>
                GPS terkunci, akurasi {Math.round(geo.accuracy)} m
                <span className="block text-xs tabular-nums text-ink-500">{geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</span>
              </span>
            ) : geoState === "locating" ? (
              <span className="text-ink-500">Mengunci posisi GPS...</span>
            ) : geoState === "denied" ? (
              <span className="text-[#7a5c06]">Izin lokasi ditolak. Laporan tetap bisa dikirim dan akan ditandai untuk ditinjau.</span>
            ) : (
              <span className="text-ink-500">GPS tidak tersedia di perangkat ini.</span>
            )}
          </div>
          <div className="flex items-start gap-2.5 text-ink-800">
            <Clock size={16} className="mt-0.5 shrink-0 text-brand-600" />
            <span>
              {now ? fmt(now) : "-"}
              <span className="block text-xs text-ink-500">Cap waktu final dicatat oleh server</span>
            </span>
          </div>
          <button type="button" onClick={locate} className="btn-secondary btn-sm min-h-9">
            <LocateFixed size={14} /> {geoState === "locating" ? "Mencari posisi..." : "Perbarui lokasi"}
          </button>
        </div>
        <div className="mt-4">
          <label className="label">Keterangan lokasi (opsional)</label>
          <input className="input" placeholder="Contoh: Gudang bahan baku, dekat jalur forklift 2" value={areaLabel} onChange={(e) => setAreaLabel(e.target.value)} list="area-list" />
          <datalist id="area-list">
            {areas.map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>
          <p className="help">Area kerja ditentukan otomatis dari koordinat GPS{userAreaId ? ", cadangan dari area profil Anda" : ""}. Nama pelapor dan departemen diambil dari akun Anda.</p>
        </div>
      </Section>

      {error && <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red anim-fade-in">{error}</div>}

      <button type="button" onClick={submit} disabled={busy} className="btn-primary btn-lg w-full">
        <Send size={18} /> {busy ? "Mengirim..." : "Kirim laporan"}
      </button>
      <p className="text-center text-xs text-ink-500">Nomor laporan unik, identitas, dan peran pelapor terekam otomatis.</p>
    </div>
  );
}
