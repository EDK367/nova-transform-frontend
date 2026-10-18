import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleName } from '@/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <p className="text-sm font-medium text-slate-300">
          Cargando entorno seguro...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.roleName)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center my-12 bg-card rounded-2xl border border-border">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Acceso No Autorizado</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tu rol actual (<span className="text-primary font-semibold">{user.roleName}</span>) no tiene los permisos necesarios para acceder a este módulo.
        </p>
        <Button onClick={() => window.history.back()} variant="outline">
          Volver atrás
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
