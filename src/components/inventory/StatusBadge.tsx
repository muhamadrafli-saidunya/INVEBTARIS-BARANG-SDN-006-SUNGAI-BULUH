import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import type { KondisiBarang, StatusVerifikasi } from '@/src/types/inventory';

export function KondisiBadge({ kondisi }: { kondisi: KondisiBarang }) {
  if (kondisi === 'Baik') {
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        Baik
      </Badge>
    );
  }
  if (kondisi === 'Rusak Ringan') {
    return (
      <Badge tone="warning">
        <AlertTriangle className="h-3 w-3 shrink-0" />
        Rusak Ringan
      </Badge>
    );
  }
  return (
    <Badge tone="error">
      <XCircle className="h-3 w-3 shrink-0" />
      Rusak Berat
    </Badge>
  );
}

export function VerifikasiBadge({ status }: { status: StatusVerifikasi }) {
  if (status === 'Terverifikasi') {
    return (
      <Badge tone="info">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        Terverifikasi
      </Badge>
    );
  }
  if (status === 'Perlu Audit') {
    return (
      <Badge tone="warning">
        <Clock className="h-3 w-3 shrink-0" />
        Perlu Audit
      </Badge>
    );
  }
  return (
    <Badge tone="error">
      <Trash2 className="h-3 w-3 shrink-0" />
      Menunggu Penghapusan
    </Badge>
  );
}
