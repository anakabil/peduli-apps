"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/format";

export type LatLng = { lat: number; lng: number };
type Other = { name: string; lat: number; lng: number; radiusM: number };

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const BRAND = "#006042";

/**
 * Peta pemilih titik pusat area. Klik peta atau geser penanda untuk memindahkan titik; lingkaran menunjukkan radius.
 * Memakai Google Maps bila NEXT_PUBLIC_GOOGLE_MAPS_API_KEY diatur, selain itu peta terbuka (OpenStreetMap dan citra satelit Esri).
 * Peta baru dimuat ketika wadahnya terlihat, sehingga formulir yang tertutup tidak memuat apa pun.
 */
export function AreaMap({ value, radiusM, center, others, onPick, className }: { value: LatLng | null; radiusM: number; center: LatLng; others: Other[]; onPick: (p: LatLng) => void; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<{ set: (p: LatLng | null, r: number) => void; resize: () => void; destroy: () => void } | null>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  // Tunggu sampai wadah punya ukuran (mis. panel <details> dibuka)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0) {
        setVisible(true);
        api.current?.resize();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !box.current || api.current) return;
    let cancelled = false;
    const el = box.current;
    const start = value ?? center;
    const pick = (p: LatLng) => pickRef.current({ lat: round(p.lat), lng: round(p.lng) });
    // Pustaka dimuat lebih dahulu; peta baru dibuat bila efek ini belum dibatalkan
    (GOOGLE_KEY ? initGoogle(el, start, value, radiusM, others, pick, () => cancelled) : initLeaflet(el, start, value, radiusM, others, pick, () => cancelled))
      .then((a) => {
        if (a) api.current = a;
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      api.current?.destroy();
      api.current = null;
    };
    // Peta dibuat sekali saat terlihat; perubahan titik dan radius diteruskan lewat efek di bawah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    api.current?.set(value, radiusM);
  }, [value, radiusM]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl ring-1 ring-ink-200", className)}>
      <div ref={box} className="h-full w-full bg-ink-50" role="application" aria-label="Peta titik pusat area. Klik peta untuk memindahkan titik." />
      {failed && <div className="absolute inset-0 flex items-center justify-center bg-ink-50 p-4 text-center text-sm text-ink-500">Peta tidak dapat dimuat. Isi koordinat secara manual.</div>}
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

async function initLeaflet(el: HTMLElement, start: LatLng, value: LatLng | null, radiusM: number, others: Other[], pick: (p: LatLng) => void, cancelled: () => boolean) {
  const L: typeof Leaflet = await import("leaflet");
  if (cancelled()) return null;
  const map = L.map(el, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], value ? 16 : 15);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
  const street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" });
  const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Citra &copy; Esri" });
  sat.addTo(map);
  L.control.layers({ Satelit: sat, Jalan: street }, undefined, { position: "topright" }).addTo(map);
  for (const o of others) L.circle([o.lat, o.lng], { radius: o.radiusM, color: "#ffffff", weight: 1, opacity: 0.8, fillOpacity: 0.08, interactive: false }).bindTooltip(o.name, { permanent: false }).addTo(map);
  const icon = L.divIcon({ className: "", html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${BRAND};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`, iconSize: [26, 26], iconAnchor: [13, 26] });
  let marker: Leaflet.Marker | null = null;
  let circle: Leaflet.Circle | null = null;
  const set = (p: LatLng | null, r: number) => {
    if (!p) {
      marker?.remove();
      circle?.remove();
      marker = null;
      circle = null;
      return;
    }
    if (!marker) {
      marker = L.marker([p.lat, p.lng], { icon, draggable: true, keyboard: true, title: "Titik pusat area" }).addTo(map);
      marker.on("dragend", () => {
        const ll = marker!.getLatLng();
        pick({ lat: ll.lat, lng: ll.lng });
      });
      circle = L.circle([p.lat, p.lng], { radius: r, color: BRAND, weight: 2, fillColor: BRAND, fillOpacity: 0.15, interactive: false }).addTo(map);
    } else {
      marker.setLatLng([p.lat, p.lng]);
      circle!.setLatLng([p.lat, p.lng]).setRadius(r);
    }
  };
  set(value, radiusM);
  map.on("click", (e: Leaflet.LeafletMouseEvent) => pick({ lat: e.latlng.lat, lng: e.latlng.lng }));
  return { set, resize: () => map.invalidateSize(), destroy: () => map.remove() };
}

// Tipe minimum Google Maps JavaScript API yang dipakai di sini
type GLatLng = { lat(): number; lng(): number };
type GMapsEvent = { latLng?: GLatLng | null };
type GOverlay = { setMap(m: unknown): void };
type GMarker = GOverlay & { setPosition(p: LatLng): void; getPosition(): GLatLng | null; addListener(e: string, f: () => void): void };
type GCircle = GOverlay & { setCenter(p: LatLng): void; setRadius(r: number): void };
type GMaps = {
  Map: new (el: HTMLElement, o: object) => { addListener(e: string, f: (ev: GMapsEvent) => void): void };
  Marker: new (o: object) => GMarker;
  Circle: new (o: object) => GCircle;
  event: { trigger(target: unknown, name: string): void; clearInstanceListeners(target: unknown): void };
};

let googleLoading: Promise<GMaps> | null = null;
function loadGoogle(): Promise<GMaps> {
  const w = window as unknown as { google?: { maps?: GMaps }; __peduliMapsReady?: () => void };
  if (w.google?.maps?.Map) return Promise.resolve(w.google.maps);
  googleLoading ??= new Promise<GMaps>((resolve, reject) => {
    w.__peduliMapsReady = () => resolve(w.google!.maps!);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&v=weekly&language=id&region=ID&callback=__peduliMapsReady`;
    s.async = true;
    s.onerror = () => {
      googleLoading = null;
      reject(new Error("Google Maps gagal dimuat"));
    };
    document.head.appendChild(s);
  });
  return googleLoading;
}

async function initGoogle(el: HTMLElement, start: LatLng, value: LatLng | null, radiusM: number, others: Other[], pick: (p: LatLng) => void, cancelled: () => boolean) {
  const g = await loadGoogle();
  if (cancelled()) return null;
  const map = new g.Map(el, { center: start, zoom: value ? 17 : 15, mapTypeId: "hybrid", streetViewControl: false, fullscreenControl: false, clickableIcons: false, gestureHandling: "cooperative" });
  for (const o of others) new g.Circle({ map, center: { lat: o.lat, lng: o.lng }, radius: o.radiusM, strokeColor: "#ffffff", strokeWeight: 1, strokeOpacity: 0.8, fillOpacity: 0.08, clickable: false });
  let marker: GMarker | null = null;
  let circle: GCircle | null = null;
  const set = (p: LatLng | null, r: number) => {
    if (!p) {
      marker?.setMap(null);
      circle?.setMap(null);
      marker = null;
      circle = null;
      return;
    }
    if (!marker) {
      marker = new g.Marker({ map, position: p, draggable: true, title: "Titik pusat area" });
      marker.addListener("dragend", () => {
        const ll = marker!.getPosition();
        if (ll) pick({ lat: ll.lat(), lng: ll.lng() });
      });
      circle = new g.Circle({ map, center: p, radius: r, strokeColor: BRAND, strokeWeight: 2, fillColor: BRAND, fillOpacity: 0.15, clickable: false });
    } else {
      marker.setPosition(p);
      circle!.setCenter(p);
      circle!.setRadius(r);
    }
  };
  set(value, radiusM);
  map.addListener("click", (e) => e.latLng && pick({ lat: e.latLng.lat(), lng: e.latLng.lng() }));
  return { set, resize: () => g.event.trigger(map, "resize"), destroy: () => g.event.clearInstanceListeners(map) };
}

/** Membaca koordinat dari tautan Google Maps atau teks "lat, lng" */
export function parseCoords(text: string): LatLng | null {
  const t = decodeURIComponent(text.trim());
  const pats = [/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, /[?&](?:q|query|ll|center|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/];
  for (const p of pats) {
    const m = t.match(p);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat: round(lat), lng: round(lng) };
    }
  }
  return null;
}
