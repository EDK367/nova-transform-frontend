import { RoleName, UserResponse } from '@/types';

/**
 * Catálogo tipado de códigos de permisos del sistema NOVA TRANSFORM.
 * Sincronizado con la tabla `permissions` del backend.
 */
export const PERMISSIONS = {
  // SEGURIDAD (Exclusivo SUPER_ADMIN para gestión)
  ROLES_READ: 'ROLES_READ',
  ROLES_MANAGE: 'ROLES_MANAGE',
  PERMISSIONS_READ: 'PERMISSIONS_READ',
  PERMISSIONS_MANAGE: 'PERMISSIONS_MANAGE',

  // USUARIOS Y PERSONAL
  USERS_READ: 'USERS_READ',
  USERS_CREATE: 'USERS_CREATE',
  USERS_UPDATE: 'USERS_UPDATE',
  USERS_DELETE: 'USERS_DELETE',
  RECEPTIONISTS_MANAGE: 'RECEPTIONISTS_MANAGE',

  // SUCURSALES
  BRANCHES_READ: 'BRANCHES_READ',
  BRANCHES_MANAGE: 'BRANCHES_MANAGE',

  // CLIENTES Y SALUD
  MEMBERS_READ: 'MEMBERS_READ',
  MEMBERS_CREATE: 'MEMBERS_CREATE',
  MEMBERS_UPDATE: 'MEMBERS_UPDATE',
  MEMBERS_DELETE: 'MEMBERS_DELETE',
  GOALS_READ: 'GOALS_READ',
  GOALS_MANAGE: 'GOALS_MANAGE',
  MEASUREMENTS_READ: 'MEASUREMENTS_READ',
  MEASUREMENTS_MANAGE: 'MEASUREMENTS_MANAGE',

  // MEMBRESÍAS, PLANES Y BENEFICIOS
  MEMBERSHIPS_READ: 'MEMBERSHIPS_READ',
  MEMBERSHIPS_MANAGE: 'MEMBERSHIPS_MANAGE',
  PLANS_READ: 'PLANS_READ',
  PLANS_MANAGE: 'PLANS_MANAGE',
  BENEFITS_READ: 'BENEFITS_READ',
  BENEFITS_MANAGE: 'BENEFITS_MANAGE',

  // ENTRENAMIENTO Y RUTINAS
  TRAINERS_READ: 'TRAINERS_READ',
  TRAINERS_MANAGE: 'TRAINERS_MANAGE',
  SPECIALIZATIONS_READ: 'SPECIALIZATIONS_READ',
  SPECIALIZATIONS_MANAGE: 'SPECIALIZATIONS_MANAGE',
  ASSIGNMENTS_READ: 'ASSIGNMENTS_READ',
  ASSIGNMENTS_MANAGE: 'ASSIGNMENTS_MANAGE',
  EXERCISES_READ: 'EXERCISES_READ',
  EXERCISES_MANAGE: 'EXERCISES_MANAGE',
  ROUTINES_READ: 'ROUTINES_READ',
  ROUTINES_MANAGE: 'ROUTINES_MANAGE',
  WORKOUT_LOGS_READ: 'WORKOUT_LOGS_READ',
  WORKOUT_LOGS_MANAGE: 'WORKOUT_LOGS_MANAGE',

  // CLASES Y ACCESOS
  CLASSES_READ: 'CLASSES_READ',
  CLASSES_MANAGE: 'CLASSES_MANAGE',
  CLASS_TYPES_READ: 'CLASS_TYPES_READ',
  CLASS_TYPES_MANAGE: 'CLASS_TYPES_MANAGE',
  ENROLLMENTS_MANAGE: 'ENROLLMENTS_MANAGE',
  ATTENDANCES_READ: 'ATTENDANCES_READ',
  ATTENDANCES_MANAGE: 'ATTENDANCES_MANAGE',
  WAITLISTS_MANAGE: 'WAITLISTS_MANAGE',
  RATINGS_READ: 'RATINGS_READ',
  RATINGS_CREATE: 'RATINGS_CREATE',

  // FINANZAS
  INVOICES_READ: 'INVOICES_READ',
  INVOICES_MANAGE: 'INVOICES_MANAGE',
  PAYMENTS_READ: 'PAYMENTS_READ',
  PAYMENTS_MANAGE: 'PAYMENTS_MANAGE',
  PAYMENT_METHODS_READ: 'PAYMENT_METHODS_READ',
  PAYMENT_METHODS_MANAGE: 'PAYMENT_METHODS_MANAGE',
  PROMOTIONS_READ: 'PROMOTIONS_READ',
  PROMOTIONS_MANAGE: 'PROMOTIONS_MANAGE',

  // REPORTES
  REPORTS_VIEW: 'REPORTS_VIEW',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | (string & {});

export interface AccessPolicy {
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAllPermissions?: boolean;
  superAdminOnly?: boolean;
}

const ALL_PERMISSION_CODES = Object.values(PERMISSIONS) as PermissionCode[];

/**
 * Techo estricto de permisos permitidos por cada rol del sistema (Defense-in-Depth).
 * Garantiza que aunque localStorage o una sesión antigua tenga permisos residuales,
 * ningún rol pueda jamás ejercer permisos fuera de su nivel de autorización.
 */
export const ROLE_PERMISSION_CEILING: Record<RoleName, readonly PermissionCode[]> = {
  SUPER_ADMIN: ALL_PERMISSION_CODES,
  ADMIN: ALL_PERMISSION_CODES.filter(
    (code) => code !== PERMISSIONS.ROLES_MANAGE && code !== PERMISSIONS.PERMISSIONS_MANAGE
  ),
  RECEPCIONISTA: [
    PERMISSIONS.BRANCHES_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_CREATE,
    PERMISSIONS.MEMBERS_UPDATE,
    PERMISSIONS.MEMBERSHIPS_READ,
    PERMISSIONS.MEMBERSHIPS_MANAGE,
    PERMISSIONS.PLANS_READ,
    PERMISSIONS.BENEFITS_READ,
    PERMISSIONS.TRAINERS_READ,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.CLASSES_READ,
    PERMISSIONS.CLASS_TYPES_READ,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.ATTENDANCES_READ,
    PERMISSIONS.ATTENDANCES_MANAGE,
    PERMISSIONS.WAITLISTS_MANAGE,
    PERMISSIONS.RATINGS_READ,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.INVOICES_MANAGE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.PAYMENT_METHODS_READ,
    PERMISSIONS.PROMOTIONS_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],
  ENTRENADOR: [
    PERMISSIONS.BRANCHES_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.GOALS_READ,
    PERMISSIONS.GOALS_MANAGE,
    PERMISSIONS.MEASUREMENTS_READ,
    PERMISSIONS.MEASUREMENTS_MANAGE,
    PERMISSIONS.TRAINERS_READ,
    PERMISSIONS.SPECIALIZATIONS_READ,
    PERMISSIONS.SPECIALIZATIONS_MANAGE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.EXERCISES_READ,
    PERMISSIONS.EXERCISES_MANAGE,
    PERMISSIONS.ROUTINES_READ,
    PERMISSIONS.ROUTINES_MANAGE,
    PERMISSIONS.WORKOUT_LOGS_READ,
    PERMISSIONS.WORKOUT_LOGS_MANAGE,
    PERMISSIONS.CLASSES_READ,
    PERMISSIONS.CLASS_TYPES_READ,
    PERMISSIONS.WAITLISTS_MANAGE,
    PERMISSIONS.ATTENDANCES_READ,
    PERMISSIONS.RATINGS_READ,
  ],
  CLIENTE: [
    PERMISSIONS.GOALS_READ,
    PERMISSIONS.GOALS_MANAGE,
    PERMISSIONS.MEASUREMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.EXERCISES_READ,
    PERMISSIONS.ROUTINES_READ,
    PERMISSIONS.WORKOUT_LOGS_READ,
    PERMISSIONS.WORKOUT_LOGS_MANAGE,
    PERMISSIONS.CLASSES_READ,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.ATTENDANCES_READ,
    PERMISSIONS.WAITLISTS_MANAGE,
    PERMISSIONS.RATINGS_READ,
    PERMISSIONS.RATINGS_CREATE,
  ],
};

/**
 * Filtra y sanea los permisos de un usuario contra el techo máximo permitido para su rol.
 */
export function getEffectivePermissions(user: UserResponse | null): string[] {
  if (!user || !user.roleName) return [];
  if (user.roleName === 'SUPER_ADMIN') {
    return Array.from(new Set([...ALL_PERMISSION_CODES, ...(user.permissions || [])]));
  }
  const ceiling = ROLE_PERMISSION_CEILING[user.roleName] || [];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.filter((perm) => ceiling.includes(perm));
  }
  return [...ceiling];
}

/**
 * Motor centralizado de evaluación de políticas de seguridad (Intersección estricta AND).
 * 1. Verifica autenticación.
 * 2. SUPER_ADMIN posee acceso total universal.
 * 3. Si `superAdminOnly` está activo, rechaza a cualquier otro rol.
 * 4. Si `roles` está definido, exige que el rol del usuario esté incluido obligatoriamente.
 * 5. Si `permissions` está definido, exige que el usuario posea los permisos efectivos saneados.
 */
export function evaluateAccessPolicy(
  user: UserResponse | null,
  policy?: AccessPolicy
): boolean {
  if (!user || !user.roleName) return false;
  if (!policy) return true;

  if (user.roleName === 'SUPER_ADMIN') return true;
  if (policy.superAdminOnly) return false;

  // Validación estricta de Rol (AND)
  if (policy.roles && policy.roles.length > 0) {
    if (!policy.roles.includes(user.roleName)) {
      return false;
    }
  }

  // Validación estricta de Permisos saneados por el techo del rol (AND)
  if (policy.permissions && policy.permissions.length > 0) {
    const effectivePermissions = getEffectivePermissions(user);
    const hasRequiredPermissions = policy.requireAllPermissions
      ? policy.permissions.every((code) => effectivePermissions.includes(code))
      : policy.permissions.some((code) => effectivePermissions.includes(code));

    if (!hasRequiredPermissions) {
      return false;
    }
  }

  return true;
}
