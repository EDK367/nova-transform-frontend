import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn('w-full', wrapperClassName)}>
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-150',
            // Light mode styling
            'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
            // Dark mode styling
            'dark:bg-[#0B0F19] dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
            // Focus state with Nova Transform emerald accent
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500',
            // Disabled states
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50',
            // Error state
            error && 'border-rose-500 dark:border-rose-500/80 focus-visible:ring-rose-500/30 focus-visible:border-rose-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
