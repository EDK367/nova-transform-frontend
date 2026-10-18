import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipService } from '@/services/membership.service';
import {
  BenefitResponse,
  CreateMembershipPlanRequest,
  MembershipPlanResponse,
  PlanPriceHistoryResponse,
  UpdateMembershipPlanRequest,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  History,
  Layers,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

const planSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  duration: z.coerce.number().min(1, 'La duración mínima es de 1 día'),
  price: z.coerce.number().min(0.01, 'El precio debe ser mayor a 0'),
  description: z.string().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

export const PlansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlanResponse | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<MembershipPlanResponse | null>(null);
  const [historyPlanId, setHistoryPlanId] = useState<number | null>(null);
  const [benefitsPlan, setBenefitsPlan] = useState<MembershipPlanResponse | null>(null);

  // Queries
  const { data: plans, isLoading } = useQuery<MembershipPlanResponse[]>({
    queryKey: ['plans'],
    queryFn: () => membershipService.getPlans(),
  });

  const { data: allBenefits } = useQuery<BenefitResponse[]>({
    queryKey: ['benefits'],
    queryFn: () => membershipService.getBenefits(),
  });

  const { data: priceHistory, isLoading: loadingHistory } = useQuery<PlanPriceHistoryResponse[]>({
    queryKey: ['plan-history', historyPlanId],
    queryFn: () => membershipService.getPriceHistory(historyPlanId!),
    enabled: !!historyPlanId,
  });

  // Create Form
  const createForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      duration: 30,
      price: 599,
      description: '',
    },
  });

  // Edit Form
  const editForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMembershipPlanRequest) => membershipService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Plan de membresía creado exitosamente');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMembershipPlanRequest }) =>
      membershipService.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setEditingPlan(null);
      toast.success('Plan de membresía actualizado');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => membershipService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setDeletingPlan(null);
      toast.success('Plan de membresía eliminado');
    },
  });

  // Add Benefit to Plan Mutation
  const addBenefitMutation = useMutation({
    mutationFn: ({ planId, benefitId }: { planId: number; benefitId: number }) =>
      membershipService.addBenefitToPlan(planId, benefitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Beneficio asignado al plan');
    },
  });

  // Remove Benefit from Plan Mutation
  const removeBenefitMutation = useMutation({
    mutationFn: ({ planId, benefitId }: { planId: number; benefitId: number }) =>
      membershipService.removeBenefitFromPlan(planId, benefitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Beneficio removido del plan');
    },
  });

  const onCreateSubmit = (data: PlanFormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || undefined,
    });
  };

  const onEditSubmit = (data: PlanFormData) => {
    if (!editingPlan) return;
    updateMutation.mutate({
      id: editingPlan.id,
      data: {
        ...data,
        description: data.description || undefined,
      },
    });
  };

  const openEdit = (plan: MembershipPlanResponse) => {
    setEditingPlan(plan);
    editForm.reset({
      name: plan.name,
      duration: plan.duration,
      price: plan.price,
      description: plan.description || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Planes de Membresía
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura los planes de suscripción, tarifas, duración y beneficios asociados.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Crear Plan</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : !plans || plans.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No hay planes de membresía disponibles"
          description="Aún no se han configurado planes en la base de datos."
          actionText={isAdmin ? 'Crear Primer Plan' : undefined}
          onAction={isAdmin ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="flex flex-col justify-between border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
            >
              <div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {plan.duration} días
                      </span>
                      <CardTitle className="text-xl font-extrabold text-foreground mt-2">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">
                        {formatCurrency(plan.price)}
                      </p>
                    </div>
                  </div>
                  {plan.description && (
                    <CardDescription className="mt-2 text-xs">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Benefits List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Beneficios incluidos ({plan.benefits?.length || 0}):
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => setBenefitsPlan(plan)}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Gestionar
                        </button>
                      )}
                    </div>
                    {plan.benefits && plan.benefits.length > 0 ? (
                      <ul className="space-y-1.5">
                        {plan.benefits.map((b) => (
                          <li
                            key={b.id}
                            className="text-xs text-foreground/90 flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{b.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Sin beneficios específicos asignados.
                      </p>
                    )}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <button
                  onClick={() => setHistoryPlanId(plan.id)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  <History className="h-3.5 w-3.5 text-primary" />
                  <span>Historial Precios</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(plan)}
                      title="Editar plan"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => setDeletingPlan(plan)}
                      title="Eliminar plan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Plan */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Plan de Membresía"
        description="Define los parámetros de suscripción y costo del nuevo plan."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre del Plan</Label>
            <Input
              placeholder="ej. Plan Anual Black VIP"
              error={createForm.formState.errors.name?.message}
              {...createForm.register('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Duración (días)</Label>
              <Input
                type="number"
                min="1"
                placeholder="30"
                error={createForm.formState.errors.duration?.message}
                {...createForm.register('duration')}
              />
            </div>
            <div>
              <Label required>Precio ($ MXN)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="599.00"
                error={createForm.formState.errors.price?.message}
                {...createForm.register('price')}
              />
            </div>
          </div>

          <div>
            <Label>Descripción del Plan</Label>
            <Textarea
              placeholder="Detalla qué incluye este paquete y a qué áreas del gimnasio da acceso..."
              {...createForm.register('description')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Guardar Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Plan */}
      <Modal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title="Modificar Plan de Membresía"
        description="Actualiza la información comercial del plan."
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre del Plan</Label>
            <Input
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Duración (días)</Label>
              <Input
                type="number"
                min="1"
                error={editForm.formState.errors.duration?.message}
                {...editForm.register('duration')}
              />
            </div>
            <div>
              <Label required>Precio ($ MXN)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                error={editForm.formState.errors.price?.message}
                {...editForm.register('price')}
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...editForm.register('description')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPlan(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Manage Benefits attached to Plan */}
      <Modal
        isOpen={!!benefitsPlan}
        onClose={() => setBenefitsPlan(null)}
        title={`Beneficios del Plan: ${benefitsPlan?.name}`}
        description="Vincula o desvincula beneficios exclusivos a este plan de membresía."
        maxWidth="lg"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Beneficios Activos en este Plan
            </h4>
            {benefitsPlan?.benefits && benefitsPlan.benefits.length > 0 ? (
              <div className="space-y-2">
                {benefitsPlan.benefits.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      {b.description && (
                        <p className="text-xs text-muted-foreground">{b.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-500"
                      onClick={() =>
                        removeBenefitMutation.mutate({
                          planId: benefitsPlan.id,
                          benefitId: b.id,
                        })
                      }
                      isLoading={removeBenefitMutation.isPending}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Ningún beneficio vinculado actualmente.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Agregar Beneficio Disponible
            </h4>
            <div className="flex flex-wrap gap-2">
              {allBenefits
                ?.filter(
                  (ab) => !benefitsPlan?.benefits?.some((pb) => pb.id === ab.id)
                )
                .map((availableBenefit) => (
                  <Button
                    key={availableBenefit.id}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      addBenefitMutation.mutate({
                        planId: benefitsPlan!.id,
                        benefitId: availableBenefit.id,
                      })
                    }
                    isLoading={addBenefitMutation.isPending}
                  >
                    <Plus className="h-3 w-3" />
                    <span>{availableBenefit.name}</span>
                  </Button>
                ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setBenefitsPlan(null)}>
              Finalizar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Price History */}
      <Modal
        isOpen={!!historyPlanId}
        onClose={() => setHistoryPlanId(null)}
        title="Historial de Precios del Plan"
        description="Registro histórico de ajustes tarifarios para este plan."
        maxWidth="md"
      >
        <div className="py-2">
          {loadingHistory ? (
            <TableSkeleton rows={3} columns={3} />
          ) : !priceHistory || priceHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay historial de cambios de tarifa registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {priceHistory.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Desde: {formatDate(h.startDate)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {h.endDate ? `Hasta: ${formatDate(h.endDate)}` : 'Tarifa Vigente'}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-foreground">
                    {formatCurrency(h.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={() => deletingPlan && deleteMutation.mutate(deletingPlan.id)}
        title="Eliminar Plan de Membresía"
        message={`¿Estás seguro de que deseas eliminar permanentemente el plan "${deletingPlan?.name}"?`}
        confirmText="Eliminar Plan"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
