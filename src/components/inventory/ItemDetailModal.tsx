import { useEffect, useState } from 'react';
import { Calendar, Edit3, ImageOff, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { SimpleSelect } from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import { formatDateID, formatIDR, formatNumberID } from '@/src/lib/utils';
import { KondisiBadge, VerifikasiBadge } from '@/src/components/inventory/StatusBadge';
import {
  KONDISI_LIST,
  STATUS_VERIFIKASI_LIST,
  type InventoryItem,
  type KondisiBarang,
  type StatusVerifikasi,
} from '@/src/types/inventory';

interface ItemDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onVerify: (
    id: string,
    kondisi: KondisiBarang,
    statusVerifikasi: StatusVerifikasi,
    catatan: string
  ) => Promise<void>;
}

export function ItemDetailModal({
  open,
  onOpenChange,
  item,
  onEdit,
  onDelete,
  onVerify,
}: ItemDetailModalProps) {
  const [kondisi, setKondisi] = useState<KondisiBarang>('Baik');
  const [statusVerifikasi, setStatusVerifikasi] = useState<StatusVerifikasi>('Terverifikasi');
  const [catatan, setCatatan] = useState('');
  const [savingAudit, setSavingAudit] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (item) {
      setKondisi(item.kondisi);
      setStatusVerifikasi(item.statusVerifikasi);
      setCatatan('');
      setImgError(false);
    }
  }, [item]);

  if (!item) return null;

  const totalNilai = item.jumlah * item.hargaSatuan;

  const handleSaveAudit = async () => {
    setSavingAudit(true);
    try {
      await onVerify(item.id, kondisi, statusVerifikasi, catatan);
      setCatatan('');
    } finally {
      setSavingAudit(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-medium text-[#00529C] dark:text-sky-400">
              {item.kodeBarang}
            </span>
            <span aria-hidden="true">·</span>
            <span>{item.kategori}</span>
            <span aria-hidden="true">·</span>
            <span>{item.sumberDana}</span>
          </div>
          <DialogTitle className="mt-1">{item.namaBarang}</DialogTitle>
          <DialogDescription>
            Detail lengkap pencatatan aset SDN 006 Sungai Buluh serta panel audit verifikasi fisik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <KondisiBadge kondisi={item.kondisi} />
            <VerifikasiBadge status={item.statusVerifikasi} />
          </div>

          {item.fotoBarang && (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {!imgError ? (
                <img
                  src={item.fotoBarang}
                  alt={`Foto dokumentasi ${item.namaBarang}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="max-h-60 w-full object-contain bg-slate-100/80 dark:bg-slate-900"
                />
              ) : (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                  <ImageOff className="h-4 w-4" />
                  <span>Gambar penunjang tidak dapat dimuat.</span>
                </div>
              )}
              <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Foto dokumentasi penunjang inventaris
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-slate-100 dark:border-slate-800 py-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Lokasi Ruangan</div>
              <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                <MapPin className="h-3.5 w-3.5 text-[#00529C] dark:text-sky-400 shrink-0" />
                <span>{item.ruangan}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Kuantitas</div>
              <div className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatNumberID(item.jumlah)} {item.satuan}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tanggal Perolehan</div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{formatDateID(item.tanggalPerolehan)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Harga Satuan</div>
              <div className="mt-1 font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {formatIDR(item.hargaSatuan)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Nilai Aset</div>
              <div className="mt-1 font-mono text-base font-bold text-[#00529C] dark:text-sky-400 tabular-nums">
                {formatIDR(totalNilai)}
              </div>
            </div>
          </div>

          {item.keterangan && (
            <div className="text-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Keterangan Inventaris
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.keterangan}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-[#F37021]" />
              <span>Verifikasi & Audit Kondisi Cepat</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kondisi Hasil Pemeriksaan</Label>
                <SimpleSelect
                  value={kondisi}
                  onValueChange={(v) => setKondisi(v as KondisiBarang)}
                  options={KONDISI_LIST.map((k) => ({ value: k, label: k }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Status Akurasi Data</Label>
                <SimpleSelect
                  value={statusVerifikasi}
                  onValueChange={(v) => setStatusVerifikasi(v as StatusVerifikasi)}
                  options={STATUS_VERIFIKASI_LIST.map((s) => ({ value: s, label: s }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="auditNote">Catatan Pemeriksaan Fisik</Label>
              <Textarea
                id="auditNote"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Jumlah fisik cocok 100% dengan kartu inventaris ruangan..."
                className="min-h-[64px]"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={handleSaveAudit}
                disabled={savingAudit}
              >
                {savingAudit ? 'Menyimpan...' : 'Simpan Hasil Audit'}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onDelete(item);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Hapus Barang
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(item);
              }}
            >
              <Edit3 className="h-4 w-4" />
              Edit Data
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
