import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AccessPolicy, PermissionCode } from '@/security/permissions';
import { getRoutePolicyByPath } from '@/security/route-policies';
import { RoleName } from '@/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  policy?: AccessPolicy;
  allowedRoles?: RoleName[];
  requiredPermissions?: PermissionCode[];
  requireAllPermissions?: boolean;
  requireSuperAdminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  policy,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  requireSuperAdminOnly = false,
}) => {
  const { user, isAuthenticated, isLoading, isSuperAdmin, checkPolicy } = useAuth();
  const location = useLocation();

  // Resuelve la política explícita o automáticamente desde la tabla central ROUTE_POLICIES
  const routePolicy = policy ?? getRoutePolicyByPath(location.pathname);

  const effectivePolicy: AccessPolicy = {
    roles: allowedRoles ?? routePolicy?.roles,
    permissions: requiredPermissions ?? routePolicy?.permissions,
    requireAllPermissions: requireAllPermissions || routePolicy?.requireAllPermissions,
    superAdminOnly: requireSuperAdminOnly || routePolicy?.superAdminOnly,
  };

  const isAuthorized =
    Boolean(isAuthenticated && user) &&
    (!effectivePolicy.superAdminOnly || isSuperAdmin) &&
    checkPolicy(effectivePolicy);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isAuthorized) {
      toast.error('Acceso denegado: no tienes autorización para ingresar a esta ruta.', {
        id: `unauthorized-${location.pathname}`,
      });
    }
  }, [isLoading, isAuthenticated, user, isAuthorized, location.pathname]);

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

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
