import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionCode } from '@/security/permissions';
import { RoleName } from '@/types';

export interface RequirePermissionProps {
  /** Código único o lista de códigos de permisos requeridos */
  permission?: PermissionCode | PermissionCode[];
  /** Lista de códigos de permisos (alias de `permission`) */
  permissions?: PermissionCode[];
  /** Roles permitidos como respaldo si el usuario no tiene matriz de permisos cargada */
  roles?: RoleName[];
  /** Si es true, el usuario debe poseer TODOS los permisos indicados (AND). Por defecto es false (OR). */
  requireAll?: boolean;
  /** Si es true, solo el propietario SUPER_ADMIN puede ver el contenido */
  superAdminOnly?: boolean;
  /** Elemento alternativo a mostrar cuando no se cumple la política (por defecto `null`) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Guard declarativo de permisos y políticas de acceso (equivalente en React a `@RequirePermission`).
 * Ejemplo de uso:
 * ```tsx
 * <RequirePermission permission="BRANCHES_MANAGE">
 *   <Button>Nueva Sucursal</Button>
 * </RequirePermission>
 * ```
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  permissions,
  roles,
  requireAll = false,
  superAdminOnly = false,
  fallback = null,
  children,
}) => {
  const { user, isSuperAdmin, checkPolicy } = useAuth();

  if (!user) return <>{fallback}</>;
  if (isSuperAdmin) return <>{children}</>;
  if (superAdminOnly) return <>{fallback}</>;

  const requiredPerms: PermissionCode[] = [
    ...(Array.isArray(permission) ? permission : permission ? [permission] : []),
    ...(permissions || []),
  ];

  const authorized = checkPolicy({
    permissions: requiredPerms,
    roles,
    requireAllPermissions: requireAll,
    superAdminOnly,
  });

  if (!authorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Higher-Order Component (estilo decorador `@RequirePermission`) para envolver componentes o páginas enteras.
 */
export function withRequirePermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  policy: Omit<RequirePermissionProps, 'children'>
): React.FC<P> {
  const ComponentWithPermission: React.FC<P> = (props) => (
    <RequirePermission {...policy}>
      <WrappedComponent {...props} />
    </RequirePermission>
  );
  ComponentWithPermission.displayName = `withRequirePermission(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  return ComponentWithPermission;
}
