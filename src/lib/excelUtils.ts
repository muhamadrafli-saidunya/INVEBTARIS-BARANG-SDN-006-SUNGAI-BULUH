import * as XLSX from 'xlsx';
import {
  BLUEPRINT_CONSTRAINTS,
  KATEGORI_LIST,
  KONDISI_LIST,
  SATUAN_LIST,
  STATUS_VERIFIKASI_LIST,
  SUMBER_DANA_LIST,
  validateInventoryForm,
  type InventoryFormValues,
  type InventoryItem,
  type KategoriBarang,
  type KondisiBarang,
  type Room,
  type SatuanBarang,
  type StatusVerifikasi,
  type SumberDana,
} from '@/src/types/inventory';

export interface ParsedExcelRow {
  rowNumber: number;
  rawKode: string;
  rawNama: string;
  rawRuangan: string;
  values: InventoryFormValues | null;
  errors: string[];
  isValid: boolean;
}

export interface ParsedExcelResult {
  fileName: string;
  totalRows: number;
  validRows: ParsedExcelRow[];
  invalidRows: ParsedExcelRow[];
  allRows: ParsedExcelRow[];
}

function matchEnum<T extends string>(input: unknown, list: readonly T[], fallback?: T): T | null {
  const cleaned = String(input ?? '').trim().toLowerCase();
  if (!cleaned && fallback) return fallback;
  const found = list.find((item) => item.toLowerCase() === cleaned);
  return found ?? null;
}

function normalizeExcelDate(val: unknown): string {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof val === 'number' && Number.isFinite(val)) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(
        parsed.d
      ).padStart(2, '0')}`;
    }
  }
  const str = String(val ?? '').trim();
  if (BLUEPRINT_CONSTRAINTS.dateRegex.test(str)) {
    return str;
  }
  // Support DD/MM/YYYY or DD-MM-YYYY common in Indonesian spreadsheets
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return str;
}

function parseNumeric(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : NaN;
  const str = String(val ?? '')
    .replace(/rp/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const num = Number(str);
  return Number.isFinite(num) ? num : NaN;
}

function getField(row: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const target = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = keys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target
    );
    if (matchedKey !== undefined) {
      return row[matchedKey];
    }
  }
  return undefined;
}

export function downloadImportTemplateXLSX(rooms: Room[]): void {
  const sampleRoom1 = rooms[0]?.namaRuang || 'Ruang Kelas 1A';
  const sampleRoom2 = rooms[1]?.namaRuang || sampleRoom1;

  const templateRows = [
    {
      'Kode Barang': 'KIB-B.01.101',
      'Nama Barang': 'Meja Siswa Kayu Jati Tunggal',
      Kategori: 'Mebel & Furnitur',
      Ruangan: sampleRoom1,
      Jumlah: 20,
      Satuan: 'Set',
      Kondisi: 'Baik',
      'Status Verifikasi': 'Terverifikasi',
      'Sumber Dana': 'BOS Reguler',
      'Harga Satuan': 625000,
      'Tanggal Perolehan': '2026-07-15',
      Keterangan: 'Contoh baris 1 - silakan ubah atau tambah baris di bawah ini.',
    },
    {
      'Kode Barang': 'KIB-B.02.102',
      'Nama Barang': 'Laptop Administrasi Guru',
      Kategori: 'Elektronik & IT',
      Ruangan: sampleRoom2,
      Jumlah: 2,
      Satuan: 'Unit',
      Kondisi: 'Baik',
      'Status Verifikasi': 'Perlu Audit',
      'Sumber Dana': 'BOS Daerah',
      'Harga Satuan': 7800000,
      'Tanggal Perolehan': '2026-08-02',
      Keterangan: 'Contoh baris 2 - pastikan nama ruangan sesuai dengan sheet Panduan & Referensi.',
    },
  ];

  const wb = XLSX.utils.book_new();
  const wsData = XLSX.utils.json_to_sheet(templateRows);
  wsData['!cols'] = [
    { wch: 18 },
    { wch: 34 },
    { wch: 22 },
    { wch: 26 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 44 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Data Inventaris');

  const referenceRows: Array<Record<string, string>> = [];
  const maxLen = Math.max(
    rooms.length,
    KATEGORI_LIST.length,
    SATUAN_LIST.length,
    KONDISI_LIST.length,
    STATUS_VERIFIKASI_LIST.length,
    SUMBER_DANA_LIST.length
  );

  for (let i = 0; i < maxLen; i += 1) {
    referenceRows.push({
      'Ruangan Terdaftar (Nama)': rooms[i]?.namaRuang || '',
      'Kode Ruang': rooms[i]?.kodeRuang || '',
      'Kategori Valid': KATEGORI_LIST[i] || '',
      'Satuan Valid': SATUAN_LIST[i] || '',
      'Kondisi Valid': KONDISI_LIST[i] || '',
      'Status Verifikasi Valid': STATUS_VERIFIKASI_LIST[i] || '',
      'Sumber Dana Valid': SUMBER_DANA_LIST[i] || '',
    });
  }

  const wsGuide = XLSX.utils.json_to_sheet(referenceRows);
  wsGuide['!cols'] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 24 },
    { wch: 15 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan & Referensi');

  XLSX.writeFile(wb, 'template-inventaris-sdn006-sungai-buluh.xlsx');
}

export function exportInventoryXLSX(items: InventoryItem[]): void {
  const rows = items.map((item) => ({
    'Kode Barang': item.kodeBarang,
    'Nama Barang': item.namaBarang,
    Kategori: item.kategori,
    Ruangan: item.ruangan,
    Jumlah: item.jumlah,
    Satuan: item.satuan,
    Kondisi: item.kondisi,
    'Status Verifikasi': item.statusVerifikasi,
    'Sumber Dana': item.sumberDana,
    'Harga Satuan': item.hargaSatuan,
    'Total Nilai': item.jumlah * item.hargaSatuan,
    'Tanggal Perolehan': item.tanggalPerolehan,
    Keterangan: item.keterangan,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 36 },
    { wch: 22 },
    { wch: 26 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 22 },
    { wch: 15 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 44 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Data Inventaris');
  XLSX.writeFile(
    wb,
    `inventaris-sdn006-sungai-buluh-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export async function parseInventoryXLSX(
  file: File,
  rooms: Room[]
): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes('inventaris')) || wb.SheetNames[0];

  if (!sheetName) {
    throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');
  }

  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  const allRows: ParsedExcelRow[] = rawRows.map((row, index) => {
    const rowNumber = index + 2; // +1 header, +1 1-indexed
    const rowErrors: string[] = [];

    const rawKode = String(getField(row, ['Kode Barang', 'kodeBarang', 'Kode KIB', 'kode']) ?? '')
      .trim()
      .toUpperCase();
    const rawNama = String(getField(row, ['Nama Barang', 'namaBarang', 'Nama']) ?? '').trim();
    const rawKategori = getField(row, ['Kategori', 'kategori']);
    const rawRuangan = String(getField(row, ['Ruangan', 'ruangan', 'Lokasi', 'Kode Ruang']) ?? '').trim();
    const rawJumlah = getField(row, ['Jumlah', 'jumlah', 'Qty']);
    const rawSatuan = getField(row, ['Satuan', 'satuan']);
    const rawKondisi = getField(row, ['Kondisi', 'kondisi']);
    const rawStatus = getField(row, ['Status Verifikasi', 'statusVerifikasi', 'Status']);
    const rawSumberDana = getField(row, ['Sumber Dana', 'sumberDana']);
    const rawHarga = getField(row, ['Harga Satuan', 'hargaSatuan', 'Harga']);
    const rawTanggal = getField(row, ['Tanggal Perolehan', 'tanggalPerolehan', 'Tanggal']);
    const rawKeterangan = String(getField(row, ['Keterangan', 'keterangan', 'Catatan']) ?? '').trim();

    const kategori = matchEnum<KategoriBarang>(rawKategori, KATEGORI_LIST);
    if (!kategori) {
      rowErrors.push(`Kategori "${String(rawKategori || '-')}" tidak valid.`);
    }

    const satuan = matchEnum<SatuanBarang>(rawSatuan, SATUAN_LIST, 'Unit');
    if (!satuan) {
      rowErrors.push(`Satuan "${String(rawSatuan || '-')}" tidak valid.`);
    }

    const kondisi = matchEnum<KondisiBarang>(rawKondisi, KONDISI_LIST, 'Baik');
    if (!kondisi) {
      rowErrors.push(`Kondisi "${String(rawKondisi || '-')}" tidak valid.`);
    }

    const statusVerifikasi = matchEnum<StatusVerifikasi>(
      rawStatus,
      STATUS_VERIFIKASI_LIST,
      'Perlu Audit'
    );
    if (!statusVerifikasi) {
      rowErrors.push(`Status verifikasi "${String(rawStatus || '-')}" tidak valid.`);
    }

    const sumberDana = matchEnum<SumberDana>(rawSumberDana, SUMBER_DANA_LIST, 'BOS Reguler');
    if (!sumberDana) {
      rowErrors.push(`Sumber dana "${String(rawSumberDana || '-')}" tidak valid.`);
    }

    const matchedRoom = rooms.find(
      (r) =>
        r.namaRuang.toLowerCase() === rawRuangan.toLowerCase() ||
        r.kodeRuang.toLowerCase() === rawRuangan.toLowerCase()
    );
    if (!matchedRoom) {
      rowErrors.push(
        rawRuangan
          ? `Ruangan "${rawRuangan}" belum terdaftar di Master Ruangan.`
          : 'Kolom Ruangan wajib diisi.'
      );
    }

    const jumlah = parseNumeric(rawJumlah);
    const hargaSatuan = parseNumeric(rawHarga);
    const tanggalPerolehan = normalizeExcelDate(rawTanggal);

    const candidate: InventoryFormValues = {
      kodeBarang: rawKode,
      namaBarang: rawNama,
      kategori: kategori || 'Mebel & Furnitur',
      roomId: matchedRoom?.id || '',
      jumlah: Number.isNaN(jumlah) ? -1 : jumlah,
      satuan: satuan || 'Unit',
      kondisi: kondisi || 'Baik',
      statusVerifikasi: statusVerifikasi || 'Perlu Audit',
      sumberDana: sumberDana || 'BOS Reguler',
      hargaSatuan: Number.isNaN(hargaSatuan) ? -1 : hargaSatuan,
      tanggalPerolehan,
      keterangan: rawKeterangan.slice(0, BLUEPRINT_CONSTRAINTS.maxKeteranganLength),
    };

    const formErrors = validateInventoryForm(candidate);
    for (const [key, msg] of Object.entries(formErrors)) {
      if (key === 'roomId' && !matchedRoom) continue; // already reported clearly
      rowErrors.push(msg);
    }

    const isValid = rowErrors.length === 0;
    return {
      rowNumber,
      rawKode,
      rawNama,
      rawRuangan,
      values: isValid ? candidate : null,
      errors: rowErrors,
      isValid,
    };
  });

  const validRows = allRows.filter((r) => r.isValid);
  const invalidRows = allRows.filter((r) => !r.isValid);

  return {
    fileName: file.name,
    totalRows: allRows.length,
    validRows,
    invalidRows,
    allRows,
  };
}
