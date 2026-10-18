import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { RoleResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { ShieldCheck, Lock, UserCheck, Dumbbell, Shield } from 'lucide-react';

const roleMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; capabilities: string[] }> = {
  ADMIN: {
    icon: ShieldCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    capabilities: [
      'Acceso total al sistema',
      'Gestión de usuarios y asignación de roles',
      'Creación y modificación de planes y beneficios',
      'Cancelación de membresías y clases',
      'Emisión de facturas y anulación de pagos',
      'Supervisión de sucursales e indicadores financieros',
    ],
  },
  RECEPCIONISTA: {
    icon: UserCheck,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    capabilities: [
      'Registro y check-in/check-out de asistencias',
      'Inscripción de socios a planes y membresías',
      'Cobro y emisión de comprobantes de pago',
      'Congelamiento y reactivación de membresías',
      'Consulta del directorio de socios y clases',
    ],
  },
  ENTRENADOR: {
    icon: Dumbbell,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    capabilities: [
      'Consulta de clases asignadas y cupos disponibles',
      'Visualización de listas de socios inscritos',
      'Revisión de calificaciones y feedback de sus sesiones',
      'Consulta de asistencias a sus clases',
    ],
  },
  CLIENTE: {
    icon: Shield,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    capabilities: [
      'Visualización de estado de su membresía y vigencia',
      'Inscripción a clases grupales y lista de espera',
      'Calificación y retroalimentación de entrenadores',
      'Consulta de facturas personales y comprobantes',
      'Historial de asistencias registradas',
    ],
  },
};

export const RolesPage: React.FC = () => {
  const { data: roles, isLoading } = useQuery<RoleResponse[]>({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Roles y Control de Acceso (RBAC)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catálogo del modelo de permisos del sistema NOVA TRANSFORM basado en roles MicroProfile JWT.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center gap-3 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 text-primary shrink-0" />
        <span>
          Los roles del sistema son definidos por la arquitectura de seguridad y no admiten modificación directa desde la interfaz para salvaguardar la integridad de las directivas `@RolesAllowed`.
        </span>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles?.map((role) => {
            const meta = roleMeta[role.name] || {
              icon: Shield,
              color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
              capabilities: ['Permisos definidos en backend'],
            };
            const Icon = meta.icon;

            return (
              <Card key={role.id} className="overflow-hidden border border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>{role.name}</span>
                          <span className="text-xs font-mono font-normal text-muted-foreground">
                            ID: {role.id}
                          </span>
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                          {role.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Alcance y Capacidades:
                  </p>
                  <ul className="space-y-2">
                    {meta.capabilities.map((cap, i) => (
                      <li key={i} className="text-xs text-foreground/90 flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
