import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipService } from '@/services/membership.service';
import { memberService } from '@/services/member.service';
import {
  CancelMembershipRequest,
  ChangePlanRequest,
  CreateMembershipRequest,
  FreezeMembershipRequest,
  MembershipFreezeResponse,
  MembershipHistoryResponse,
  MembershipPlanResponse,
  MembershipResponse,
  MembershipStatus,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Snowflake,
  Sun,
  XCircle,
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

const subscribeSchema = z.object({
  memberId: z.string().min(1, 'Selecciona un socio'),
  planId: z.coerce.number().min(1, 'Selecciona un plan'),
  startDate: z.string().optional(),
});

type SubscribeFormData = z.infer<typeof subscribeSchema>;

const changePlanSchema = z.object({
  newPlanId: z.coerce.number().min(1, 'Selecciona el nuevo plan'),
  reason: z.string().optional(),
});

type ChangePlanFormData = z.infer<typeof changePlanSchema>;

const freezeSchema = z.object({
  startDate: z.string().min(1, 'Fecha inicio requerida'),
  endDate: z.string().min(1, 'Fecha fin requerida'),
  reason: z.string().optional(),
});

type FreezeFormData = z.infer<typeof freezeSchema>;

const cancelSchema = z.object({
  reason: z.string().min(1, 'Ingresa el motivo de cancelación'),
});

type CancelFormData = z.infer<typeof cancelSchema>;

export const MembershipsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isAdmin = hasRole('ADMIN');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [changingPlanMembership, setChangingPlanMembership] = useState<MembershipResponse | null>(null);
  const [freezingMembership, setFreezingMembership] = useState<MembershipResponse | null>(null);
  const [cancellingMembership, setCancellingMembership] = useState<MembershipResponse | null>(null);
  const [unfreezingMembership, setUnfreezingMembership] = useState<MembershipResponse | null>(null);
  const [historyMembershipId, setHistoryMembershipId] = useState<number | null>(null);

  // Queries
  const { data: membershipsData, isLoading } = useQuery({
    queryKey: ['memberships', page, statusFilter],
    queryFn: () =>
      isAdminOrRecep
        ? membershipService.getAll({
            page,
            size: 10,
            status: statusFilter || undefined,
            sortBy: 'createdAt',
            sortDirection: 'desc',
          })
        : membershipService.getMy().then((data) => ({
            content: data,
            page: 0,
            size: data.length,
            totalElements: data.length,
            totalPages: 1,
          })),
  });

  const { data: plans } = useQuery<MembershipPlanResponse[]>({
    queryKey: ['plans'],
    queryFn: () => membershipService.getPlans(),
  });

  const { data: membersList } = useQuery({
    queryKey: ['members-select'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isAdminOrRecep,
  });

  const { data: historyList, isLoading: loadingHistory } = useQuery<MembershipHistoryResponse[]>({
    queryKey: ['membership-history', historyMembershipId],
    queryFn: () => membershipService.getHistory(historyMembershipId!),
    enabled: !!historyMembershipId,
  });

  const { data: freezesList } = useQuery<MembershipFreezeResponse[]>({
    queryKey: ['membership-freezes', historyMembershipId],
    queryFn: () => membershipService.getFreezes(historyMembershipId!),
    enabled: !!historyMembershipId,
  });

  // Forms
  const subscribeForm = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const changePlanForm = useForm<ChangePlanFormData>({
    resolver: zodResolver(changePlanSchema),
  });

  const freezeForm = useForm<FreezeFormData>({
    resolver: zodResolver(freezeSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    },
  });

  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  });

  // Mutations
  const subscribeMutation = useMutation({
    mutationFn: (data: CreateMembershipRequest) => membershipService.subscribe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setIsSubscribeOpen(false);
      subscribeForm.reset();
      toast.success('Socio suscrito a la membresía exitosamente');
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePlanRequest }) =>
      membershipService.changePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setChangingPlanMembership(null);
      toast.success('Plan de membresía modificado con éxito');
    },
  });

  const freezeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FreezeMembershipRequest }) =>
      membershipService.freeze(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setFreezingMembership(null);
      toast.success('Membresía congelada correctamente');
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: number) => membershipService.unfreeze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setUnfreezingMembership(null);
      toast.success('Membresía reactivada exitosamente');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelMembershipRequest }) =>
      membershipService.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setCancellingMembership(null);
      toast.success('Membresía cancelada por administrador');
    },
  });

  const memberships = membershipsData?.content || [];
  const filteredMemberships = memberships.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.memberName?.toLowerCase().includes(q) ||
      m.planName?.toLowerCase().includes(q) ||
      m.memberEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isClient ? 'Mis Membresías' : 'Control de Membresías'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? 'Consulta el estado de tu suscripción actual y fecha de vigencia.'
              : 'Administra inscripciones activas, cambios de paquete, congelamientos y cancelaciones.'}
          </p>
        </div>
        {isAdminOrRecep && (
          <Button onClick={() => setIsSubscribeOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Suscripción</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por socio, plan o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdminOrRecep && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | '')}
                  className="w-full sm:w-44"
                >
                  <option value="">Todos los Estados</option>
                  <option value="ACTIVE">Activas</option>
                  <option value="FROZEN">Congeladas</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="EXPIRED">Expiradas</option>
                  <option value="INACTIVE">Inactivas</option>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Membresías Registradas</CardTitle>
          <CardDescription>
            Total: {membershipsData?.totalElements ?? 0} registros
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : filteredMemberships.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No hay membresías registradas"
              description="No se encontraron suscripciones activas o el filtro seleccionado no arrojó resultados."
              actionText={isAdminOrRecep ? 'Crear Primera Suscripción' : undefined}
              onAction={isAdminOrRecep ? () => setIsSubscribeOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Socio</th>
                    <th className="py-3 px-4">Plan Actual</th>
                    <th className="py-3 px-4">Precio / Tarifa</th>
                    <th className="py-3 px-4">Fecha Inicio</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMemberships.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        #{m.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{m.memberName}</p>
                        <p className="text-xs text-muted-foreground">{m.memberEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <span className="px-2 py-0.5 rounded bg-secondary text-xs">
                          {m.planName} ({m.planDuration}d)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatCurrency(m.planPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {formatDate(m.startDate)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-emerald-400">
                        {formatDate(m.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHistoryMembershipId(m.id)}
                          title="Ver historial y congelamientos"
                        >
                          <History className="h-4 w-4" />
                        </Button>

                        {isAdminOrRecep && m.status === 'ACTIVE' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setChangingPlanMembership(m);
                                changePlanForm.reset({ newPlanId: m.planId, reason: '' });
                              }}
                              title="Cambiar de plan"
                            >
                              <RefreshCw className="h-4 w-4 text-blue-400" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setFreezingMembership(m);
                                freezeForm.reset();
                              }}
                              title="Congelar membresía"
                            >
                              <Snowflake className="h-4 w-4 text-amber-400" />
                            </Button>
                          </>
                        )}

                        {isAdminOrRecep && m.status === 'FROZEN' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUnfreezingMembership(m)}
                            title="Descongelar y reactivar membresía"
                          >
                            <Sun className="h-4 w-4 text-emerald-400" />
                          </Button>
                        )}

                        {isAdmin && m.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => {
                              setCancellingMembership(m);
                              cancelForm.reset();
                            }}
                            title="Cancelar suscripción (Admin)"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {membershipsData && membershipsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {membershipsData.page + 1} de {membershipsData.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= membershipsData.totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: New Subscription */}
      <Modal
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        title="Nueva Suscripción a Membresía"
        description="Inscribe a un socio existente en un plan de entrenamiento."
      >
        <form
          onSubmit={subscribeForm.handleSubmit((d) => subscribeMutation.mutate(d))}
          className="space-y-4 py-2"
        >
          <div>
            <Label required>Socio</Label>
            <Select
              error={subscribeForm.formState.errors.memberId?.message}
              {...subscribeForm.register('memberId')}
            >
              <option value="">Selecciona un socio...</option>
              {membersList?.content?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} (@{m.username})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Plan de Membresía</Label>
            <Select
              error={subscribeForm.formState.errors.planId?.message}
              {...subscribeForm.register('planId')}
            >
              <option value="">Selecciona un plan...</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price)} ({p.duration} días)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Fecha de Inicio</Label>
            <Input type="date" {...subscribeForm.register('startDate')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubscribeOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={subscribeMutation.isPending}>
              Confirmar Suscripción
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Plan */}
      <Modal
        isOpen={!!changingPlanMembership}
        onClose={() => setChangingPlanMembership(null)}
        title="Cambiar Plan de Membresía"
        description={`Socio: ${changingPlanMembership?.memberName}. Selecciona el nuevo paquete a asignar.`}
      >
        <form
          onSubmit={changePlanForm.handleSubmit((d) =>
            changingPlanMembership &&
            changePlanMutation.mutate({ id: changingPlanMembership.id, data: d })
          )}
          className="space-y-4 py-2"
        >
          <div>
            <Label required>Nuevo Plan</Label>
            <Select {...changePlanForm.register('newPlanId')}>
              {plans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price)} ({p.duration} días)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Motivo del Cambio</Label>
            <Input
              placeholder="ej. Ascenso a plan Black VIP por solicitud del socio"
              {...changePlanForm.register('reason')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setChangingPlanMembership(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={changePlanMutation.isPending}>
              Actualizar Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Freeze Membership */}
      <Modal
        isOpen={!!freezingMembership}
        onClose={() => setFreezingMembership(null)}
        title="Congelar Membresía"
        description={`Pausa temporalmente la vigencia de la suscripción para ${freezingMembership?.memberName}.`}
      >
        <form
          onSubmit={freezeForm.handleSubmit((d) =>
            freezingMembership &&
            freezeMutation.mutate({ id: freezingMembership.id, data: d })
          )}
          className="space-y-4 py-2"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Inicio del Congelamiento</Label>
              <Input
                type="date"
                error={freezeForm.formState.errors.startDate?.message}
                {...freezeForm.register('startDate')}
              />
            </div>
            <div>
              <Label required>Fin del Congelamiento</Label>
              <Input
                type="date"
                error={freezeForm.formState.errors.endDate?.message}
                {...freezeForm.register('endDate')}
              />
            </div>
          </div>

          <div>
            <Label>Motivo</Label>
            <Input
              placeholder="ej. Viaje de trabajo o incapacidad médica"
              {...freezeForm.register('reason')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFreezingMembership(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={freezeMutation.isPending}>
              Aplicar Congelamiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Unfreeze Confirmation */}
      <ConfirmDialog
        isOpen={!!unfreezingMembership}
        onClose={() => setUnfreezingMembership(null)}
        onConfirm={() =>
          unfreezingMembership && unfreezeMutation.mutate(unfreezingMembership.id)
        }
        title="Reactivar Membresía"
        message={`¿Deseas descongelar la membresía de "${unfreezingMembership?.memberName}" y reanudar el conteo de vigencia inmediatamente?`}
        confirmText="Reactivar Membresía"
        isDestructive={false}
        isLoading={unfreezeMutation.isPending}
      />

      {/* Modal: Cancel Membership (ADMIN only) */}
      <Modal
        isOpen={!!cancellingMembership}
        onClose={() => setCancellingMembership(null)}
        title="Cancelar Suscripción de Membresía"
        description="Esta acción dará por terminada la membresía del socio."
      >
        <form
          onSubmit={cancelForm.handleSubmit((d) =>
            cancellingMembership &&
            cancelMutation.mutate({ id: cancellingMembership.id, data: d })
          )}
          className="space-y-4 py-2"
        >
          <div>
            <Label required>Motivo de la Cancelación</Label>
            <Textarea
              placeholder="Especifica detalladamente la justificación de la cancelación..."
              error={cancelForm.formState.errors.reason?.message}
              {...cancelForm.register('reason')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancellingMembership(null)}
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={cancelMutation.isPending}
            >
              Confirmar Cancelación
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Membership History & Freezes */}
      <Modal
        isOpen={!!historyMembershipId}
        onClose={() => setHistoryMembershipId(null)}
        title="Historial de Auditoría y Congelamientos"
        description="Eventos de cambio de estado y suspensiones temporales registradas."
        maxWidth="lg"
      >
        <div className="space-y-6 py-2">
          {loadingHistory ? (
            <TableSkeleton rows={3} columns={3} />
          ) : (
            <>
              {/* State Changes History */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Historial de Cambios de Estado
                </h4>
                {!historyList || historyList.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Sin cambios de estado históricos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historyList.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-secondary/50 border border-border text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-muted-foreground">
                              {h.previousStatus}
                            </span>
                            <span>→</span>
                            <StatusBadge status={h.newStatus} />
                          </div>
                          {h.observation && (
                            <p className="text-muted-foreground">{h.observation}</p>
                          )}
                        </div>
                        <span className="text-muted-foreground font-mono">
                          {formatDate(h.changeDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Freezes History */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Periodos de Congelamiento Registrados
                </h4>
                {!freezesList || freezesList.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No cuenta con periodos de congelamiento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {freezesList.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-secondary/50 border border-border text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatDate(f.startDate)} hasta {formatDate(f.endDate)}
                          </p>
                          {f.reason && (
                            <p className="text-muted-foreground mt-0.5">{f.reason}</p>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {formatDate(f.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setHistoryMembershipId(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
