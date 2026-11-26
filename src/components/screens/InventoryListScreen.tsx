import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CalendarRange,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  ImageIcon,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Pagination } from '@/src/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { SimpleSelect } from '@/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { InfoTooltip } from '@/src/components/ui/tooltip';
import { KondisiBadge, VerifikasiBadge } from '@/src/components/inventory/StatusBadge';
import {
  downloadImportTemplateXLSX,
  exportInventoryXLSX,
} from '@/src/lib/excelUtils';
import { exportInventoryCSV, formatDateID, formatIDR, formatNumberID } from '@/src/lib/utils';
import {
  KATEGORI_LIST,
  KONDISI_LIST,
  STATUS_VERIFIKASI_LIST,
  type InventoryItem,
  type Room,
} from '@/src/types/inventory';

interface InventoryListScreenProps {
  items: InventoryItem[];
  rooms: Room[];
  loading: boolean;
  initialRoomFilter?: string;
  onAddNew: () => void;
  onOpenImport: () => void;
  onEdit: (item: InventoryItem) => void;
  onViewDetail: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

type SortKey = 'kodeBarang' | 'namaBarang' | 'jumlah' | 'totalNilai' | 'tanggalPerolehan';

const PAGE_SIZE = 8;

export function InventoryListScreen({
  items,
  rooms,
  loading,
  initialRoomFilter = 'all',
  onAddNew,
  onOpenImport,
  onEdit,
  onViewDetail,
  onDelete,
}: InventoryListScreenProps) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState(initialRoomFilter);
  const [kondisiFilter, setKondisiFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('tanggalPerolehan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const hasActiveFilter =
    search.trim() !== '' ||
    kategoriFilter !== 'all' ||
    roomFilter !== 'all' ||
    kondisiFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const resetFilters = () => {
    setSearch('');
    setKategoriFilter('all');
    setRoomFilter('all');
    setKondisiFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'tanggalPerolehan' || key === 'totalNilai' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (q) {
        const matchText =
          item.kodeBarang.toLowerCase().includes(q) ||
          item.namaBarang.toLowerCase().includes(q) ||
          item.ruangan.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.keterangan.toLowerCase().includes(q);
        if (!matchText) return false;
      }
      if (kategoriFilter !== 'all' && item.kategori !== kategoriFilter) return false;
      if (roomFilter !== 'all' && item.roomId !== roomFilter) return false;
      if (kondisiFilter !== 'all' && item.kondisi !== kondisiFilter) return false;
      if (statusFilter !== 'all' && item.statusVerifikasi !== statusFilter) return false;
      if (dateFrom && item.tanggalPerolehan < dateFrom) return false;
      if (dateTo && item.tanggalPerolehan > dateTo) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'jumlah') {
        cmp = a.jumlah - b.jumlah;
      } else if (sortKey === 'totalNilai') {
        cmp = a.jumlah * a.hargaSatuan - b.jumlah * b.hargaSatuan;
      } else if (sortKey === 'kodeBarang') {
        cmp = a.kodeBarang.localeCompare(b.kodeBarang);
      } else if (sortKey === 'namaBarang') {
        cmp = a.namaBarang.localeCompare(b.namaBarang);
      } else {
        cmp = a.tanggalPerolehan.localeCompare(b.tanggalPerolehan);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [
    items,
    search,
    kategoriFilter,
    roomFilter,
    kondisiFilter,
    statusFilter,
    dateFrom,
    dateTo,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredAndSorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const filteredTotalValue = filteredAndSorted.reduce(
    (sum, it) => sum + it.jumlah * it.hargaSatuan,
    0
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle>Daftar Inventaris Barang Sekolah</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {filteredAndSorted.length} jenis barang cocok · Total nilai {formatIDR(filteredTotalValue)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <InfoTooltip content="Unduh template Excel (.xlsx) untuk pengisian data massal">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadImportTemplateXLSX(rooms)}
              >
                <FileSpreadsheet className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
                Template .xlsx
              </Button>
            </InfoTooltip>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenImport}
            >
              <Upload className="h-4 w-4 text-[#F37021]" />
              Impor .xlsx
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={filteredAndSorted.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Ekspor
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportInventoryXLSX(filteredAndSorted)}>
                  <FileSpreadsheet className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
                  <span>Ekspor Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportInventoryCSV(filteredAndSorted)}>
                  <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <span>Ekspor CSV (.csv)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button type="button" variant="accent" size="sm" onClick={onAddNew}>
              <Plus className="h-4 w-4" />
              Tambah Barang
            </Button>
          </div>
        </CardHeader>

        {/* Filter & Search Toolbar */}
        <div className="p-4 sm:px-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="relative lg:col-span-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari kode KIB, nama barang, ruangan..."
                className="pl-9"
              />
            </div>

            <div className="lg:col-span-3">
              <SimpleSelect
                value={kategoriFilter}
                onValueChange={(v) => {
                  setKategoriFilter(v);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'Semua Kategori' },
                  ...KATEGORI_LIST.map((k) => ({ value: k, label: k })),
                ]}
                ariaLabel="Filter kategori barang"
              />
            </div>

            <div className="lg:col-span-3">
              <SimpleSelect
                value={roomFilter}
                onValueChange={(v) => {
                  setRoomFilter(v);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'Semua Ruangan' },
                  ...rooms.map((r) => ({ value: r.id, label: r.namaRuang })),
                ]}
                ariaLabel="Filter ruangan"
              />
            </div>

            <div className="lg:col-span-2">
              <SimpleSelect
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'Semua Status' },
                  ...STATUS_VERIFIKASI_LIST.map((s) => ({ value: s, label: s })),
                ]}
                ariaLabel="Filter status verifikasi"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Segmented Condition Filter */}
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {(['all', ...KONDISI_LIST] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKondisiFilter(k);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    kondisiFilter === k
                      ? 'bg-white dark:bg-slate-900 text-[#00529C] dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {k === 'all' ? 'Semua Kondisi' : k}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <CalendarRange className="h-3.5 w-3.5 text-[#00529C] dark:text-sky-400" />
                    <span>
                      {dateFrom || dateTo
                        ? `${dateFrom || '...'} s/d ${dateTo || '...'}`
                        : 'Rentang Tanggal'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Filter Tanggal Perolehan
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dateFrom">Dari Tanggal</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dateTo">Sampai Tanggal</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDateFrom('');
                          setDateTo('');
                          setCurrentPage(1);
                        }}
                      >
                        Hapus Rentang Tanggal
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {hasActiveFilter && (
                <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tidak ada data barang yang sesuai dengan kriteria filter.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Coba ubah kata kunci pencarian atau tambahkan data barang baru.
              </p>
              <div className="mt-5 flex justify-center gap-2.5">
                {hasActiveFilter && (
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filter
                  </Button>
                )}
                <Button type="button" size="sm" onClick={onAddNew}>
                  <Plus className="h-4 w-4" />
                  Tambah Barang
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => handleSort('kodeBarang')}
                        className="inline-flex items-center gap-1 hover:text-[#00529C] dark:hover:text-sky-400 cursor-pointer"
                      >
                        <span>Kode KIB</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => handleSort('namaBarang')}
                        className="inline-flex items-center gap-1 hover:text-[#00529C] dark:hover:text-sky-400 cursor-pointer"
                      >
                        <span>Nama Barang</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('jumlah')}
                        className="inline-flex items-center justify-end gap-1 hover:text-[#00529C] dark:hover:text-sky-400 cursor-pointer ml-auto"
                      >
                        <span>Jumlah</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('totalNilai')}
                        className="inline-flex items-center justify-end gap-1 hover:text-[#00529C] dark:hover:text-sky-400 cursor-pointer ml-auto"
                      >
                        <span>Total Nilai</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Akurasi</TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('tanggalPerolehan')}
                        className="inline-flex items-center justify-end gap-1 hover:text-[#00529C] dark:hover:text-sky-400 cursor-pointer ml-auto"
                      >
                        <span>Perolehan</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium text-[#00529C] dark:text-sky-400 whitespace-nowrap">
                        {item.kodeBarang}
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {item.fotoBarang ? (
                            <button
                              type="button"
                              onClick={() => onViewDetail(item)}
                              aria-label={`Lihat foto ${item.namaBarang}`}
                              className="h-9 w-9 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer"
                            >
                              <img
                                src={item.fotoBarang}
                                alt={item.namaBarang}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 shrink-0"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onViewDetail(item)}
                              className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-[#00529C] dark:hover:text-sky-400 cursor-pointer"
                            >
                              {item.namaBarang}
                            </button>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {item.kategori} · {item.sumberDana}
                            </div>
                          </div>
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
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Aksi untuk ${item.namaBarang}`}
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onViewDetail(item)}>
                              <Eye className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
                              <span>Lihat Detail & Audit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Edit3 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              <span>Edit Data Barang</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Hapus Barang</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredAndSorted.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
