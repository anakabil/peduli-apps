"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, LocateFixed, Send, X, Lightbulb, AlertTriangle, CheckCircle2, Clock, WifiOff, ChevronDown, ThumbsUp, Wrench, ShieldAlert, Sparkles, Recycle, UtensilsCrossed, FlaskConical, DoorClosed, Tractor, Zap, Lock, Radiation, Anchor, Construction, Package, Truck, Flame, Factory, CircleEllipsis } from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, RISKS, RISK_LABEL, RISK_COLOR, STOP_GROUPS, ACTIVITIES, suggestCategory, type Category, type Risk } from "@/lib/constants";
import { compressImage } from "@/lib/client/image";
import { enqueueReport } from "@/lib/client/offline-queue";
import { cn } from "@/lib/format";
import { ChoiceGrid } from "@/components/ui/choice-grid";

const ACTIVITY_ICON: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  HOUSEKEEPING: Recycle,
  CATERING: UtensilsCrossed,
  KIMIA: FlaskConical,
  RUANG_TERBATAS: DoorClosed,
  ALAT_BERAT: Tractor,
  LISTRIK: Zap,
  LOTO: Lock,
  RADIOGRAFI: Radiation,
  ANGKAT: Anchor,
  KETINGGIAN: Construction,
  MANUAL: Package,
  TRANSPORTASI: Truck,
  PANAS: Flame,
  OPERASI: Factory,
  PERAWATAN: Wrench,
  LAINNYA: CircleEllipsis,
};

type Area = { id: string; name: string; code: string };
type Geo = { lat: number; lng: number; accuracy: number; at: Date };

const RISK_HELP: Record<Risk, string> = {
  RENDAH: "Cedera ringan, dapat ditangani dengan P3K.",
  SEDANG: "Cedera memerlukan perawatan medis, kehilangan hari kerja.",
  TINGGI: "Cedera serius atau cacat tetap, kerusakan besar.",
  EKSTREM: "Potensi fatalitas atau kecelakaan massal.",
};

const CYCLE = ["Memutuskan", "Berhenti", "Mengamati", "Bertindak", "Melapor"];

function Section({ no, title, hint, children, className = "" }: { no: number; title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">{no}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink-900">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ReportForm({ areas, userAreaId, path }: { areas: Area[]; userAreaId: string | null; path: "A" | "B" }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Array<{ blob: Blob; url: string; name: string }>>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(STOP_GROUPS[0].key);
  const [category, setCategory] = useState<Category | "">("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [risk, setRisk] = useState<Risk | "">("");
  const [safeActs, setSafeActs] = useState("");
  const [safeEncourage, setSafeEncourage] = useState("");
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "locked" | "denied" | "unsupported">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number?: string; offline?: boolean } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggested = useMemo(() => suggestCategory(items), [items]);
  // Kategori mengikuti saran dari daftar periksa selama pengguna belum memilih sendiri
  useEffect(() => {
    if (!categoryTouched && suggested) setCategory(suggested);
  }, [suggested, categoryTouched]);

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

  const toggle = (list: string[], setList: (v: string[]) => void, key: string) => setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

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
    if (activities.length === 0) return "Pilih minimal satu aktivitas yang diobservasi.";
    if (!category) return "Pilih kategori bahaya.";
    if (!risk) return "Pilih tingkat risiko awal.";
    if (description.trim().length < 10) return "Uraikan tindakan atau kondisi tidak aman minimal 10 karakter.";
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
      safeActs: safeActs.trim(),
      safeEncourage: safeEncourage.trim(),
      immediateAction: immediateAction.trim(),
      stopItems: items.join(","),
      activities: activities.join(","),
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
        <h2 className="mt-4 text-xl font-bold">{done.offline ? "Tersimpan di perangkat" : "Kartu STOP terkirim"}</h2>
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
      {/* Siklus pengamatan STOP */}
      <div className="card flex flex-wrap items-center justify-center gap-1.5 px-4 py-3 text-[11px] font-semibold text-ink-600">
        <span className="mr-1 rounded-md bg-red px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">STOP</span>
        {CYCLE.map((c, i) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="rounded-full bg-ink-100 px-2.5 py-1">{c}</span>
            {i < CYCLE.length - 1 && <span className="text-ink-300">&rarr;</span>}
          </span>
        ))}
      </div>

      <Section no={1} title="Foto dari kamera" hint="Foto hanya dapat diambil langsung dari kamera untuk menjaga akurasi bukti.">
        <div className="mb-2 flex justify-end text-xs text-ink-500">{photos.length}/3</div>
        <div className="grid grid-cols-3 gap-2">
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
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50">
              <Camera size={26} />
              <span className="text-xs font-semibold">Ambil foto</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addPhoto(e.target.files)} />
      </Section>

      <Section no={2} title="Aktivitas yang diobservasi" hint="Pilih satu atau lebih pekerjaan yang sedang Anda amati.">
        <ChoiceGrid
          ariaLabel="Aktivitas yang diobservasi"
          options={ACTIVITIES.map((a) => ({ ...a, icon: ACTIVITY_ICON[a.key] }))}
          selected={activities}
          onToggle={(k) => toggle(activities, setActivities, k)}
        />
      </Section>

      <Section no={3} title="Daftar periksa pengamatan" hint="Centang hal yang tidak aman. Kategori bahaya akan disarankan otomatis.">
        <div className="space-y-2">
          {STOP_GROUPS.map((g) => {
            const count = g.items.filter((i) => items.includes(i.key)).length;
            const open = openGroup === g.key;
            return (
              <div key={g.key} className={cn("overflow-hidden rounded-xl border transition-colors", count ? "border-red/40" : "border-ink-200")}>
                <button type="button" onClick={() => setOpenGroup(open ? null : g.key)} className={cn("flex w-full items-center justify-between gap-3 px-4 py-3 text-left", count ? "bg-red/5" : "bg-white")}>
                  <span>
                    <span className="block text-sm font-bold uppercase tracking-wide text-ink-800">{g.label}</span>
                    <span className="block text-[11px] text-ink-500">{g.hint}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {count > 0 && <span className="badge bg-red text-white">{count}</span>}
                    <ChevronDown size={16} className={cn("text-ink-400 transition-transform", open && "rotate-180")} />
                  </span>
                </button>
                {open && (
                  <div className="grid grid-cols-1 gap-1.5 border-t border-ink-100 bg-white p-3 sm:grid-cols-2 anim-fade-in">
                    {g.items.map((it) => {
                      const on = items.includes(it.key);
                      return (
                        <label key={it.key} className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors", on ? "border-red/40 bg-red/5 text-ink-900" : "border-ink-100 hover:border-ink-300")}>
                          <input type="checkbox" checked={on} onChange={() => toggle(items, setItems, it.key)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--red)]" />
                          <span>{it.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {items.length > 0 && <p className="mt-2 text-xs text-ink-500">{items.length} kriteria tidak aman dipilih.</p>}
      </Section>

      <Section no={4} title="Kategori dan tingkat risiko">
        <label className="label">Kategori bahaya <span className="text-red">*</span></label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => { setCategory(c); setCategoryTouched(true); }} className={cn("chip", category === c && "chip-active")}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        {suggested && !categoryTouched && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700"><Sparkles size={13} /> Disarankan dari daftar periksa: {CATEGORY_LABEL[suggested]}</p>
        )}
        <label className="label mt-5">Tingkat risiko awal <span className="text-red">*</span></label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RISKS.map((r) => (
            <button key={r} type="button" onClick={() => setRisk(r)} className={cn("rounded-xl border px-3 py-2.5 text-left transition-all", risk === r ? "border-transparent text-white shadow-soft" : "border-ink-200 bg-white hover:border-ink-300")} style={risk === r ? { background: RISK_COLOR[r] } : undefined}>
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
      </Section>

      <Section no={5} title="Tindakan aman yang diobservasi" hint="Opsional. Apresiasi perilaku aman yang Anda lihat.">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700"><ThumbsUp size={14} /> Tindakan aman</div>
        <textarea className="input mt-1.5 min-h-16" placeholder="Contoh: operator memakai full body harness dan mengaitkan lanyard sebelum naik." value={safeActs} onChange={(e) => setSafeActs(e.target.value)} maxLength={2000} />
        <div className="mt-3 text-xs font-semibold text-brand-700">Tindakan untuk mendorong kinerja aman tetap dilanjutkan</div>
        <textarea className="input mt-1.5 min-h-16" placeholder="Contoh: memberi pujian langsung dan menyampaikannya di safety talk." value={safeEncourage} onChange={(e) => setSafeEncourage(e.target.value)} maxLength={2000} />
      </Section>

      <Section no={6} title="Tindakan tidak aman yang diobservasi" hint="Wajib. Uraikan apa, di mana, dan siapa yang terpapar.">
        <div className="flex items-center gap-2 text-xs font-semibold text-red"><ShieldAlert size={14} /> Tindakan atau kondisi tidak aman <span className="text-red">*</span></div>
        <textarea className="input mt-1.5 min-h-24" placeholder="Tulis uraian singkat: apa bahayanya, di mana, siapa yang terpapar." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-700"><Wrench size={14} /> Tindakan perbaikan yang langsung dilakukan</div>
        <textarea className="input mt-1.5 min-h-16" placeholder="Contoh: pekerjaan dihentikan, area diberi barikade, pekerja diarahkan memakai kacamata." value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} maxLength={2000} />
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-700"><Lightbulb size={14} className="text-gold" /> Tindakan pencegahan agar tidak terulang (bonus poin bila diterapkan)</div>
        <textarea className="input mt-1.5 min-h-16" placeholder="Contoh: pasang penutup kabel permanen dan tambahkan rambu peringatan." value={suggestion} onChange={(e) => setSuggestion(e.target.value)} maxLength={2000} />
      </Section>

      <Section no={7} title="Lokasi dan waktu" hint="Terekam otomatis saat laporan dibuat." className={geoState === "locked" ? "border-l-4 border-l-brand-500" : "border-l-4 border-l-amber"}>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5 text-sm">
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
          <button type="button" onClick={locate} className="btn-ghost btn-sm shrink-0">
            <LocateFixed size={14} /> {geoState === "locating" ? "Mencari..." : "Perbarui"}
          </button>
        </div>
        <div className="mt-3">
          <label className="label">Keterangan lokasi (opsional)</label>
          <input className="input" placeholder="Contoh: Gudang bahan baku, dekat jalur forklift 2" value={areaLabel} onChange={(e) => setAreaLabel(e.target.value)} list="area-list" />
          <datalist id="area-list">
            {areas.map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>
          <p className="help">Area kerja ditentukan otomatis dari koordinat GPS{userAreaId ? ", cadangan dari area profil Anda" : ""}. Nama observer dan departemen diambil dari akun Anda.</p>
        </div>
      </Section>

      {error && <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red anim-fade-in">{error}</div>}

      <button type="button" onClick={submit} disabled={busy} className="btn-primary btn-lg w-full">
        <Send size={18} /> {busy ? "Mengirim..." : "Kirim kartu STOP"}
      </button>
      <p className="text-center text-xs text-ink-400">Nomor laporan unik, identitas, dan peran pelapor terekam otomatis.</p>
    </div>
  );
}
