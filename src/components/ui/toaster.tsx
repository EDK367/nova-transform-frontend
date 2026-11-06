import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toaster: React.FC = () => {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark'}
      position="top-right"
      richColors={false}
      closeButton
      duration={4000}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
        info: <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
        error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />,
        close: <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group relative w-full max-w-[390px] flex items-start gap-3.5 pl-4 pr-10 py-3.5 rounded-xl border font-sans text-sm shadow-xl select-none transition-all duration-200 overflow-hidden' +
            ' bg-[#FFFFFF] text-slate-900 border-slate-200/80 shadow-slate-900/10' +
            ' dark:bg-[#0F172A] dark:text-slate-100 dark:border-slate-800 dark:shadow-black/60',
          title: 'font-semibold text-sm leading-snug tracking-tight text-slate-900 dark:text-white',
          description: 'text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed',
          content: 'flex flex-col flex-1 min-w-0 pr-1',
          icon: 'flex shrink-0 self-start',
          closeButton:
            '!absolute !top-3 !right-3 !left-auto !bottom-auto !transform-none !h-6 !w-6 !p-0 !m-0 !flex !items-center !justify-center !rounded-md' +
            ' !bg-slate-100 hover:!bg-slate-200 text-slate-500 hover:text-slate-800 !border-0 transition-all cursor-pointer' +
            ' dark:!bg-slate-800/80 dark:hover:!bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100',
          actionButton:
            'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors',
          cancelButton:
            'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors',
          success:
            '!border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/30 dark:to-[#0F172A]',
          error:
            '!border-rose-500/40 bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/30 dark:to-[#0F172A]',
          warning:
            '!border-amber-500/40 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/30 dark:to-[#0F172A]',
          info:
            '!border-sky-500/40 bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/30 dark:to-[#0F172A]',
        },
      }}
    />
  );
};

export default Toaster;
