import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/20 text-emerald-400 border border-emerald-500/30',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-red-500/20 text-red-400 border border-red-500/30',
        outline: 'text-foreground border border-border',
        warning: 'border-transparent bg-amber-500/20 text-amber-400 border border-amber-500/30',
        info: 'border-transparent bg-blue-500/20 text-blue-400 border border-blue-500/30',
        purple: 'border-transparent bg-purple-500/20 text-purple-400 border border-purple-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'destructive' | 'warning' | 'info' | 'secondary' | 'purple' = 'secondary';
  let label = status;

  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'PAID':
    case 'COMPLETED':
    case 'ATTENDED':
    case 'ENROLLED':
      variant = 'default';
      label = status === 'ACTIVE' ? 'Activo' : status === 'PAID' ? 'Pagado' : status === 'COMPLETED' ? 'Completado' : status === 'ATTENDED' ? 'Asistió' : 'Inscrito';
      break;
    case 'CANCELLED':
    case 'REFUNDED':
    case 'EXPIRED':
    case 'INACTIVE':
      variant = 'destructive';
      label = status === 'CANCELLED' ? 'Cancelado' : status === 'REFUNDED' ? 'Reembolsado' : status === 'EXPIRED' ? 'Expirado' : 'Inactivo';
      break;
    case 'FROZEN':
    case 'PARTIALLY_PAID':
    case 'WAITLISTED':
      variant = 'warning';
      label = status === 'FROZEN' ? 'Congelado' : status === 'PARTIALLY_PAID' ? 'Pago Parcial' : 'Lista de espera';
      break;
    case 'PENDING':
    case 'SCHEDULED':
      variant = 'info';
      label = status === 'PENDING' ? 'Pendiente' : 'Programada';
      break;
    case 'IN_PROGRESS':
      variant = 'purple';
      label = 'En curso';
      break;
    default:
      label = status || 'N/A';
  }

  return <Badge variant={variant}>{label}</Badge>;
}

export { Badge, badgeVariants };
