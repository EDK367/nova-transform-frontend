import React from 'react';
import { NavLink } from 'react-router-dom';
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
  LogOut,
  ChevronRight,
  X,
  Building2,
  UserCog,
  Dumbbell,
  Activity,
  Target,
  Scale,
  QrCode,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { RoleName } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: RoleName[];
  badge?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'GENERAL',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'ENTRENADOR', 'RECEPCIONISTA', 'CLIENTE'],
      },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      {
        name: 'Sucursales',
        href: '/branches',
        icon: Building2,
        roles: ['ADMIN'],
      },
      {
        name: 'Usuarios',
        href: '/users',
        icon: Users,
        roles: ['ADMIN'],
      },
      {
        name: 'Roles y Permisos',
        href: '/roles',
        icon: ShieldCheck,
        roles: ['ADMIN'],
      },
      {
        name: 'Recepcionistas',
        href: '/receptionists',
        icon: UserCog,
        roles: ['ADMIN'],
      },
      {
        name: 'Socios',
        href: '/members',
        icon: UserCheck,
        roles: ['ADMIN', 'RECEPCIONISTA'],
      },
    ],
  },
  {
    title: 'MEMBRESÍAS',
    items: [
      {
        name: 'Membresías',
        href: '/memberships',
        icon: CreditCard,
        roles: ['ADMIN', 'RECEPCIONISTA', 'CLIENTE'],
      },
      {
        name: 'Planes',
        href: '/plans',
        icon: Layers,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Beneficios',
        href: '/benefits',
        icon: Award,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
    ],
  },
  {
    title: 'ENTRENAMIENTO',
    items: [
      {
        name: 'Entrenadores',
        href: '/trainers',
        icon: Dumbbell,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Especialidades',
        href: '/specializations',
        icon: Award,
        roles: ['ADMIN', 'ENTRENADOR'],
      },
      {
        name: 'Asignaciones',
        href: '/trainer-assignments',
        icon: UserCheck,
        roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Ejercicios',
        href: '/exercises',
        icon: Activity,
        roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Rutinas',
        href: '/routines',
        icon: Layers,
        roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Bitácora',
        href: '/workout-logs',
        icon: Activity,
        roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      },
    ],
  },
  {
    title: 'SALUD Y METAS',
    items: [
      {
        name: 'Metas y Objetivos',
        href: '/goals',
        icon: Target,
        roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Medidas Físicas',
        href: '/physical-measurements',
        icon: Scale,
        roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
      },
    ],
  },
  {
    title: 'CLASES Y ACCESOS',
    items: [
      {
        name: 'Clases',
        href: '/classes',
        icon: CalendarDays,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Tipos de Clases',
        href: '/class-types',
        icon: Tag,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Asistencias',
        href: '/attendances',
        icon: Clock,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Listas de Espera',
        href: '/waitlists',
        icon: ListOrdered,
        roles: ['ADMIN', 'RECEPCIONISTA', 'CLIENTE'],
      },
      {
        name: 'Calificaciones',
        href: '/ratings',
        icon: Star,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
    ],
  },
  {
    title: 'FINANZAS Y REPORTES',
    items: [
      {
        name: 'Facturas',
        href: '/invoices',
        icon: FileText,
        roles: ['ADMIN', 'RECEPCIONISTA', 'CLIENTE'],
      },
      {
        name: 'Comprobantes de Pago',
        href: '/payment-receipts',
        icon: Receipt,
        roles: ['ADMIN', 'RECEPCIONISTA', 'CLIENTE'],
      },
      {
        name: 'Métodos de Pago',
        href: '/payment-methods',
        icon: Wallet,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Promociones',
        href: '/promotions',
        icon: Sparkles,
        roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'CLIENTE'],
      },
      {
        name: 'Reportes y Carnet QR',
        href: '/reports',
        icon: QrCode,
        roles: ['ADMIN', 'RECEPCIONISTA', 'CLIENTE'],
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#0F172A] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-glow-emerald">
              <span className="text-white font-black text-lg">NT</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider text-white flex items-center gap-1.5">
                NOVA <span className="text-emerald-400">TRANSFORM</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                GYM ENTERPRISE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => {
            // Filter items user has permission to see
            const visibleItems = section.items.filter((item) =>
              item.roles.some((r) => hasRole(r))
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider">
                  {section.title}
                </p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-glow-subtle'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={cn(
                                'h-4 w-4 transition-colors',
                                isActive
                                  ? 'text-emerald-400'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              )}
                            />
                            <span>{item.name}</span>
                          </div>
                          {isActive && (
                            <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.firstName?.charAt(0) || 'U'}
                {user?.lastName?.charAt(0) || ''}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium truncate uppercase">
                  {user?.roleName}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
