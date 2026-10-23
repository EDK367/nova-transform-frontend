import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Target, Plus, Trash2 } from 'lucide-react';

import { goalService } from '@/services/goal.service';
import { memberService } from '@/services/member.service';
import type { AssignMemberGoalRequest, MemberGoalResponse } from '@/types';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const createGoalSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  description: z.string().optional(),
});

type CreateGoalFormData = z.infer<typeof createGoalSchema>;

const assignGoalSchema = z.object({
  memberId: z.string().min(1, 'Selecciona un socio'),
  goalId: z.coerce.number().min(1, 'Selecciona un objetivo'),
});

type AssignGoalFormData = z.infer<typeof assignGoalSchema>;

export const GoalsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrTrainer = hasRole('ADMIN', 'ENTRENADOR');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'assigned' | 'catalog'>('assigned');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [deletingMemberGoal, setDeletingMemberGoal] =
    useState<MemberGoalResponse | null>(null);

  const {
    data: memberGoalsData,
    isLoading: loadingMemberGoals,
    isError: memberGoalsError,
  } = useQuery({
    queryKey: ['member-goals', isClient ? user?.id : 'all'],
    queryFn: () =>
      goalService.getMemberGoals({
        page: 0,
        size: 100,
        memberId: isClient ? user?.id : undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      }),
  });

  const {
    data: catalogGoalsData,
    isLoading: loadingCatalog,
    isError: catalogError,
  } = useQuery({
    queryKey: ['goals-catalog'],
    queryFn: () =>
      goalService.getAllGoals({
        page: 0,
        size: 100,
      }),
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select-goals'],
    queryFn: () =>
      memberService.getAll({
        page: 0,
        size: 100,
      }),
    enabled: isAssignModalOpen && !isClient,
  });

  const catalogForm = useForm<CreateGoalFormData>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const assignForm = useForm<AssignGoalFormData>({
    resolver: zodResolver(assignGoalSchema),
    defaultValues: {
      memberId: isClient ? user?.id || '' : '',
      goalId: 0,
    },
  });

  const createCatalogMutation = useMutation({
    mutationFn: (data: CreateGoalFormData) =>
      goalService.createGoal({
        name: data.name,
        description: data.description || undefined,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['goals-catalog'],
      });

      setIsCatalogModalOpen(false);
      catalogForm.reset();

      toast.success('Objetivo añadido al catálogo');
    },

    onError: () => {
      toast.error('No se pudo crear el objetivo');
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: AssignGoalFormData) => {
      const payload: AssignMemberGoalRequest = {
        memberId: isClient ? user?.id || data.memberId : data.memberId,
        goalId: data.goalId,
      };

      return goalService.assignMemberGoal(payload);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['member-goals'],
      });

      setIsAssignModalOpen(false);
      assignForm.reset();

      toast.success('Objetivo asignado al socio');
    },

    onError: () => {
      toast.error('No se pudo asignar el objetivo');
    },
  });

  const deleteMemberGoalMutation = useMutation({
    mutationFn: (id: number) =>
      goalService.deleteMemberGoal(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['member-goals'],
      });

      setDeletingMemberGoal(null);

      toast.success('Objetivo retirado');
    },

    onError: () => {
      toast.error('No se pudo eliminar el objetivo');
    },
  });

  const memberGoals = memberGoalsData?.content ?? [];
  const catalogGoals = catalogGoalsData?.content ?? [];
  const members = membersData?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Metas y Objetivos Físicos
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de objetivos y asignación de metas a los socios.
          </p>
        </div>

        <div className="flex gap-2">
          {isAdminOrTrainer && (
            <Button
              variant="outline"
              onClick={() => setIsCatalogModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Tipo de Meta
            </Button>
          )}

          <Button
            onClick={() => setIsAssignModalOpen(true)}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Fijar Objetivo
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'assigned'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Objetivos de Socios
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Catálogo de Metas
        </button>
      </div>

      {activeTab === 'assigned' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Metas Establecidas</CardTitle>

            <CardDescription>
              Objetivos asignados a los socios del gimnasio.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loadingMemberGoals ? (
              <TableSkeleton rows={5} columns={3} />
            ) : memberGoalsError ? (
              <p className="p-6 text-sm text-red-500">
                No se pudieron cargar los objetivos.
                Revisa la conexión con el backend.
              </p>
            ) : memberGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No hay objetivos fijados"
                description="Todavía no hay objetivos asignados a los socios."
                actionText="Fijar Nuevo Objetivo"
                onAction={() => setIsAssignModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">
                        Socio
                      </th>

                      <th className="py-3 px-4">
                        Objetivo
                      </th>

                      <th className="py-3 px-4 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {memberGoals.map((mg) => (
                      <tr
                        key={mg.id}
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {mg.memberName || 'Socio'}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {mg.goalName || 'Objetivo'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() =>
                              setDeletingMemberGoal(mg)
                            }
                            title="Eliminar asignación"
                          >
                            <Trash2 className="h-4 w-4" />
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
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              Catálogo de Tipos de Objetivos
            </CardTitle>

            <CardDescription>
              Objetivos disponibles para asignar a los socios.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loadingCatalog ? (
              <TableSkeleton rows={4} columns={3} />
            ) : catalogError ? (
              <p className="p-6 text-sm text-red-500">
                No se pudo cargar el catálogo de objetivos.
              </p>
            ) : catalogGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Catálogo vacío"
                description="No hay tipos de objetivos registrados."
                actionText="Crear Tipo de Objetivo"
                onAction={() =>
                  setIsCatalogModalOpen(true)
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">
                        ID
                      </th>

                      <th className="py-3 px-4">
                        Nombre del Objetivo
                      </th>

                      <th className="py-3 px-4">
                        Descripción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {catalogGoals.map((goal) => (
                      <tr
                        key={goal.id}
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-foreground">
                          #{goal.id}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {goal.name}
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          {goal.description || 'Sin descripción'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Crear Tipo de Objetivo"
      >
        <form
          onSubmit={catalogForm.handleSubmit((data) =>
            createCatalogMutation.mutate(data)
          )}
          className="space-y-4"
        >
          <div>
            <Label required>
              Nombre del Objetivo
            </Label>

            <Input
              placeholder="Ej. Aumentar masa muscular"
              error={
                catalogForm.formState.errors.name?.message
              }
              {...catalogForm.register('name')}
            />
          </div>

          <div>
            <Label>Descripción</Label>

            <Textarea
              placeholder="Descripción del objetivo"
              {...catalogForm.register('description')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsCatalogModalOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              isLoading={createCatalogMutation.isPending}
            >
              Guardar Tipo
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Asignar Objetivo a Socio"
      >
        <form
          onSubmit={assignForm.handleSubmit((data) =>
            assignMutation.mutate(data)
          )}
          className="space-y-4"
        >
          {!isClient && (
            <div>
              <Label required>Socio</Label>

              <Select {...assignForm.register('memberId')}>
                <option value="">
                  Selecciona un socio...
                </option>

                {members.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.firstName} {member.lastName}
                    {' '}(@{member.username})
                  </option>
                ))}
              </Select>

              {assignForm.formState.errors.memberId && (
                <p className="text-xs text-red-500 mt-1">
                  {
                    assignForm.formState.errors.memberId
                      .message
                  }
                </p>
              )}
            </div>
          )}

          <div>
            <Label required>Objetivo</Label>

            <Select {...assignForm.register('goalId')}>
              <option value="0">
                Selecciona un objetivo...
              </option>

              {catalogGoals.map((goal) => (
                <option
                  key={goal.id}
                  value={goal.id}
                >
                  {goal.name}
                </option>
              ))}
            </Select>

            {assignForm.formState.errors.goalId && (
              <p className="text-xs text-red-500 mt-1">
                {
                  assignForm.formState.errors.goalId
                    .message
                }
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsAssignModalOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              isLoading={assignMutation.isPending}
            >
              Asignar Objetivo
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingMemberGoal}
        onClose={() =>
          setDeletingMemberGoal(null)
        }
        onConfirm={() => {
          if (deletingMemberGoal) {
            deleteMemberGoalMutation.mutate(
              deletingMemberGoal.id
            );
          }
        }}
        title="Eliminar Objetivo Asignado"
        message="¿Seguro que deseas quitar este objetivo del socio?"
        confirmText="Eliminar"
        isLoading={
          deleteMemberGoalMutation.isPending
        }
      />
    </div>
  );
};
