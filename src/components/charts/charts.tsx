"use client";

import { forwardRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend, type ChartData, type ChartOptions } from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import type { Chart } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);
// Kanvas tidak mengenal variabel CSS: ambil nama keluarga font yang benar-benar dipakai halaman (next/font memberi nama ber-hash)
ChartJS.defaults.font.family = typeof window !== "undefined" ? getComputedStyle(document.body).fontFamily : "ui-sans-serif, system-ui, sans-serif";
ChartJS.defaults.color = "#4a5a52";

// Palet bertumpu pada hijau merek; warna hangat hanya untuk aksen
export const PALETTE = ["#006042", "#35a885", "#7cc7ad", "#c9a227", "#4a5a52", "#b9c3bd", "#e07a1f", "#bfe3d4"];
/** Ramp hijau berurutan untuk data ordinal (misalnya hierarki pengendalian: eliminasi ke APD) */
export const GREEN_RAMP = ["#003d2a", "#006042", "#138d6b", "#35a885", "#7cc7ad", "#bfe3d4"];
export const RISK_COLORS = { RENDAH: "#2E9E6B", SEDANG: "#D9A520", TINGGI: "#E07A1F", EKSTREM: "#C8373B" };

const base: ChartOptions<"line" | "bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  plugins: { legend: { position: "top", align: "end", labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
  scales: { x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 0, autoSkipPadding: 12 } }, y: { beginAtZero: true, grid: { color: "#eef2ef" }, ticks: { precision: 0, font: { size: 11 } } } },
};

export const LineChart = forwardRef<Chart<"line"> | undefined, { data: ChartData<"line">; options?: ChartOptions<"line"> }>(function LineChart({ data, options }, ref) {
  return <Line ref={ref} data={data} options={{ ...(base as ChartOptions<"line">), ...options }} />;
});

export const BarChart = forwardRef<Chart<"bar"> | undefined, { data: ChartData<"bar">; options?: ChartOptions<"bar">; horizontal?: boolean }>(function BarChart({ data, options, horizontal }, ref) {
  const o: ChartOptions<"bar"> = { ...(base as ChartOptions<"bar">), ...(horizontal ? { indexAxis: "y" as const, scales: { x: { beginAtZero: true, grid: { color: "#eef2ef" }, ticks: { precision: 0 } }, y: { grid: { display: false } } } } : {}), ...options };
  return <Bar ref={ref} data={data} options={o} />;
});

export const DoughnutChart = forwardRef<Chart<"doughnut"> | undefined, { data: ChartData<"doughnut">; options?: ChartOptions<"doughnut"> }>(function DoughnutChart({ data, options }, ref) {
  return (
    <Doughnut
      ref={ref}
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } } },
        ...options,
      }}
    />
  );
});
