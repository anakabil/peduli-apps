"use client";

import { forwardRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend, type ChartData, type ChartOptions } from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import type { Chart } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);
ChartJS.defaults.font.family = "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif";
ChartJS.defaults.color = "#4a5a52";

export const PALETTE = ["#0a785b", "#c9a227", "#2b6cb0", "#e07a1f", "#7c3aed", "#c8373b", "#35a885", "#8d9a93"];
export const RISK_COLORS = { RENDAH: "#2E9E6B", SEDANG: "#D9A520", TINGGI: "#E07A1F", EKSTREM: "#C8373B" };

const base: ChartOptions<"line" | "bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  plugins: { legend: { position: "top", align: "end", labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
  scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { beginAtZero: true, grid: { color: "#eef2ef" }, ticks: { precision: 0, font: { size: 11 } } } },
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
        cutout: "66%",
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
        ...options,
      }}
    />
  );
});
