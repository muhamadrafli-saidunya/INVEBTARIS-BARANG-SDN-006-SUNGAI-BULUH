import {
  AlertCircle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { CategoryBarChart } from '@/src/components/charts/CategoryBarChart';
import { AcquisitionLineChart } from '@/src/components/charts/AcquisitionLineChart';
import { ConditionDonutChart } from '@/src/components/charts/ConditionDonutChart';
import { KondisiBadge, VerifikasiBadge } from '@/src/components/inventory/StatusBadge';
import { formatDateID, formatIDR, formatNumberID } from '@/src/lib/utils';
import type { AuditLog, InventoryItem, Room } from '@/src/types/inventory';

interface DashboardOverviewProps {
  items: InventoryItem[];
  rooms: Room[];
  auditLogs: AuditLog[];
  loading: boolean;
  onNavigate: (tab: 'inventory' | 'rooms' | 'audit') => void;
  onInspectItem: (item: InventoryItem) => void;
  onAddNew: () => void;
}

export function DashboardOverview({
  items,
  rooms,
  auditLogs,
  loading,
  onNavigate,
  onInspectItem,
  onAddNew,
}: DashboardOverviewProps) {
  const totalJenis = items.length;
  const totalUnit = items.reduce((sum, it) => sum + it.jumlah, 0);
  const totalNilai = items.reduce((sum, it) => sum + it.jumlah * it.hargaSatuan, 0);
  const verifiedCount = items.filter((it) => it.statusVerifikasi === 'Terverifikasi').length;
  const akurasiPersen = totalJenis > 0 ? Math.round((verifiedCount / totalJenis) * 100) : 0;
  const perluPerhatian = items.filter(
    (it) => it.statusVerifikasi !== 'Terverifikasi' || it.kondisi !== 'Baik'
  ).length;

  const recentItems = items.slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
          <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Aset Terdaftar
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#00529C] dark:text-sky-400">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatNumberID(totalUnit)} <span className="text-sm font-normal text-slate-500">unit</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {formatNumberID(totalJenis)} jenis barang · {rooms.length} ruangan
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Valuasi Inventaris
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#00529C] dark:text-sky-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-mono text-xl sm:text-2xl font-bold text-[#00529C] dark:text-sky-400 tabular-nums truncate">
              {formatIDR(totalNilai)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Akumulasi nilai perolehan (IDR)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Akurasi Data Sekolah
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {akurasiPersen}%
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {verifiedCount} dari {totalJenis} item terverifikasi
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Perlu Audit / Perbaikan
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#F37021]">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-[#F37021] tabular-nums">
              {perluPerhatian} <span className="text-sm font-normal text-slate-500">item</span>
            </div>
            <div className="mt-1">
              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#00529C] dark:text-sky-400 hover:underline cursor-pointer"
              >
                <span>Buka pusat audit akurasi</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AcquisitionLineChart items={items} />
        </div>
        <div className="lg:col-span-5">
          <ConditionDonutChart items={items} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <CategoryBarChart items={items} />
        </div>

        {/* Recent Audit Activity Feed */}
        <Card className="lg:col-span-6 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle>Aktivitas Audit & Mutasi Terbaru</CardTitle>
              <CardDescription>
                Catatan perubahan terakhir yang terekam untuk menjaga akurasi.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigate('audit')}
            >
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {auditLogs.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Belum ada riwayat aktivitas audit.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-[#00529C] dark:text-sky-400">
                          {log.aksi}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{log.kodeBarang}</span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {log.namaBarang}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {log.catatan}
                      </p>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                      <div>{log.petugas}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Inventory Snapshot */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Daftar Barang Terbaru</CardTitle>
            <CardDescription>
              Klik baris barang untuk melihat detail lengkap atau melakukan verifikasi cepat.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('inventory')}>
              Kelola Semua Barang
            </Button>
            <Button type="button" variant="accent" size="sm" onClick={onAddNew}>
              Tambah Barang
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {recentItems.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada data inventaris barang.
              </p>
              <Button type="button" className="mt-4" onClick={onAddNew}>
                Catat Barang Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode KIB</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Status Akurasi</TableHead>
                  <TableHead className="text-right">Perolehan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => onInspectItem(item)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-medium text-[#00529C] dark:text-sky-400 whitespace-nowrap">
                      {item.kodeBarang}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {item.namaBarang}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.kategori} · {item.sumberDana}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{item.ruangan}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                      {formatNumberID(item.jumlah)} {item.satuan}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                      {formatIDR(item.jumlah * item.hargaSatuan)}
                    </TableCell>
                    <TableCell>
                      <KondisiBadge kondisi={item.kondisi} />
                    </TableCell>
                    <TableCell>
                      <VerifikasiBadge status={item.statusVerifikasi} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateID(item.tanggalPerolehan)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {recentItems.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Data disinkronkan secara otomatis
              </span>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="font-medium text-[#00529C] dark:text-sky-400 hover:underline cursor-pointer"
              >
                Buka tabel lengkap ({items.length} item) →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
