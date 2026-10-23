"use client";

import { useState } from "react";
import { Crosshair, ExternalLink, Loader2 } from "lucide-react";
import { saveAreaAction } from "../actions";
import { useFormAction, Msg } from "../feedback";
import { Field } from "@/components/ui";
import { AreaMap, parseCoords, type LatLng } from "@/components/map/area-map";

type AreaData = { id: string; code: string; name: string; lat: number | null; lng: number | null; radiusM: number; managerId: string | null; active: boolean };
type Other = { id: string; name: string; lat: number; lng: number; radiusM: number };

export function AreaForm({ area, managers, center, others }: { area?: AreaData; managers: Array<{ id: string; name: string }>; center: LatLng; others: Other[] }) {
  const { pending, res, action } = useFormAction((fd) => saveAreaAction(area?.id ?? null, fd));
  const [lat, setLat] = useState(area?.lat != null ? String(area.lat) : "");
  const [lng, setLng] = useState(area?.lng != null ? String(area.lng) : "");
  const [radius, setRadius] = useState(area?.radiusM ?? 300);
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const point = lat !== "" && lng !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? { lat: Number(lat), lng: Number(lng) } : null;
  const setPoint = (p: LatLng) => {
    setLat(String(p.lat));
    setLng(String(p.lng));
  };
  const applyPaste = (text: string) => {
    setPaste(text);
    if (!text.trim()) return setNote(null);
    const p = parseCoords(text);
    if (p) {
      setPoint(p);
      setNote("Titik diperbarui dari Google Maps.");
    } else if (/goo\.gl|maps\.app/.test(text)) {
      setNote("Tautan pendek tidak memuat koordinat. Di Google Maps, klik kanan titik lalu salin angka koordinatnya.");
    } else setNote("Koordinat tidak dikenali.");
  };
  const useMyLocation = () => {
    if (!navigator.geolocation) return setNote("GPS tidak tersedia di perangkat ini.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: Math.round(pos.coords.latitude * 1e6) / 1e6, lng: Math.round(pos.coords.longitude * 1e6) / 1e6 });
        setNote(`Titik diambil dari GPS, akurasi ${Math.round(pos.coords.accuracy)} m.`);
        setLocating(false);
      },
      () => {
        setNote("Lokasi tidak dapat diambil. Periksa izin lokasi.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Kode" required><input name="code" className="input" defaultValue={area?.code ?? ""} maxLength={8} required /></Field>
      <Field label="Nama" required><input name="name" className="input" defaultValue={area?.name ?? ""} required /></Field>

      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-ink-700">Titik pusat</span>
          <div className="flex gap-1.5">
            <button type="button" onClick={useMyLocation} disabled={locating} className="btn-ghost btn-sm min-h-11 md:min-h-0">
              {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />} Lokasi saya
            </button>
            {point && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm min-h-11 md:min-h-0">
                <ExternalLink size={14} /> Google Maps
              </a>
            )}
          </div>
        </div>
        <AreaMap value={point} radiusM={radius} center={point ?? center} others={others.filter((o) => o.id !== area?.id)} onPick={(p) => { setPoint(p); setNote(null); }} className="h-64 sm:h-72" />
        <input
          className="input"
          value={paste}
          onChange={(e) => applyPaste(e.target.value)}
          placeholder="Tempel tautan Google Maps atau koordinat"
          aria-label="Tempel tautan Google Maps atau koordinat"
        />
        <p className="text-xs text-ink-500" aria-live="polite">{note ?? "Klik peta atau geser penanda untuk menetapkan titik."}</p>
      </div>

      <Field label="Latitude"><input name="lat" type="number" step="any" className="input tabular-nums" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-5.9955" /></Field>
      <Field label="Longitude"><input name="lng" type="number" step="any" className="input tabular-nums" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.0152" /></Field>
      <Field label="Radius (m)">
        <input name="radiusM" type="number" className="input tabular-nums" value={radius} onChange={(e) => setRadius(Math.max(0, Number(e.target.value) || 0))} min={20} max={5000} />
      </Field>
      <Field label="Manager area">
        <select name="managerId" className="input" defaultValue={area?.managerId ?? ""}>
          <option value="">-</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      {area && (
        <Field label="Status">
          <select name="active" className="input" defaultValue={area.active ? "true" : "false"}>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </Field>
      )}
      <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <Msg res={res} />
        <button disabled={pending} className="btn-primary min-h-11 sm:ml-auto md:min-h-0">{pending ? "Menyimpan..." : area ? "Simpan perubahan" : "Tambah area"}</button>
      </div>
    </form>
  );
}
