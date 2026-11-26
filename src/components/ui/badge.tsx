import * as React from 'react';
import { cn } from '@/src/lib/utils';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const toneClasses: Record<BadgeTone, string> = {
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  error:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80',
  info:
    'bg-sky-50 text-[#00529C] border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80',
  neutral:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
