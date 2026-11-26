import React, { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { SimpleSelect } from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import { formatIDR } from '@/src/lib/utils';
import {
  KATEGORI_LIST,
  KONDISI_LIST,
  SATUAN_LIST,
  STATUS_VERIFIKASI_LIST,
  SUMBER_DANA_LIST,
  validateInventoryForm,
  type InventoryFormValues,
  type InventoryItem,
  type Room,
} from '@/src/types/inventory';

interface ItemFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: InventoryItem | null;
  rooms: Room[];
  onSubmit: (values: InventoryFormValues) => Promise<void>;
}

const DEFAULT_DATE = new Date().toISOString().slice(0, 10);

export function ItemFormModal({
  open,
  onOpenChange,
  editingItem,
  rooms,
  onSubmit,
}: ItemFormModalProps) {
  const [values, setValues] = useState<InventoryFormValues>({
    kodeBarang: '',
    namaBarang: '',
    kategori: 'Mebel & Furnitur',
    roomId: rooms[0]?.id || '',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    statusVerifikasi: 'Terverifikasi',
    sumberDana: 'BOS Reguler',
    hargaSatuan: 0,
    tanggalPerolehan: DEFAULT_DATE,
    keterangan: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (editingItem) {
        setValues({
          kodeBarang: editingItem.kodeBarang,
          namaBarang: editingItem.namaBarang,
          kategori: editingItem.kategori,
          roomId: editingItem.roomId || rooms[0]?.id || '',
          jumlah: editingItem.jumlah,
          satuan: editingItem.satuan,
          kondisi: editingItem.kondisi,
          statusVerifikasi: editingItem.statusVerifikasi,
          sumberDana: editingItem.sumberDana,
          hargaSatuan: editingItem.hargaSatuan,
          tanggalPerolehan: editingItem.tanggalPerolehan,
          keterangan: editingItem.keterangan,
        });
      } else {
        setValues({
          kodeBarang: `KIB-B.${String(Math.floor(10 + Math.random() * 89))}.${String(
            Math.floor(100 + Math.random() * 899)
          )}`,
          namaBarang: '',
          kategori: 'Mebel & Furnitur',
          roomId: rooms[0]?.id || '',
          jumlah: 1,
          satuan: 'Unit',
          kondisi: 'Baik',
          statusVerifikasi: 'Terverifikasi',
          sumberDana: 'BOS Reguler',
          hargaSatuan: 500000,
          tanggalPerolehan: DEFAULT_DATE,
          keterangan: '',
        });
      }
    }
  }, [open, editingItem, rooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateInventoryForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const totalNilai = (Number(values.jumlah) || 0) * (Number(values.hargaSatuan) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Perbarui Data Barang Inventaris' : 'Tambah Barang Inventaris Baru'}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi kode KIB, lokasi ruangan, kondisi fisik, dan nilai perolehan aset sekolah.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kodeBarang">Kode Barang (KIB)</Label>
              <Input
                id="kodeBarang"
                value={values.kodeBarang}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, kodeBarang: e.target.value.toUpperCase() }))
                }
                placeholder="Contoh: KIB-B.01.005"
                className="font-mono"
              />
              {errors.kodeBarang && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.kodeBarang}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tanggalPerolehan">Tanggal Perolehan</Label>
              <Input
                id="tanggalPerolehan"
                type="date"
                value={values.tanggalPerolehan}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, tanggalPerolehan: e.target.value }))
                }
                className="font-mono"
              />
              {errors.tanggalPerolehan && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.tanggalPerolehan}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaBarang">Nama Barang / Spesifikasi</Label>
            <Input
              id="namaBarang"
              value={values.namaBarang}
              onChange={(e) => setValues((prev) => ({ ...prev, namaBarang: e.target.value }))}
              placeholder="Contoh: Kursi Siswa Kayu Jati Kelas 3"
            />
            {errors.namaBarang && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.namaBarang}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Kategori Barang</Label>
              <SimpleSelect
                value={values.kategori}
                onValueChange={(v) =>
                  setValues((prev) => ({
                    ...prev,
                    kategori: v as InventoryFormValues['kategori'],
                  }))
                }
                options={KATEGORI_LIST.map((k) => ({ value: k, label: k }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ruangan / Lokasi</Label>
              <SimpleSelect
                value={values.roomId}
                onValueChange={(v) => setValues((prev) => ({ ...prev, roomId: v }))}
                options={rooms.map((r) => ({
                  value: r.id,
                  label: `${r.namaRuang} (${r.kodeRuang})`,
                }))}
                placeholder="Pilih ruangan"
              />
              {errors.roomId && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.roomId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="jumlah">Jumlah</Label>
              <Input
                id="jumlah"
                type="number"
                min={0}
                value={values.jumlah}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, jumlah: Number(e.target.value) }))
                }
                className="font-mono tabular-nums"
              />
              {errors.jumlah && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.jumlah}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Satuan</Label>
              <SimpleSelect
                value={values.satuan}
                onValueChange={(v) =>
                  setValues((prev) => ({ ...prev, satuan: v as InventoryFormValues['satuan'] }))
                }
                options={SATUAN_LIST.map((s) => ({ value: s, label: s }))}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="hargaSatuan">Harga Satuan (IDR)</Label>
              <Input
                id="hargaSatuan"
                type="number"
                min={0}
                step={1000}
                value={values.hargaSatuan}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, hargaSatuan: Number(e.target.value) }))
                }
                className="font-mono tabular-nums"
              />
              {errors.hargaSatuan && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.hargaSatuan}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Kondisi Fisik</Label>
              <SimpleSelect
                value={values.kondisi}
                onValueChange={(v) =>
                  setValues((prev) => ({
                    ...prev,
                    kondisi: v as InventoryFormValues['kondisi'],
                  }))
                }
                options={KONDISI_LIST.map((k) => ({ value: k, label: k }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status Verifikasi</Label>
              <SimpleSelect
                value={values.statusVerifikasi}
                onValueChange={(v) =>
                  setValues((prev) => ({
                    ...prev,
                    statusVerifikasi: v as InventoryFormValues['statusVerifikasi'],
                  }))
                }
                options={STATUS_VERIFIKASI_LIST.map((s) => ({ value: s, label: s }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sumber Dana</Label>
              <SimpleSelect
                value={values.sumberDana}
                onValueChange={(v) =>
                  setValues((prev) => ({
                    ...prev,
                    sumberDana: v as InventoryFormValues['sumberDana'],
                  }))
                }
                options={SUMBER_DANA_LIST.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keterangan">Keterangan / Catatan Tambahan</Label>
            <Textarea
              id="keterangan"
              value={values.keterangan}
              onChange={(e) => setValues((prev) => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Catatan kondisi fisik, nomor seri, atau keterangan pengadaan..."
            />
            {errors.keterangan && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.keterangan}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/70 px-4 py-2.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Estimasi Total Nilai Aset</span>
            <span className="font-mono text-sm font-semibold text-[#00529C] dark:text-sky-400 tabular-nums">
              {formatIDR(totalNilai)}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Perubahan'
                  : 'Simpan Barang'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
