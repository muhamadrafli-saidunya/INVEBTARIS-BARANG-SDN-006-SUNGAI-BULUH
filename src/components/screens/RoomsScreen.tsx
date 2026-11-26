import { useMemo, useState } from 'react';
import { ArrowRight, Building2, Edit3, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { formatIDR, formatNumberID } from '@/src/lib/utils';
import type { InventoryItem, Room } from '@/src/types/inventory';

interface RoomsScreenProps {
  rooms: Room[];
  items: InventoryItem[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onViewRoomItems: (roomId: string) => void;
}

export function RoomsScreen({
  rooms,
  items,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onViewRoomItems,
}: RoomsScreenProps) {
  const [search, setSearch] = useState('');

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.kodeRuang.toLowerCase().includes(q) ||
        r.namaRuang.toLowerCase().includes(q) ||
        r.penanggungJawab.toLowerCase().includes(q) ||
        r.lokasi.toLowerCase().includes(q)
    );
  }, [rooms, search]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Daftar Ruangan & Kartu Inventaris Lokasi</CardTitle>
            <CardDescription>
              Kelola ruang kelas, laboratorium, perpustakaan, serta penanggung jawab aset SDN 006 Sungai Buluh.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ruangan atau penanggung jawab..."
                className="pl-9"
              />
            </div>
            <Button type="button" variant="accent" size="sm" onClick={onAddRoom}>
              <Plus className="h-4 w-4" />
              Tambah Ruangan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tidak ada ruangan yang cocok dengan pencarian Anda.
            </p>
            <Button type="button" className="mt-4" size="sm" onClick={onAddRoom}>
              <Plus className="h-4 w-4" />
              Tambah Ruangan Baru
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const roomItems = items.filter((it) => it.roomId === room.id);
            const totalUnits = roomItems.reduce((s, it) => s + it.jumlah, 0);
            const totalNilai = roomItems.reduce(
              (s, it) => s + it.jumlah * it.hargaSatuan,
              0
            );
            const capacityPct = Math.min(
              100,
              Math.round((totalUnits / Math.max(1, room.kapasitasBarang)) * 100)
            );

            return (
              <Card key={room.id} className="flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-[#00529C] dark:text-sky-400">
                        {room.kodeRuang} · {room.lokasi}
                      </div>
                      <CardTitle className="mt-1 truncate">{room.namaRuang}</CardTitle>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[#00529C] dark:text-sky-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <UserCheck className="h-3.5 w-3.5 text-[#F37021] shrink-0" />
                    <span className="truncate">{room.penanggungJawab}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-y border-slate-100 dark:border-slate-800 py-3">
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Jenis & Unit
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {roomItems.length} / {formatNumberID(totalUnits)} unit
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nilai Aset
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-[#00529C] dark:text-sky-400 tabular-nums">
                        {formatIDR(totalNilai)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>Okupansi Kapasitas Ruang</span>
                      <span>
                        {formatNumberID(totalUnits)} / {formatNumberID(room.kapasitasBarang)} ({capacityPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        style={{ width: `${capacityPct}%` }}
                        className={`h-full rounded-full ${
                          capacityPct >= 90 ? 'bg-[#F37021]' : 'bg-[#00529C] dark:bg-sky-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRoom(room)}
                        aria-label={`Edit ${room.namaRuang}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRoom(room)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700"
                        aria-label={`Hapus ${room.namaRuang}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewRoomItems(room.id)}
                    >
                      <span>Lihat Barang</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
