import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
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
import { compressInventoryImage } from '@/src/lib/imageUtils';
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
    fotoBarang: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [processingImage, setProcessingImage] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setImagePreviewError(false);
      if (editingItem) {
        const existingFoto = editingItem.fotoBarang || '';
        setImageInputMode(existingFoto.startsWith('http') ? 'url' : 'upload');
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
          fotoBarang: existingFoto,
        });
      } else {
        setImageInputMode('upload');
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
          fotoBarang: '',
        });
      }
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  }, [open, editingItem, rooms]);

  const handleImageFileChange = async (file: File | undefined) => {
    if (!file) return;
    setProcessingImage(true);
    setImagePreviewError(false);
    try {
      const compressedDataUrl = await compressInventoryImage(file);
      setValues((prev) => ({ ...prev, fotoBarang: compressedDataUrl }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.fotoBarang;
        return next;
      });
      toast.success('Gambar penunjang berhasil dimuat.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setErrors((prev) => ({ ...prev, fotoBarang: msg }));
      toast.error(msg);
    } finally {
      setProcessingImage(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setValues((prev) => ({ ...prev, fotoBarang: '' }));
    setImagePreviewError(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.fotoBarang;
      return next;
    });
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

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

          {/* Menu Input Gambar Penunjang Inventaris */}
          <div className="space-y-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Foto / Gambar Penunjang Barang (Opsional)
                </Label>
              </div>
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    imageInputMode === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-[#00529C] dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  <span>Unggah Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    imageInputMode === 'url'
                      ? 'bg-white dark:bg-slate-900 text-[#00529C] dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Link2 className="h-3 w-3" />
                  <span>Tautan URL</span>
                </button>
              </div>
            </div>

            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => void handleImageFileChange(e.target.files?.[0])}
              className="hidden"
            />

            {imageInputMode === 'upload' ? (
              !values.fotoBarang ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !processingImage && imageFileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !processingImage) {
                      imageFileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!processingImage) {
                      void handleImageFileChange(e.dataTransfer.files?.[0]);
                    }
                  }}
                  className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-4 py-4 text-center hover:border-[#00529C] dark:hover:border-sky-400 transition-colors cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-[#00529C] dark:text-sky-400 mb-1.5" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {processingImage
                      ? 'Mengompresi & memproses gambar...'
                      : 'Klik atau seret foto barang ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Mendukung JPG, PNG, WebP (otomatis dikompresi agar hemat penyimpanan)
                  </p>
                </div>
              ) : null
            ) : (
              <div className="space-y-1.5">
                <Input
                  type="url"
                  value={values.fotoBarang?.startsWith('data:') ? '' : values.fotoBarang || ''}
                  onChange={(e) => {
                    setImagePreviewError(false);
                    setValues((prev) => ({ ...prev, fotoBarang: e.target.value }));
                    if (errors.fotoBarang) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.fotoBarang;
                        return next;
                      });
                    }
                  }}
                  placeholder="https://contoh.sch.id/foto-barang.jpg"
                />
              </div>
            )}

            {values.fotoBarang && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5">
                {!imagePreviewError ? (
                  <img
                    src={values.fotoBarang}
                    alt="Pratinjau gambar barang"
                    referrerPolicy="no-referrer"
                    onError={() => setImagePreviewError(true)}
                    className="h-16 w-16 rounded-md object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400 text-center p-1 shrink-0">
                    Pratinjau gagal
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {values.fotoBarang.startsWith('data:')
                      ? 'Foto Terlampir (Terkompresi)'
                      : 'Gambar dari Tautan URL'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {values.fotoBarang.startsWith('data:')
                      ? `Ukuran tersimpan ~${Math.max(1, Math.round((values.fotoBarang.length * 0.75) / 1024))} KB`
                      : values.fotoBarang}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {imageInputMode === 'upload' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageFileInputRef.current?.click()}
                      disabled={processingImage || submitting}
                      className="h-8 px-2.5 text-xs"
                    >
                      Ganti
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus gambar penunjang"
                    onClick={handleRemoveImage}
                    disabled={processingImage || submitting}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {errors.fotoBarang && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.fotoBarang}</p>
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
              disabled={submitting || processingImage}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting || processingImage}>
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
