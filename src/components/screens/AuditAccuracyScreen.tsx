import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { SimpleSelect } from '@/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { KondisiBadge, VerifikasiBadge } from '@/src/components/inventory/StatusBadge';
import { formatDateID, formatIDR, formatNumberID, formatTimestampID } from '@/src/lib/utils';
import type { AuditLog, InventoryItem, KondisiBarang, StatusVerifikasi } from '@/src/types/inventory';

interface AuditAccuracyScreenProps {
  items: InventoryItem[];
  auditLogs: AuditLog[];
  onInspectItem: (item: InventoryItem) => void;
  onQuickVerify: (
    id: string,
    kondisi: KondisiBarang,
    statusVerifikasi: StatusVerifikasi,
    catatan: string
  ) => Promise<void>;
}

export function AuditAccuracyScreen({
  items,
  auditLogs,
  onInspectItem,
  onQuickVerify,
}: AuditAccuracyScreenProps) {
  const [actionFilter, setActionFilter] = useState('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const totalCount = items.length;
  const verifiedCount = items.filter((it) => it.statusVerifikasi === 'Terverifikasi').length;
  const needAuditItems = items.filter(
    (it) => it.statusVerifikasi !== 'Terverifikasi' || it.kondisi !== 'Baik'
  );
  const accuracyPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const filteredLogs = useMemo(() => {
    if (actionFilter === 'all') return auditLogs;
    return auditLogs.filter((l) => l.aksi === actionFilter);
  }, [auditLogs, actionFilter]);

  const handleQuickApprove = async (item: InventoryItem) => {
    setVerifyingId(item.id);
    try {
      await onQuickVerify(
        item.id,
        item.kondisi,
        'Terverifikasi',
        `Verifikasi akurasi data disetujui untuk ${item.namaBarang} (${item.jumlah} ${item.satuan}).`
      );
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Accuracy Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Skor Akurasi Data Inventaris
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-[#00529C] dark:text-sky-400 tabular-nums">
                {accuracyPct}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {verifiedCount} dari {totalCount} data terverifikasi
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${accuracyPct}%` }}
                className="h-full rounded-full bg-[#00529C] dark:bg-sky-400 transition-all duration-300"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Antrean Verifikasi & Perbaikan
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-[#F37021] tabular-nums">
              {needAuditItems.length}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Barang berstatus Perlu Audit, Rusak Ringan, atau Rusak Berat.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Catatan Jejak Audit
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {auditLogs.length}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Riwayat mutasi, penambahan, dan pemeriksaan fisik terekam.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">
            Antrean Audit ({needAuditItems.length})
          </TabsTrigger>
          <TabsTrigger value="logs">
            Riwayat Log Aktivitas ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Barang Memerlukan Audit atau Tindak Lanjut</CardTitle>
              <CardDescription>
                Lakukan verifikasi fisik atau tinjau detail kerusakan agar data inventaris sekolah tetap akurat.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {needAuditItems.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                    Seluruh data barang dalam kondisi baik dan telah terverifikasi.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode KIB</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Ruangan</TableHead>
                      <TableHead className="text-right">Jumlah & Nilai</TableHead>
                      <TableHead>Kondisi</TableHead>
                      <TableHead>Status Akurasi</TableHead>
                      <TableHead className="text-right">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {needAuditItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-medium text-[#00529C] dark:text-sky-400 whitespace-nowrap">
                          {item.kodeBarang}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {item.namaBarang}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Diperoleh {formatDateID(item.tanggalPerolehan)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{item.ruangan}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                          <div>
                            {formatNumberID(item.jumlah)} {item.satuan}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatIDR(item.jumlah * item.hargaSatuan)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <KondisiBadge kondisi={item.kondisi} />
                        </TableCell>
                        <TableCell>
                          <VerifikasiBadge status={item.statusVerifikasi} />
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {item.statusVerifikasi !== 'Terverifikasi' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                disabled={verifyingId === item.id}
                                onClick={() => handleQuickApprove(item)}
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                {verifyingId === item.id ? 'Memproses...' : 'Verifikasi'}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onInspectItem(item)}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Riwayat Jejak Audit Inventaris</CardTitle>
                <CardDescription>
                  Rekaman kronologis penambahan, pembaruan, pemeriksaan kondisi, dan penghapusan barang.
                </CardDescription>
              </div>
              <div className="w-full sm:w-52">
                <SimpleSelect
                  value={actionFilter}
                  onValueChange={setActionFilter}
                  options={[
                    { value: 'all', label: 'Semua Jenis Aksi' },
                    { value: 'Tambah Barang', label: 'Tambah Barang' },
                    { value: 'Perbarui Data', label: 'Perbarui Data' },
                    { value: 'Audit Kondisi', label: 'Audit Kondisi' },
                    { value: 'Hapus Barang', label: 'Hapus Barang' },
                  ]}
                  ariaLabel="Filter jenis aksi audit"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada catatan audit untuk kategori ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Kode & Barang</TableHead>
                      <TableHead>Catatan Audit</TableHead>
                      <TableHead>Petugas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                          {formatTimestampID(log.createdAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium text-xs text-[#00529C] dark:text-sky-400">
                            {log.aksi}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {log.namaBarang}
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {log.kodeBarang}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                          {log.catatan}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{log.petugas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
