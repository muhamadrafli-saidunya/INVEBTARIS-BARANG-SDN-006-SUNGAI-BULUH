import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { InventoryItem } from '@/src/types/inventory';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumberID(num: number): string {
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(num) ? num : 0);
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatTimestampID(isoOrMs: string | number): string {
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24);
  const rand = Math.random().toString(36).substring(2, 8);
  const ts = Date.now().toString(36);
  return `${cleanPrefix}_${ts}_${rand}`.slice(0, 128);
}

export function exportInventoryCSV(items: InventoryItem[]): void {
  const headers = [
    'Kode Barang',
    'Nama Barang',
    'Kategori',
    'Ruangan',
    'Jumlah',
    'Satuan',
    'Kondisi',
    'Status Verifikasi',
    'Sumber Dana',
    'Harga Satuan (IDR)',
    'Total Nilai (IDR)',
    'Tanggal Perolehan',
    'Keterangan',
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = items.map((item) => [
    escapeCsv(item.kodeBarang),
    escapeCsv(item.namaBarang),
    escapeCsv(item.kategori),
    escapeCsv(item.ruangan),
    item.jumlah,
    escapeCsv(item.satuan),
    escapeCsv(item.kondisi),
    escapeCsv(item.statusVerifikasi),
    escapeCsv(item.sumberDana),
    item.hargaSatuan,
    item.jumlah * item.hargaSatuan,
    escapeCsv(item.tanggalPerolehan),
    escapeCsv(item.keterangan),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `inventaris-sdn006-sungai-buluh-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
