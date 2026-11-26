import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readableMessage = error.message || 'Terjadi kesalahan pada aplikasi.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        readableMessage = `Operasi ${parsed.operationType || 'data'} pada "${parsed.path || '-'}" gagal: ${parsed.error}`;
      }
    } catch {
      // Bukan pesan JSON terstruktur
    }
    return { hasError: true, errorMessage: readableMessage };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Terjadi Gangguan Sistem
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 break-words">
              {this.state.errorMessage}
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.location.reload();
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Muat Ulang Aplikasi
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
