import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  downloadImportTemplateXLSX,
  parseInventoryXLSX,
  type ParsedExcelResult,
} from '@/src/lib/excelUtils';
import { formatIDR, formatNumberID } from '@/src/lib/utils';
import type { InventoryFormValues, Room } from '@/src/types/inventory';

interface ImportExcelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  onImport: (rows: InventoryFormValues[]) => Promise<number>;
}

export function ImportExcelModal({
  open,
  onOpenChange,
  rooms,
  onImport,
}: ImportExcelModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedExcelResult | null>(null);

  const resetState = () => {
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      setParseError('Format file harus berupa Excel (.xlsx atau .xls).');
      setResult(null);
      return;
    }

    setParsing(true);
    setParseError(null);
    try {
      const parsed = await parseInventoryXLSX(file, rooms);
      if (parsed.totalRows === 0) {
        setParseError('Sheet Excel kosong atau tidak memiliki baris data.');
        setResult(null);
      } else {
        setResult(parsed);
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Gagal membaca file Excel.'
      );
      setResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result || result.validRows.length === 0) return;
    setImporting(true);
    try {
      const payloads = result.validRows
        .map((r) => r.values)
        .filter((v): v is InventoryFormValues => v !== null);
      await onImport(payloads);
      handleClose(false);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Impor Data Inventaris (.xlsx)</DialogTitle>
          <DialogDescription>
            Unduh template Excel resmi SDN 006 Sungai Buluh, isi data barang sesuai panduan, lalu unggah untuk validasi otomatis sebelum disimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1: Download Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#00529C] dark:text-sky-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  1. Unduh Template Excel (.xlsx)
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Berisi contoh format kolom KIB serta daftar ruangan dan kategori valid sekolah.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadImportTemplateXLSX(rooms)}
              className="shrink-0"
            >
              <Download className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
              Unduh Template .xlsx
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              2. Unggah File Excel (.xlsx)
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-6 py-7 text-center transition-colors hover:border-[#00529C] dark:hover:border-sky-400"
            >
              <Upload className="h-7 w-7 text-[#00529C] dark:text-sky-400 mb-2" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {parsing
                  ? 'Membaca dan memvalidasi isi spreadsheet...'
                  : 'Seret file .xlsx ke sini atau klik tombol pilih file'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Mendukung format .xlsx dan .xls (sheet &quot;Data Inventaris&quot;)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => void handleFile(e.target.files?.[0])}
                className="hidden"
              />
              <div className="mt-4 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsing || importing}
                >
                  Pilih File .xlsx
                </Button>
                {result && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetState}
                    disabled={importing}
                  >
                    Ganti File
                  </Button>
                )}
              </div>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-700 dark:text-red-300">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Step 3: Validation Preview */}
          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-medium text-slate-700 dark:text-slate-200">
                  File: <span className="font-mono">{result.fileName}</span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {result.validRows.length} baris valid
                  </span>
                  {result.invalidRows.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {result.invalidRows.length} baris perlu diperbaiki
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Baris</TableHead>
                      <TableHead>Kode KIB</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Ruangan</TableHead>
                      <TableHead className="text-right">Jumlah & Nilai</TableHead>
                      <TableHead>Status Validasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.allRows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="font-mono text-xs tabular-nums">
                          #{row.rowNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {row.rawKode || '-'}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {row.rawNama || '-'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {row.rawRuangan || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums whitespace-nowrap">
                          {row.values
                            ? `${formatNumberID(row.values.jumlah)} ${row.values.satuan} · ${formatIDR(
                                row.values.jumlah * row.values.hargaSatuan
                              )}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              Siap Impor
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">
                              {row.errors.join(' ')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={importing}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={!result || result.validRows.length === 0 || importing}
            onClick={handleConfirmImport}
          >
            {importing
              ? 'Mengimpor...'
              : result && result.validRows.length > 0
                ? `Impor ${result.validRows.length} Data Valid`
                : 'Impor Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
