"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, RefreshCw, Send, X, AlertTriangle, CheckCircle2, WifiOff, ShieldCheck, TriangleAlert, UserX, Siren, PersonStanding, Droplets, CloudLightning, Users, Cog, FlaskConical, ListChecks, Factory } from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, HAZARD_TYPES, HAZARD_TYPE_LABEL, RISKS, RISK_LABEL, RISK_COLOR, type Category, type HazardType, type Risk } from "@/lib/constants";
import { compressImage } from "@/lib/client/image";
import { enqueueReport } from "@/lib/client/offline-queue";
import { cn, distanceM } from "@/lib/format";
import { ChoiceGrid } from "@/components/ui/choice-grid";

type Icon = ComponentType<{ size?: number; className?: string }>;

const CATEGORY_ICON: Record<Category, Icon> = {
  KONDISI_TIDAK_AMAN: TriangleAlert,
  TINDAKAN_TIDAK_AMAN: UserX,
  NYARIS_CELAKA: Siren,
  ERGONOMI: PersonStanding,
  LINGKUNGAN: Droplets,
  BENCANA_ALAM: CloudLightning,
};

const HAZARD_ICON: Record<HazardType, Icon> = {
  MANUSIA: Users,
  PERALATAN: Cog,
  MATERIAL_BERBAHAYA: FlaskConical,
  METODE_KERJA: ListChecks,
  LINGKUNGAN_KERJA: Factory,
  KONDISI_ALAM: CloudLightning,
};

const RISK_HELP: Record<Risk, string> = {
  RENDAH: "Cedera ringan, cukup P3K.",
  SEDANG: "Perlu perawatan medis, kehilangan hari kerja.",
  TINGGI: "Cedera serius atau cacat tetap, kerusakan besar.",
  EKSTREM: "Potensi fatalitas atau kecelakaan massal.",
};

type Area = { id: string; name: string; lat: number | null; lng: number | null; radiusM: number };
type Person = { id: string; name: string; jabatan: string | null };
type Geo = { lat: number; lng: number; accuracy: number };

function Section({ no, title, aside, children }: { no: number; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold tabular-nums text-white">{no}</span>
        <h3 className="min-w-0 flex-1 text-[15px] font-bold text-ink-900">{title}</h3>
        {aside && <div className="shrink-0 text-xs font-medium tabular-nums text-ink-500">{aside}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Req = () => <span className="text-red">*</span>;

export function ReportForm({ areas, personnel, userAreaId, path }: { areas: Area[]; personnel: Person[]; userAreaId: string | null; path: "A" | "B" }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Array<{ blob: Blob; url: string; name: string }>>([]);
  const [areaId, setAreaId] = useState<string>(userAreaId && areas.some((a) => a.id === userAreaId) ? userAreaId : "");
  const [areaTouched, setAreaTouched] = useState(false);
  const [category, setCategory] = useState<Category | "">("");
  const [hazardType, setHazardType] = useState<HazardType | "">("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [risk, setRisk] = useState<Risk | "">("");
  const [immediateAction, setImmediateAction] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [picId, setPicId] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "locked" | "denied" | "unsupported">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number?: string; offline?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGeoState("locked");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    locate();
  }, []);

  // Lokasi diisi otomatis dari area terdekat selama pelapor belum memilih sendiri
  useEffect(() => {
    if (!geo || areaTouched) return;
    let best: { id: string; d: number } | null = null;
    for (const a of areas) {
      if (a.lat == null || a.lng == null) continue;
      const d = distanceM(geo.lat, geo.lng, a.lat, a.lng);
      if (d <= a.radiusM && (!best || d < best.d)) best = { id: a.id, d };
    }
    if (best) setAreaId(best.id);
  }, [geo, areaTouched, areas]);

  const chosen = areas.find((a) => a.id === areaId);
  const outside = !!(geo && chosen && chosen.lat != null && chosen.lng != null && distanceM(geo.lat, geo.lng, chosen.lat, chosen.lng) > chosen.radiusM);

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
    if (!areaId) return "Pilih lokasi temuan.";
    if (!category) return "Pilih kategori bahaya.";
    if (!hazardType) return "Pilih jenis bahaya.";
    if (description.trim().length < 10) return "Uraikan bahaya minimal 10 karakter.";
    if (impact.trim().length < 5) return "Tuliskan dampak yang dapat ditimbulkan.";
    if (!risk) return "Pilih tingkat risiko awal.";
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
      areaId,
      category,
      hazardType,
      riskLevel: risk,
      description: description.trim(),
      impact: impact.trim(),
      immediateAction: immediateAction.trim(),
      suggestion: suggestion.trim(),
      proposedPicId: picId,
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
            ? "Tidak ada sinyal. Laporan dikirim otomatis saat jaringan tersedia."
            : `Nomor laporan ${done.number}. ${path === "A" ? "Superintendent akan memverifikasi." : "Manager akan meninjau."}`}
        </p>
        {done.offline && (
          <button className="btn-primary mt-6" onClick={() => router.push("/laporan")}>
            Kembali ke daftar laporan
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 stagger">
      <Section no={1} title="Foto dan lokasi" aside={`${photos.length}/3 foto`}>
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

        <label className="label mt-5" htmlFor="lokasi">
          Lokasi <Req />
        </label>
        <select
          id="lokasi"
          className="input min-h-11"
          value={areaId}
          onChange={(e) => {
            setAreaId(e.target.value);
            setAreaTouched(true);
          }}
        >
          <option value="">Pilih lokasi</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-ink-600">
            <MapPin size={14} className="shrink-0 text-brand-600" />
            {geoState === "locked" && geo ? (
              <span className="truncate tabular-nums">
                GPS {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}, akurasi {Math.round(geo.accuracy)} m
              </span>
            ) : geoState === "locating" ? (
              <span>Mencari posisi GPS...</span>
            ) : geoState === "denied" ? (
              <span>Izin lokasi ditolak. Laporan tetap dapat dikirim.</span>
            ) : (
              <span>GPS tidak tersedia di perangkat ini.</span>
            )}
          </div>
          <button type="button" onClick={locate} disabled={geoState === "locating"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-white disabled:opacity-50" aria-label="Perbarui GPS" title="Perbarui GPS">
            <RefreshCw size={16} className={geoState === "locating" ? "animate-spin" : ""} />
          </button>
        </div>
        {outside && <p className="mt-2 text-xs text-[#7a5c06]">Posisi GPS berada di luar radius {chosen?.name}. Pastikan lokasi yang dipilih sudah benar.</p>}
      </Section>

      <Section no={2} title="Kategori bahaya">
        <ChoiceGrid multiple={false} ariaLabel="Kategori bahaya" options={CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABEL[c], icon: CATEGORY_ICON[c] }))} selected={category ? [category] : []} onToggle={(k) => setCategory(k as Category)} />
        <div className="label mt-5">
          Jenis bahaya <Req />
        </div>
        <ChoiceGrid multiple={false} ariaLabel="Jenis bahaya" options={HAZARD_TYPES.map((h) => ({ key: h, label: HAZARD_TYPE_LABEL[h], icon: HAZARD_ICON[h] }))} selected={hazardType ? [hazardType] : []} onToggle={(k) => setHazardType(k as HazardType)} />
      </Section>

      <Section no={3} title="Uraian bahaya">
        <label className="label" htmlFor="uraian">
          Uraian bahaya <Req />
        </label>
        <textarea id="uraian" className="input min-h-24" placeholder="Apa bahayanya dan di mana tepatnya." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <label className="label mt-4" htmlFor="dampak">
          Dampak yang dapat ditimbulkan <Req />
        </label>
        <textarea id="dampak" className="input min-h-20" placeholder="Contoh: pekerja tersengat listrik, forklift tergelincir." value={impact} onChange={(e) => setImpact(e.target.value)} maxLength={2000} />
        <div className="label mt-4">
          Tingkat risiko awal <Req />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Tingkat risiko awal">
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
            Risiko Tinggi dan Ekstrem langsung diteruskan ke Manager.
          </div>
        )}
      </Section>

      <Section no={4} title="Usulan perbaikan">
        <label className="label" htmlFor="cepat">
          Tindakan perbaikan cepat
        </label>
        <textarea id="cepat" className="input min-h-20" placeholder="Contoh: area diberi barikade, pekerjaan dihentikan sementara." value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} maxLength={2000} />
        <label className="label mt-4" htmlFor="pencegahan">
          Tindakan pencegahan
        </label>
        <textarea id="pencegahan" className="input min-h-20" placeholder="Contoh: pasang penutup kabel permanen dan rambu peringatan." value={suggestion} onChange={(e) => setSuggestion(e.target.value)} maxLength={2000} />
        <label className="label mt-4" htmlFor="pic">
          Penanggung jawab
        </label>
        <select id="pic" className="input min-h-11" value={picId} onChange={(e) => setPicId(e.target.value)}>
          <option value="">Pilih personel</option>
          {personnel.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.jabatan ? `, ${p.jabatan}` : ""}
            </option>
          ))}
        </select>
      </Section>

      <aside className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:p-5" aria-label="Keterangan">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-800">
          <ShieldCheck size={18} /> Keterangan
        </div>
        <ul className="mt-2.5 space-y-1.5 text-[13px] leading-snug text-ink-700">
          <li className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            Laporan ditinjau dan disetujui Manager sebelum ditindaklanjuti.
          </li>
          <li className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            Pelaporan bertujuan memperbaiki kondisi kerja, bukan mencari kesalahan seseorang.
          </li>
          <li className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            Laporan Anda dijaga kerahasiaannya dan hanya dibuka oleh pihak yang menindaklanjuti.
          </li>
        </ul>
      </aside>

      {error && <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red anim-fade-in">{error}</div>}

      <button type="button" onClick={submit} disabled={busy} className="btn-primary btn-lg w-full">
        <Send size={18} /> {busy ? "Mengirim..." : "Kirim laporan"}
      </button>
    </div>
  );
}
