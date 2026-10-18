import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
}) => {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      glow: 'hover:border-emerald-500/40',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      glow: 'hover:border-blue-500/40',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      glow: 'hover:border-purple-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      glow: 'hover:border-amber-500/40',
    },
  }[color];

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-300 hover:shadow-lg', colorStyles.glow)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">
              {value}
            </h4>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                {subtitle}
              </p>
            )}
            {trend && (
              <p className="text-xs font-semibold mt-2 flex items-center gap-1">
                <span className={trend.isPositive ? 'text-emerald-500' : 'text-red-500'}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-muted-foreground font-normal">vs periodo ant.</span>
              </p>
            )}
          </div>
          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center border', colorStyles.bg)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
