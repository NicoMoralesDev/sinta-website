import type { ResultStatus } from "@/lib/server/history/types";

type SparklinePositionsProps = {
  positions: number[];
  label: string;
  lang?: "es" | "en";
};

type TopXDistributionBarsProps = {
  wins: number;
  podiums: number;
  top5: number;
  top10: number;
  title: string;
};

type StatusDonutProps = {
  completed: number;
  dnf: number;
  dnq: number;
  dsq: number;
  absent: number;
  title: string;
  lang?: "es" | "en";
};

type RoundHeatmapProps = {
  title: string;
  items: Array<{
    roundLabel: string;
    position: number | null;
    status: ResultStatus | null;
  }>;
  lang?: "es" | "en";
};

function clampRatio(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

export function SparklinePositions({ positions, label, lang = "en" }: SparklinePositionsProps) {
  const i18n =
    lang === "es"
      ? {
          noData: "No hay posiciones numéricas disponibles.",
          best: "Mejor",
          worst: "Peor",
        }
      : {
          noData: "No numeric positions available.",
          best: "Best",
          worst: "Worst",
        };

  if (positions.length === 0) {
    return (
      <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-4">
        <p className="text-xs text-racing-white/60">{label}</p>
        <p className="mt-2 text-sm text-racing-white/50">{i18n.noData}</p>
      </div>
    );
  }

  const width = 280;
  const height = 72;
  const padding = 8;
  const min = Math.min(...positions);
  const max = Math.max(...positions);
  const range = Math.max(1, max - min);

  const points = positions.map((position, index) => {
    const x = padding + (index / Math.max(1, positions.length - 1)) * (width - padding * 2);
    const y = padding + ((position - min) / range) * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-4">
      <p className="text-xs font-semibold tracking-wider text-racing-white/70 uppercase">{label}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-18 w-full"
        role="img"
        aria-label={label}
      >
        <polyline
          fill="none"
          stroke="rgb(250 204 21)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />
      </svg>
      <p className="mt-2 text-[11px] text-racing-white/50">
        {i18n.best}: P{min} | {i18n.worst}: P{max}
      </p>
    </div>
  );
}

export function TopXDistributionBars({
  wins,
  podiums,
  top5,
  top10,
  title,
}: TopXDistributionBarsProps) {
  const rows = [
    { label: "Top 1", value: wins },
    { label: "Top 3", value: podiums },
    { label: "Top 5", value: top5 },
    { label: "Top 10", value: top10 },
  ];
  const maxValue = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-4">
      <p className="text-xs font-semibold tracking-wider text-racing-white/70 uppercase">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-racing-white/70">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm bg-racing-steel/30">
              <div
                className="h-full bg-racing-yellow"
                style={{ width: `${(row.value / maxValue) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusDonut({ completed, dnf, dnq, dsq, absent, title, lang = "en" }: StatusDonutProps) {
  const completedLabel = lang === "es" ? "Completadas" : "Completed";

  const values = [
    { label: completedLabel, value: completed, color: "#facc15" },
    { label: "DNF", value: dnf, color: "#ef4444" },
    { label: "DNQ", value: dnq, color: "#fb923c" },
    { label: "DSQ", value: dsq, color: "#d946ef" },
    { label: "ABSENT", value: absent, color: "#94a3b8" },
  ];
  const total = Math.max(1, values.reduce((sum, item) => sum + item.value, 0));

  let offset = 0;
  const segments = values
    .map((item) => {
      const start = clampRatio(offset / total);
      offset += item.value;
      const end = clampRatio(offset / total);
      return `${item.color} ${(start * 100).toFixed(2)}% ${(end * 100).toFixed(2)}%`;
    })
    .join(", ");

  return (
    <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-4">
      <p className="text-xs font-semibold tracking-wider text-racing-white/70 uppercase">{title}</p>
      <div className="mt-3 flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-full border border-racing-steel/40"
          style={{ background: `conic-gradient(${segments})` }}
          aria-label={title}
        />
        <ul className="space-y-1 text-[11px] text-racing-white/70">
          {values.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span>{item.label}</span>
              <span className="text-racing-white/50">({item.value})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getHeatColor(position: number | null, status: ResultStatus | null): string {
  if (status === "DNF") {
    return "bg-red-500/70";
  }

  if (status === "DNQ") {
    return "bg-orange-400/70";
  }

  if (status === "DSQ") {
    return "bg-fuchsia-500/70";
  }

  if (status === "ABSENT") {
    return "bg-slate-500/70";
  }

  if (position === null) {
    return "bg-racing-steel/40";
  }

  if (position === 1) {
    return "bg-racing-yellow";
  }

  if (position <= 3) {
    return "bg-emerald-400/80";
  }

  if (position <= 10) {
    return "bg-sky-400/70";
  }

  return "bg-racing-steel/70";
}

export function RoundHeatmap({ title, items, lang = "en" }: RoundHeatmapProps) {
  const i18n =
    lang === "es"
      ? {
          noRounds: "No hay rondas cargadas.",
          legend: "Amarillo: victoria | Verde: podio | Azul: top 10",
        }
      : {
          noRounds: "No rounds loaded.",
          legend: "Yellow: win | Green: podium | Blue: top 10",
        };

  return (
    <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-4">
      <p className="text-xs font-semibold tracking-wider text-racing-white/70 uppercase">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-racing-white/50">{i18n.noRounds}</p>
      ) : (
        <div className="mt-3 grid grid-cols-8 gap-1">
          {items.map((item) => (
            <div
              key={item.roundLabel}
              className={`h-6 rounded-sm border border-racing-black/30 ${getHeatColor(item.position, item.status)}`}
              title={`${item.roundLabel}: ${item.position !== null ? `P${item.position}` : item.status ?? "-"}`}
              aria-label={`${item.roundLabel}: ${item.position !== null ? `P${item.position}` : item.status ?? "-"}`}
            />
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-racing-white/50">{i18n.legend}</p>
    </div>
  );
}
