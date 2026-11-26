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
import { validateRoomForm, type Room, type RoomFormValues } from '@/src/types/inventory';

interface RoomFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoom: Room | null;
  onSubmit: (values: RoomFormValues) => Promise<void>;
}

export function RoomFormModal({
  open,
  onOpenChange,
  editingRoom,
  onSubmit,
}: RoomFormModalProps) {
  const [values, setValues] = useState<RoomFormValues>({
    kodeRuang: '',
    namaRuang: '',
    penanggungJawab: '',
    kapasitasBarang: 80,
    lokasi: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (editingRoom) {
        setValues({
          kodeRuang: editingRoom.kodeRuang,
          namaRuang: editingRoom.namaRuang,
          penanggungJawab: editingRoom.penanggungJawab,
          kapasitasBarang: editingRoom.kapasitasBarang,
          lokasi: editingRoom.lokasi,
        });
      } else {
        setValues({
          kodeRuang: `R-KLS-${Math.floor(10 + Math.random() * 89)}`,
          namaRuang: '',
          penanggungJawab: '',
          kapasitasBarang: 80,
          lokasi: 'Gedung Utama Lt. 1',
        });
      }
    }
  }, [open, editingRoom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateRoomForm(values);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRoom ? 'Perbarui Data Ruangan' : 'Tambah Ruangan Sekolah Baru'}
          </DialogTitle>
          <DialogDescription>
            Tentukan kode ruang, penanggung jawab wali/petugas, dan kapasitas tampung barang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kodeRuang">Kode Ruangan</Label>
              <Input
                id="kodeRuang"
                value={values.kodeRuang}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, kodeRuang: e.target.value.toUpperCase() }))
                }
                placeholder="Contoh: R-KLS-3A"
                className="font-mono"
              />
              {errors.kodeRuang && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.kodeRuang}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kapasitasBarang">Kapasitas Unit</Label>
              <Input
                id="kapasitasBarang"
                type="number"
                min={1}
                value={values.kapasitasBarang}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, kapasitasBarang: Number(e.target.value) }))
                }
                className="font-mono tabular-nums"
              />
              {errors.kapasitasBarang && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.kapasitasBarang}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaRuang">Nama Ruangan</Label>
            <Input
              id="namaRuang"
              value={values.namaRuang}
              onChange={(e) => setValues((prev) => ({ ...prev, namaRuang: e.target.value }))}
              placeholder="Contoh: Ruang Kelas 3A"
            />
            {errors.namaRuang && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.namaRuang}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="penanggungJawab">Penanggung Jawab Ruangan</Label>
            <Input
              id="penanggungJawab"
              value={values.penanggungJawab}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, penanggungJawab: e.target.value }))
              }
              placeholder="Contoh: Ibu Rina Marlina, S.Pd."
            />
            {errors.penanggungJawab && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.penanggungJawab}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lokasi">Lokasi Gedung / Lantai</Label>
            <Input
              id="lokasi"
              value={values.lokasi}
              onChange={(e) => setValues((prev) => ({ ...prev, lokasi: e.target.value }))}
              placeholder="Contoh: Gedung Utama Lt. 1"
            />
            {errors.lokasi && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.lokasi}</p>
            )}
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
              {submitting ? 'Menyimpan...' : editingRoom ? 'Simpan Perubahan' : 'Tambah Ruangan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
