"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function MiniTrend({ data }: { data: Array<{ label: string; masuk: number; ditutup: number }> }) {
  return (
    <div className="h-56">
      <Line
        data={{
          labels: data.map((d) => d.label),
          datasets: [
            { label: "Masuk", data: data.map((d) => d.masuk), borderColor: "#0a785b", backgroundColor: "rgba(10,120,91,0.12)", fill: true, tension: 0.35, pointRadius: 3 },
            { label: "Ditutup", data: data.map((d) => d.ditutup), borderColor: "#c9a227", backgroundColor: "rgba(201,162,39,0.08)", fill: true, tension: 0.35, pointRadius: 3 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top", align: "end", labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
          scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { beginAtZero: true, grid: { color: "#eef2ef" }, ticks: { precision: 0, font: { size: 11 } } } },
          animation: { duration: 900, easing: "easeOutQuart" },
        }}
      />
    </div>
  );
}
