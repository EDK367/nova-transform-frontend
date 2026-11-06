import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS, PermissionCode } from '@/security/permissions';

/**
 * Hook de conveniencia para consultar permisos y políticas de seguridad en cualquier componente.
 */
export const usePermissions = () => {
  const { user, isSuperAdmin, hasRole, hasPermission, hasAllPermissions, checkPolicy } = useAuth();

  return {
    PERMISSIONS,
    permissions: user?.permissions || [],
    isSuperAdmin,
    hasRole,
    can: hasPermission,
    canAll: hasAllPermissions,
    checkPolicy,
  };
};
