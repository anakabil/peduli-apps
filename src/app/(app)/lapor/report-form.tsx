"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, RefreshCw, Send, X, AlertTriangle, ShieldCheck } from "lucide-react";
import { CATEGORIES, HAZARD_TYPES, RISKS, RISK_COLOR, labels, type Category, type HazardType, type Risk } from "@/lib/constants";
import { compressImage } from "@/lib/client/image";
import { enqueueReport } from "@/lib/client/offline-queue";
import { cn, distanceM } from "@/lib/format";
import { ChoiceGrid } from "@/components/ui/choice-grid";
import { CATEGORY_IMG, HAZARD_IMG, ILLUSTRATION } from "@/lib/icons";
import { useLang, useTr } from "@/components/i18n/lang-provider";
import type { Tr } from "@/lib/i18n";


const riskHelp = (tr: Tr): Record<Risk, string> => ({
  RENDAH: tr("Cedera ringan, cukup P3K.", "Minor injury, first aid only."),
  SEDANG: tr("Perlu perawatan medis, kehilangan hari kerja.", "Requires medical treatment, lost work days."),
  TINGGI: tr("Cedera serius atau cacat tetap, kerusakan besar.", "Serious injury or permanent disability, major damage."),
  EKSTREM: tr("Potensi fatalitas atau kecelakaan massal.", "Potential fatality or mass casualty incident."),
});

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
  const tr = useTr();
  const L = labels(useLang());
  const RISK_HELP = riskHelp(tr);
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
    if (photos.length === 0) return tr("Ambil minimal satu foto dari kamera.", "Take at least one photo with the camera.");
    if (!areaId) return tr("Pilih lokasi temuan.", "Select the location of the finding.");
    if (!category) return tr("Pilih jenis bahaya.", "Select the hazard type.");
    if (!hazardType) return tr("Pilih sumber bahaya.", "Select the hazard source.");
    if (description.trim().length < 10) return tr("Uraikan bahaya minimal 10 karakter.", "Describe the hazard in at least 10 characters.");
    if (impact.trim().length < 5) return tr("Tuliskan dampak yang dapat ditimbulkan.", "Describe the potential impact.");
    if (!risk) return tr("Pilih tingkat risiko awal.", "Select the initial risk level.");
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
        setError(body.error || tr("Gagal mengirim laporan.", "Failed to submit the report."));
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={done.offline ? ILLUSTRATION.luring : ILLUSTRATION.laporanTerkirim} alt="" aria-hidden width={240} height={180} className="mx-auto h-auto w-56 max-w-full" />
        <h2 className="mt-4 text-xl font-bold">{done.offline ? tr("Tersimpan di perangkat", "Saved on this device") : tr("Laporan terkirim", "Report submitted")}</h2>
        <p className="mt-2 text-sm text-ink-500">
          {done.offline
            ? tr("Tidak ada sinyal. Laporan dikirim otomatis saat jaringan tersedia.", "No signal. The report will be sent automatically when a connection is available.")
            : tr(
                `Nomor laporan ${done.number}. ${path === "A" ? "Superintendent akan memverifikasi." : "Manager akan meninjau."}`,
                `Report number ${done.number}. ${path === "A" ? "The Superintendent will verify it." : "The Manager will review it."}`
              )}
        </p>
        {done.offline && (
          <button className="btn-primary mt-6" onClick={() => router.push("/laporan")}>
            {tr("Kembali ke daftar laporan", "Back to report list")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 stagger">
      <Section no={1} title={tr("Foto dan lokasi", "Photos and location")} aside={tr(`${photos.length}/3 foto`, `${photos.length}/3 photos`)}>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl border border-ink-200 anim-scale-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={tr(`Foto ${i + 1}`, `Photo ${i + 1}`)} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/70 text-white" aria-label={tr("Hapus foto", "Remove photo")}>
                <X size={15} />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50">
              <Camera size={26} />
              <span className="text-xs font-semibold">{tr("Ambil foto", "Take photo")}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addPhoto(e.target.files)} />

        <label className="label mt-5" htmlFor="lokasi">
          {tr("Lokasi", "Location")} <Req />
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
          <option value="">{tr("Pilih lokasi", "Select location")}</option>
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
                GPS {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}, {tr("akurasi", "accuracy")} {Math.round(geo.accuracy)} m
              </span>
            ) : geoState === "locating" ? (
              <span>{tr("Mencari posisi GPS...", "Locating GPS position...")}</span>
            ) : geoState === "denied" ? (
              <span>{tr("Izin lokasi ditolak. Laporan tetap dapat dikirim.", "Location permission denied. The report can still be submitted.")}</span>
            ) : (
              <span>{tr("GPS tidak tersedia di perangkat ini.", "GPS is not available on this device.")}</span>
            )}
          </div>
          <button type="button" onClick={locate} disabled={geoState === "locating"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-white disabled:opacity-50" aria-label={tr("Perbarui GPS", "Refresh GPS")} title={tr("Perbarui GPS", "Refresh GPS")}>
            <RefreshCw size={16} className={geoState === "locating" ? "animate-spin" : ""} />
          </button>
        </div>
        {outside && (
          <p className="mt-2 text-xs text-[#7a5c06]">
            {tr(
              `Posisi GPS berada di luar radius ${chosen?.name}. Pastikan lokasi yang dipilih sudah benar.`,
              `The GPS position is outside the radius of ${chosen?.name}. Make sure the selected location is correct.`
            )}
          </p>
        )}
      </Section>

      <Section no={2} title={tr("Jenis dan sumber bahaya", "Hazard type and source")}>
        <div className="label">
          {tr("Jenis bahaya", "Hazard type")} <Req />
        </div>
        <p className="-mt-1 mb-2 text-xs text-ink-500">{tr("Bentuk bahaya yang ditemukan.", "The form the hazard takes.")}</p>
        <ChoiceGrid multiple={false} ariaLabel={tr("Jenis bahaya", "Hazard type")} options={CATEGORIES.map((c) => ({ key: c, label: L.CATEGORY_LABEL[c], image: CATEGORY_IMG[c] }))} selected={category ? [category] : []} onToggle={(k) => setCategory(k as Category)} />
        <div className="label mt-5">
          {tr("Sumber bahaya", "Hazard source")} <Req />
        </div>
        <p className="-mt-1 mb-2 text-xs text-ink-500">{tr("Asal bahaya tersebut.", "Where the hazard comes from.")}</p>
        <ChoiceGrid multiple={false} ariaLabel={tr("Sumber bahaya", "Hazard source")} options={HAZARD_TYPES.map((h) => ({ key: h, label: L.HAZARD_TYPE_LABEL[h], image: HAZARD_IMG[h] }))} selected={hazardType ? [hazardType] : []} onToggle={(k) => setHazardType(k as HazardType)} />
      </Section>

      <Section no={3} title={tr("Uraian bahaya", "Hazard description")}>
        <label className="label" htmlFor="uraian">
          {tr("Uraian bahaya", "Hazard description")} <Req />
        </label>
        <textarea id="uraian" className="input min-h-24" placeholder={tr("Apa bahayanya dan di mana tepatnya.", "What the hazard is and exactly where it is.")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <label className="label mt-4" htmlFor="dampak">
          {tr("Dampak yang dapat ditimbulkan", "Potential impact")} <Req />
        </label>
        <textarea id="dampak" className="input min-h-20" placeholder={tr("Contoh: pekerja tersengat listrik, forklift tergelincir.", "Example: worker receives an electric shock, forklift skids.")} value={impact} onChange={(e) => setImpact(e.target.value)} maxLength={2000} />
        <div className="label mt-4">
          {tr("Tingkat risiko awal", "Initial risk level")} <Req />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={tr("Tingkat risiko awal", "Initial risk level")}>
          {RISKS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={risk === r} onClick={() => setRisk(r)} className={cn("flex h-full flex-col justify-start rounded-xl border bg-white px-3 py-2.5 text-left transition-colors", risk === r ? "ring-1" : "border-ink-200 hover:border-ink-300")} style={risk === r ? { borderColor: RISK_COLOR[r], background: `${RISK_COLOR[r]}14`, ["--tw-ring-color" as string]: RISK_COLOR[r] } : undefined}>
              <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLOR[r] }} />
                {L.RISK_LABEL[r]}
              </span>
              <span className="mt-1 text-xs leading-snug text-ink-600">{RISK_HELP[r]}</span>
            </button>
          ))}
        </div>
        {(risk === "TINGGI" || risk === "EKSTREM") && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange/10 px-3 py-2 text-xs text-ink-800 anim-fade-in">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange" />
            {tr("Risiko Tinggi dan Ekstrem langsung diteruskan ke Manager.", "High and Extreme risks go directly to the Manager.")}
          </div>
        )}
      </Section>

      <Section no={4} title={tr("Usulan perbaikan", "Suggested action")}>
        <label className="label" htmlFor="cepat">
          {tr("Tindakan perbaikan cepat", "Immediate action")}
        </label>
        <textarea id="cepat" className="input min-h-20" placeholder={tr("Contoh: area diberi barikade, pekerjaan dihentikan sementara.", "Example: area barricaded, work temporarily stopped.")} value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} maxLength={2000} />
        <label className="label mt-4" htmlFor="pencegahan">
          {tr("Tindakan pencegahan", "Preventive action")}
        </label>
        <textarea id="pencegahan" className="input min-h-20" placeholder={tr("Contoh: pasang penutup kabel permanen dan rambu peringatan.", "Example: install permanent cable covers and warning signs.")} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} maxLength={2000} />
        <label className="label mt-4" htmlFor="pic">
          {tr("Penanggung jawab", "Person in charge (PIC)")}
        </label>
        <select id="pic" className="input min-h-11" value={picId} onChange={(e) => setPicId(e.target.value)}>
          <option value="">{tr("Pilih personel", "Select personnel")}</option>
          {personnel.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.jabatan ? `, ${p.jabatan}` : ""}
            </option>
          ))}
        </select>
      </Section>

      <aside className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:p-5" aria-label={tr("Keterangan", "Notes")}>
        <div className="flex items-center gap-2 text-sm font-bold text-brand-800">
          <ShieldCheck size={18} /> {tr("Keterangan", "Notes")}
        </div>
        <ul className="mt-2.5 space-y-1.5 text-[13px] leading-snug text-ink-700">
          <li className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            {tr("Laporan ditinjau dan disetujui Manager sebelum ditindaklanjuti.", "Reports are reviewed and approved by the Manager before follow-up.")}
          </li>
          <li className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            {tr("Pelaporan bertujuan memperbaiki kondisi kerja, bukan mencari kesalahan seseorang.", "Reporting aims to improve working conditions, not to find fault with anyone.")}
          </li>
          <li className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            {tr("Laporan Anda dijaga kerahasiaannya dan hanya dibuka oleh pihak yang menindaklanjuti.", "Your report is kept confidential and is opened only by those handling the follow-up.")}
          </li>
        </ul>
      </aside>

      {error && <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red anim-fade-in">{error}</div>}

      <button type="button" onClick={submit} disabled={busy} className="btn-primary btn-lg w-full">
        <Send size={18} /> {busy ? tr("Mengirim...", "Submitting...") : tr("Kirim laporan", "Submit report")}
      </button>
    </div>
  );
}
