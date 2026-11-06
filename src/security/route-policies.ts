import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCheck,
  CreditCard,
  Layers,
  Award,
  CalendarDays,
  Tag,
  Clock,
  FileText,
  Receipt,
  Wallet,
  Sparkles,
  ListOrdered,
  Star,
  Building2,
  UserCog,
  Dumbbell,
  Activity,
  Target,
  Scale,
  QrCode,
} from 'lucide-react';
import { AccessPolicy, PERMISSIONS } from './permissions';

export interface RoutePolicyConfig {
  path: string;
  name: string;
  section:
    | 'GENERAL'
    | 'ADMINISTRACIÓN'
    | 'MEMBRESÍAS'
    | 'ENTRENAMIENTO'
    | 'SALUD Y METAS'
    | 'CLASES Y ACCESOS'
    | 'FINANZAS Y REPORTES';
  icon: React.ComponentType<{ className?: string }>;
  policy: AccessPolicy;
}

/**
 * Fuente Única de Verdad (Single Source of Truth) para todas las rutas y menús del sistema.
 * Sincroniza de forma centralizada e inmutable el Sidebar, AppRoutes y ProtectedRoute.
 */
export const ROUTE_POLICIES = {
  dashboard: {
    path: '/dashboard',
    name: 'Dashboard',
    section: 'GENERAL',
    icon: LayoutDashboard,
    policy: {
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
    },
  },

  // ADMINISTRACIÓN
  branches: {
    path: '/branches',
    name: 'Sucursales',
    section: 'ADMINISTRACIÓN',
    icon: Building2,
    policy: {
      roles: ['ADMIN'],
      permissions: [PERMISSIONS.BRANCHES_MANAGE],
    },
  },
  users: {
    path: '/users',
    name: 'Usuarios',
    section: 'ADMINISTRACIÓN',
    icon: Users,
    policy: {
      roles: ['ADMIN'],
      permissions: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE],
    },
  },
  roles: {
    path: '/roles',
    name: 'Roles y Permisos',
    section: 'ADMINISTRACIÓN',
    icon: ShieldCheck,
    policy: {
      roles: ['SUPER_ADMIN'],
      permissions: [PERMISSIONS.ROLES_MANAGE, PERMISSIONS.PERMISSIONS_MANAGE],
      superAdminOnly: true,
    },
  },
  receptionists: {
    path: '/receptionists',
    name: 'Recepcionistas',
    section: 'ADMINISTRACIÓN',
    icon: UserCog,
    policy: {
      roles: ['ADMIN'],
      permissions: [PERMISSIONS.RECEPTIONISTS_MANAGE],
    },
  },
  members: {
    path: '/members',
    name: 'Clientes',
    section: 'ADMINISTRACIÓN',
    icon: UserCheck,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.MEMBERS_READ, PERMISSIONS.MEMBERS_CREATE],
    },
  },

  // MEMBRESÍAS (Exclusivo de Administración y Recepción — PROHIBIDO para CLIENTE y ENTRENADOR)
  memberships: {
    path: '/memberships',
    name: 'Membresías',
    section: 'MEMBRESÍAS',
    icon: CreditCard,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.MEMBERSHIPS_READ, PERMISSIONS.MEMBERSHIPS_MANAGE],
    },
  },
  plans: {
    path: '/plans',
    name: 'Planes',
    section: 'MEMBRESÍAS',
    icon: Layers,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.PLANS_READ, PERMISSIONS.PLANS_MANAGE],
    },
  },
  benefits: {
    path: '/benefits',
    name: 'Beneficios',
    section: 'MEMBRESÍAS',
    icon: Award,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.BENEFITS_READ, PERMISSIONS.BENEFITS_MANAGE],
    },
  },

  // ENTRENAMIENTO
  trainers: {
    path: '/trainers',
    name: 'Entrenadores',
    section: 'ENTRENAMIENTO',
    icon: Dumbbell,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR'],
      permissions: [PERMISSIONS.TRAINERS_READ, PERMISSIONS.TRAINERS_MANAGE],
    },
  },
  specializations: {
    path: '/specializations',
    name: 'Especialidades',
    section: 'ENTRENAMIENTO',
    icon: Award,
    policy: {
      roles: ['ADMIN', 'ENTRENADOR'],
      permissions: [PERMISSIONS.SPECIALIZATIONS_READ, PERMISSIONS.SPECIALIZATIONS_MANAGE],
    },
  },
  trainerAssignments: {
    path: '/trainer-assignments',
    name: 'Asignaciones',
    section: 'ENTRENAMIENTO',
    icon: UserCheck,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_MANAGE],
    },
  },
  exercises: {
    path: '/exercises',
    name: 'Ejercicios',
    section: 'ENTRENAMIENTO',
    icon: Activity,
    policy: {
      roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.EXERCISES_READ, PERMISSIONS.EXERCISES_MANAGE],
    },
  },
  routines: {
    path: '/routines',
    name: 'Rutinas',
    section: 'ENTRENAMIENTO',
    icon: Layers,
    policy: {
      roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.ROUTINES_READ, PERMISSIONS.ROUTINES_MANAGE],
    },
  },
  workoutLogs: {
    path: '/workout-logs',
    name: 'Bitácora',
    section: 'ENTRENAMIENTO',
    icon: Activity,
    policy: {
      roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.WORKOUT_LOGS_READ, PERMISSIONS.WORKOUT_LOGS_MANAGE],
    },
  },

  // SALUD Y METAS
  goals: {
    path: '/goals',
    name: 'Metas y Objetivos',
    section: 'SALUD Y METAS',
    icon: Target,
    policy: {
      roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.GOALS_READ, PERMISSIONS.GOALS_MANAGE],
    },
  },
  physicalMeasurements: {
    path: '/physical-measurements',
    name: 'Medidas Físicas',
    section: 'SALUD Y METAS',
    icon: Scale,
    policy: {
      roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.MEASUREMENTS_READ, PERMISSIONS.MEASUREMENTS_MANAGE],
    },
  },

  // CLASES Y ACCESOS
  classes: {
    path: '/classes',
    name: 'Clases',
    section: 'CLASES Y ACCESOS',
    icon: CalendarDays,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.CLASSES_READ, PERMISSIONS.CLASSES_MANAGE],
    },
  },
  classTypes: {
    path: '/class-types',
    name: 'Tipos de Clases',
    section: 'CLASES Y ACCESOS',
    icon: Tag,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR'],
      permissions: [PERMISSIONS.CLASS_TYPES_READ, PERMISSIONS.CLASS_TYPES_MANAGE],
    },
  },
  attendances: {
    path: '/attendances',
    name: 'Asistencias',
    section: 'CLASES Y ACCESOS',
    icon: Clock,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.ATTENDANCES_READ, PERMISSIONS.ATTENDANCES_MANAGE],
    },
  },
  waitlists: {
    path: '/waitlists',
    name: 'Listas de Espera',
    section: 'CLASES Y ACCESOS',
    icon: ListOrdered,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.WAITLISTS_MANAGE],
    },
  },
  ratings: {
    path: '/ratings',
    name: 'Calificaciones',
    section: 'CLASES Y ACCESOS',
    icon: Star,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      permissions: [PERMISSIONS.RATINGS_READ, PERMISSIONS.RATINGS_CREATE],
    },
  },

  // FINANZAS Y REPORTES (Exclusivo de Administración y Recepción — PROHIBIDO para CLIENTE y ENTRENADOR)
  invoices: {
    path: '/invoices',
    name: 'Facturas',
    section: 'FINANZAS Y REPORTES',
    icon: FileText,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_MANAGE],
    },
  },
  paymentReceipts: {
    path: '/payment-receipts',
    name: 'Comprobantes de Pago',
    section: 'FINANZAS Y REPORTES',
    icon: Receipt,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.PAYMENTS_READ, PERMISSIONS.PAYMENTS_MANAGE],
    },
  },
  paymentMethods: {
    path: '/payment-methods',
    name: 'Métodos de Pago',
    section: 'FINANZAS Y REPORTES',
    icon: Wallet,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.PAYMENT_METHODS_READ, PERMISSIONS.PAYMENT_METHODS_MANAGE],
    },
  },
  promotions: {
    path: '/promotions',
    name: 'Promociones',
    section: 'FINANZAS Y REPORTES',
    icon: Sparkles,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.PROMOTIONS_READ, PERMISSIONS.PROMOTIONS_MANAGE],
    },
  },
  reports: {
    path: '/reports',
    name: 'Reportes y Carnet QR',
    section: 'FINANZAS Y REPORTES',
    icon: QrCode,
    policy: {
      roles: ['ADMIN', 'RECEPCIONISTA'],
      permissions: [PERMISSIONS.REPORTS_VIEW],
    },
  },
} as const satisfies Record<string, RoutePolicyConfig>;

export type RoutePolicyKey = keyof typeof ROUTE_POLICIES;

const SECTION_ORDER: RoutePolicyConfig['section'][] = [
  'GENERAL',
  'ADMINISTRACIÓN',
  'MEMBRESÍAS',
  'ENTRENAMIENTO',
  'SALUD Y METAS',
  'CLASES Y ACCESOS',
  'FINANZAS Y REPORTES',
];

export const NAVIGATION_SECTIONS: { title: RoutePolicyConfig['section']; items: RoutePolicyConfig[] }[] =
  SECTION_ORDER.map((sectionTitle) => ({
    title: sectionTitle,
    items: Object.values(ROUTE_POLICIES).filter((route) => route.section === sectionTitle),
  }));

/**
 * Busca la política de seguridad correspondiente a un pathname dado.
 */
export function getRoutePolicyByPath(pathname: string): AccessPolicy | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/dashboard';
  const match = Object.values(ROUTE_POLICIES).find((r) => r.path === normalized);
  return match?.policy;
}
