import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn('w-full', wrapperClassName)}>
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-150',
              // Light mode styling
              'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
              // Dark mode styling
              'dark:bg-[#0B0F19] dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
              // Focus state with Nova Transform emerald accent
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500',
              // File inputs & disabled states
              'file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50',
              // Icon paddings
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              // Error state
              error && 'border-rose-500 dark:border-rose-500/80 focus-visible:ring-rose-500/30 focus-visible:border-rose-500',
              className
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
