import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { formatIDR, formatNumberID } from '@/src/lib/utils';
import type { InventoryItem } from '@/src/types/inventory';

interface CategoryBarChartProps {
  items: InventoryItem[];
}

export function CategoryBarChart({ items }: CategoryBarChartProps) {
  const [metric, setMetric] = useState<'nilai' | 'unit'>('nilai');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const grouped = items.reduce<Record<string, { label: string; unit: number; nilai: number; count: number }>>(
    (acc, item) => {
      if (!acc[item.kategori]) {
        acc[item.kategori] = { label: item.kategori, unit: 0, nilai: 0, count: 0 };
      }
      acc[item.kategori].unit += item.jumlah;
      acc[item.kategori].nilai += item.jumlah * item.hargaSatuan;
      acc[item.kategori].count += 1;
      return acc;
    },
    {}
  );

  const data = Object.values(grouped).sort((a, b) =>
    metric === 'nilai' ? b.nilai - a.nilai : b.unit - a.unit
  );

  const maxValue = Math.max(
    1,
    ...data.map((d) => (metric === 'nilai' ? d.nilai : d.unit))
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle>Distribusi Aset per Kategori</CardTitle>
          <CardDescription>
            Perbandingan {metric === 'nilai' ? 'total nilai aset (IDR)' : 'jumlah unit barang'} berdasarkan kategori KIB.
          </CardDescription>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setMetric('nilai')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              metric === 'nilai'
                ? 'bg-white dark:bg-slate-900 text-[#00529C] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Nilai (Rp)
          </button>
          <button
            type="button"
            onClick={() => setMetric('unit')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              metric === 'unit'
                ? 'bg-white dark:bg-slate-900 text-[#00529C] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Jumlah Unit
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-3">
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum ada data kategori untuk ditampilkan.
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {data.map((row, idx) => {
              const value = metric === 'nilai' ? row.nilai : row.unit;
              const pct = Math.max(4, Math.round((value / maxValue) * 100));
              const isHovered = hoveredIdx === idx;
              const isAccent = idx === 0;

              return (
                <div
                  key={row.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="group relative space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                      {row.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                      {metric === 'nilai'
                        ? formatIDR(row.nilai)
                        : `${formatNumberID(row.unit)} unit`}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAccent
                          ? isHovered
                            ? 'bg-[#E05E12]'
                            : 'bg-[#F37021]'
                          : isHovered
                            ? 'bg-[#003E78] dark:bg-sky-400'
                            : 'bg-[#00529C] dark:bg-[#2E86DE]'
                      }`}
                    />
                  </div>
                  {isHovered && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {row.count} jenis barang · Total {formatNumberID(row.unit)} unit · Nilai {formatIDR(row.nilai)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
