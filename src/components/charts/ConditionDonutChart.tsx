import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { formatNumberID } from '@/src/lib/utils';
import type { InventoryItem } from '@/src/types/inventory';

interface ConditionDonutChartProps {
  items: InventoryItem[];
}

export function ConditionDonutChart({ items }: ConditionDonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const totalUnits = items.reduce((sum, it) => sum + it.jumlah, 0);
  const baikUnits = items.filter((it) => it.kondisi === 'Baik').reduce((s, it) => s + it.jumlah, 0);
  const ringanUnits = items
    .filter((it) => it.kondisi === 'Rusak Ringan')
    .reduce((s, it) => s + it.jumlah, 0);
  const beratUnits = items
    .filter((it) => it.kondisi === 'Rusak Berat')
    .reduce((s, it) => s + it.jumlah, 0);

  const verifiedItems = items.filter((it) => it.statusVerifikasi === 'Terverifikasi').length;
  const accuracyPct = items.length > 0 ? Math.round((verifiedItems / items.length) * 100) : 0;

  const segments = [
    { key: 'Baik', label: 'Kondisi Baik', value: baikUnits, color: '#00529C', darkColor: '#3B82F6' },
    { key: 'Rusak Ringan', label: 'Rusak Ringan', value: ringanUnits, color: '#F37021', darkColor: '#FB923C' },
    { key: 'Rusak Berat', label: 'Rusak Berat', value: beratUnits, color: '#DC2626', darkColor: '#EF4444' },
  ];

  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const arcs = segments.map((seg) => {
    const fraction = totalUnits > 0 ? seg.value / totalUnits : 0;
    const dashLength = fraction * circumference;
    const offset = -cumulativeOffset;
    cumulativeOffset += dashLength;
    return {
      ...seg,
      fraction,
      pct: totalUnits > 0 ? Math.round(fraction * 100) : 0,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: offset,
    };
  });

  const activeSeg = arcs.find((a) => a.key === hoveredKey);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Kondisi Fisik & Akurasi Audit</CardTitle>
        <CardDescription>
          Komposisi kondisi unit dan tingkat verifikasi inventaris sekolah.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
        <div className="relative flex items-center justify-center shrink-0">
          <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="transparent"
              strokeWidth={strokeWidth}
              className="stroke-slate-100 dark:stroke-slate-800"
            />
            {totalUnits > 0 &&
              arcs.map((arc) => {
                if (arc.value === 0) return null;
                const isHover = hoveredKey === arc.key;
                return (
                  <circle
                    key={arc.key}
                    cx="88"
                    cy="88"
                    r={radius}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth={isHover ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={arc.dashArray}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="butt"
                    onMouseEnter={() => setHoveredKey(arc.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="transition-all duration-200 cursor-pointer"
                  />
                );
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {activeSeg ? `${activeSeg.pct}%` : `${accuracyPct}%`}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[90px] leading-tight">
              {activeSeg ? activeSeg.label : 'Data Terverifikasi'}
            </span>
          </div>
        </div>

        <div className="w-full space-y-3">
          {arcs.map((seg) => (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer ${
                hoveredKey === seg.key
                  ? 'border-[#00529C]/40 bg-slate-50 dark:bg-slate-800/80'
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatNumberID(seg.value)}
                </span>
                <span className="text-slate-400 dark:text-slate-500 w-9 text-right">
                  {seg.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
