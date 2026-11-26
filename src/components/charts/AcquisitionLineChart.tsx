import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { formatIDR, formatNumberID } from '@/src/lib/utils';
import type { InventoryItem } from '@/src/types/inventory';

interface AcquisitionLineChartProps {
  items: InventoryItem[];
}

interface PeriodPoint {
  period: string;
  label: string;
  nilaiJuta: number;
  rawNilai: number;
  unitCount: number;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function AcquisitionLineChart({ items }: AcquisitionLineChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Aggregate by semester/year or month-year sorted chronologically (up to last 8 active periods)
  const periodMap = new Map<string, { rawNilai: number; unitCount: number }>();

  for (const item of items) {
    if (!item.tanggalPerolehan || item.tanggalPerolehan.length < 7) continue;
    const ym = item.tanggalPerolehan.slice(0, 7); // YYYY-MM
    const prev = periodMap.get(ym) || { rawNilai: 0, unitCount: 0 };
    periodMap.set(ym, {
      rawNilai: prev.rawNilai + item.jumlah * item.hargaSatuan,
      unitCount: prev.unitCount + item.jumlah,
    });
  }

  const points: PeriodPoint[] = Array.from(periodMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([ym, vals]) => {
      const [y, m] = ym.split('-');
      const monthName = MONTH_SHORT[Math.max(0, Math.min(11, Number(m) - 1))] || m;
      return {
        period: ym,
        label: `${monthName} '${y.slice(2)}`,
        nilaiJuta: Number((vals.rawNilai / 1_000_000).toFixed(2)),
        rawNilai: vals.rawNilai,
        unitCount: vals.unitCount,
      };
    });

  const width = 560;
  const height = 220;
  const padLeft = 46;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxY = Math.max(10, ...points.map((p) => p.nilaiJuta)) * 1.15;

  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? padLeft + chartW / 2
        : padLeft + (i / (points.length - 1)) * chartW;
    const y = padTop + chartH - (p.nilaiJuta / maxY) * chartH;
    return { x, y, ...p };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},${padTop + chartH} L ${coords
          .map((c) => `${c.x},${c.y}`)
          .join(' L ')} L ${coords[coords.length - 1].x},${padTop + chartH} Z`
      : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padTop + chartH - t * chartH,
    val: Math.round(maxY * t),
  }));

  const focused = activeIdx !== null ? coords[activeIdx] : coords[coords.length - 1];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle>Tren Perolehan Aset Sekolah</CardTitle>
          <CardDescription>
            Nilai pengadaan barang per periode (dalam jutaan Rupiah).
          </CardDescription>
        </div>
        {focused && (
          <div className="text-right shrink-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {focused.label}
            </div>
            <div className="font-mono text-sm font-semibold text-[#00529C] dark:text-sky-400 tabular-nums">
              {formatIDR(focused.rawNilai)}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {points.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum ada riwayat tanggal perolehan barang.
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="Grafik garis tren perolehan aset SDN 006 Sungai Buluh"
            >
              <defs>
                <linearGradient id="briAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00529C" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#00529C" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={width - padRight}
                    y2={tick.y}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeDasharray={idx === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
                  >
                    {tick.val}jt
                  </text>
                </g>
              ))}

              {areaPath && <path d={areaPath} fill="url(#briAreaGrad)" />}

              {coords.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#00529C"
                  className="dark:stroke-sky-400"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />
              )}

              {coords.map((pt, i) => {
                const isSelected = activeIdx === i;
                return (
                  <g
                    key={pt.period}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <line
                        x1={pt.x}
                        y1={padTop}
                        x2={pt.x}
                        y2={padTop + chartH}
                        stroke="#F37021"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#F37021' : '#FFFFFF'}
                      stroke={isSelected ? '#F37021' : '#00529C'}
                      className={!isSelected ? 'dark:fill-slate-900 dark:stroke-sky-400' : ''}
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={height - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-medium ${
                        isSelected
                          ? 'fill-[#F37021]'
                          : 'fill-slate-500 dark:fill-slate-400'
                      }`}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            {focused && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 tabular-nums">
                <span>Periode disorot: {focused.label}</span>
                <span>{formatNumberID(focused.unitCount)} unit masuk</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
