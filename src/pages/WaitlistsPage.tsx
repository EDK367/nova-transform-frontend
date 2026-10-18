import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classService } from '@/services/class.service';
import { ClassResponse, WaitlistResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDateTime, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ListOrdered, Trash2, CalendarDays, Bell } from 'lucide-react';

export const WaitlistsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isTrainer = hasRole('ENTRENADOR');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [removingWaitlist, setRemovingWaitlist] = useState<WaitlistResponse | null>(null);

  // Query classes for Admin/Receptionist/Trainer to pick from
  const { data: classesData } = useQuery({
    queryKey: ['classes-waitlist-select'],
    queryFn: () => classService.getAll({ page: 0, size: 50, status: 'SCHEDULED' }),
    enabled: !isClient,
  });

  // Query waitlist: either my waitlist or class waitlist
  const { data: waitlist, isLoading } = useQuery<WaitlistResponse[]>({
    queryKey: ['waitlists', isClient ? 'my' : selectedClassId],
    queryFn: () => {
      if (isClient) {
        return classService.getMyWaitlist();
      }
      if (selectedClassId) {
        return classService.getClassWaitlist(selectedClassId);
      }
      return Promise.resolve([]);
    },
    enabled: isClient || !!selectedClassId,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => classService.removeFromWaitlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlists'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setRemovingWaitlist(null);
      toast.success('Registro retirado de la lista de espera');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Listas de Espera
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isClient
            ? 'Monitorea tus posiciones en lista de espera para clases con aforo completo.'
            : 'Supervisa los socios en espera de cupo disponible por cada clase programada.'}
        </p>
      </div>

      {!isClient && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-80">
                <Label>Selecciona una Clase Programada:</Label>
                <Select
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(Number(e.target.value) || null)}
                >
                  <option value="">Selecciona clase para ver espera...</option>
                  {classesData?.content?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classTypeName} - {formatDateTime(c.schedule)} ({c.waitlistCount} en espera)
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            {isClient
              ? 'Mis Solicitudes en Espera'
              : selectedClassId
              ? 'Socios en Fila de Espera'
              : 'Selecciona una clase'}
          </CardTitle>
          <CardDescription>
            {isClient
              ? 'Si se libera un cupo, el sistema te notificará de inmediato.'
              : 'Orden de prelación por fecha de registro en el cupo.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!isClient && !selectedClassId ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Por favor selecciona una clase arriba para inspeccionar su lista de espera.
            </div>
          ) : isLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : !waitlist || waitlist.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="No hay registros en lista de espera"
              description={
                isClient
                  ? 'No estás registrado en la lista de espera de ninguna sesión.'
                  : 'Esta clase cuenta con lugares disponibles o no tiene socios esperando.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Posición</th>
                    <th className="py-3 px-4">Socio</th>
                    <th className="py-3 px-4">Clase / Sesión</th>
                    <th className="py-3 px-4">Fecha de Inscripción</th>
                    <th className="py-3 px-4">Notificación</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {waitlist.map((w, index) => (
                    <tr key={w.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-primary font-mono">
                        #{index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <p>{w.memberName}</p>
                        <p className="text-xs text-muted-foreground">{w.memberEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          <span>{w.classTypeName || `Clase #${w.classId}`}</span>
                        </div>
                        {w.classSchedule && (
                          <p className="text-muted-foreground mt-0.5">
                            {formatDateTime(w.classSchedule)}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {formatDate(w.registrationDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Bell className="h-3 w-3 text-amber-400" />
                          {w.notified ? 'Notificado' : 'En espera'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-500 hover:bg-red-500/10 text-xs"
                          onClick={() => setRemovingWaitlist(w)}
                          title="Retirar de la lista de espera"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Retirar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={!!removingWaitlist}
        onClose={() => setRemovingWaitlist(null)}
        onConfirm={() => removingWaitlist && removeMutation.mutate(removingWaitlist.id)}
        title="Retirar de Lista de Espera"
        message={`¿Deseas retirar a "${removingWaitlist?.memberName}" de la lista de espera para ${removingWaitlist?.classTypeName}?`}
        confirmText="Retirar de la Lista"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
};
