import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '@/services/goal.service';
import { memberService } from '@/services/member.service';
import {
  AssignMemberGoalRequest,
  CreateGoalRequest,
  GoalResponse,
  MemberGoalResponse,
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
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Target,
  Plus,
  Search,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

const createGoalSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoría requerida'),
});

type CreateGoalFormData = z.infer<typeof createGoalSchema>;

const assignGoalSchema = z.object({
  memberId: z.string().min(1, 'Selecciona un socio'),
  goalId: z.coerce.number().min(1, 'Selecciona un objetivo'),
  targetDate: z.string().min(1, 'Fecha meta requerida'),
  targetValue: z.coerce.number().min(0.1, 'Valor meta requerido'),
  currentValue: z.coerce.number().min(0, 'Valor actual requerido'),
  notes: z.string().optional(),
});

type AssignGoalFormData = z.infer<typeof assignGoalSchema>;

export const GoalsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrTrainer = hasRole('ADMIN', 'ENTRENADOR');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'assigned' | 'catalog'>('assigned');
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [deletingMemberGoal, setDeletingMemberGoal] = useState<MemberGoalResponse | null>(null);

  const { data: memberGoalsData, isLoading: loadingMemberGoals } = useQuery({
    queryKey: ['member-goals', page],
    queryFn: () =>
      goalService.getMemberGoals({
        page,
        size: 10,
        memberId: isClient ? user?.id : undefined,
        sortBy: 'targetDate',
        sortDirection: 'asc',
      }),
  });

  const { data: catalogGoalsData, isLoading: loadingCatalog } = useQuery({
    queryKey: ['goals-catalog'],
    queryFn: () => goalService.getAllGoals({ page: 0, size: 50 }),
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select-goals'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isAssignModalOpen && !isClient,
  });

  const catalogForm = useForm<CreateGoalFormData>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Pérdida de Peso',
    },
  });

  const assignForm = useForm<AssignGoalFormData>({
    resolver: zodResolver(assignGoalSchema),
    defaultValues: {
      memberId: isClient ? user?.id || '' : '',
      goalId: 1,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetValue: 70,
      currentValue: 80,
      notes: '',
    },
  });

  const createCatalogMutation = useMutation({
    mutationFn: (data: CreateGoalFormData) => goalService.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-catalog'] });
      setIsCatalogModalOpen(false);
      catalogForm.reset();
      toast.success('Objetivo añadido al catálogo');
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: AssignGoalFormData) => {
      const payload: AssignMemberGoalRequest = {
        memberId: data.memberId,
        goalId: data.goalId,
        targetDate: data.targetDate,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        notes: data.notes || undefined,
        status: 'EN_PROGRESO',
      };
      return goalService.assignMemberGoal(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-goals'] });
      setIsAssignModalOpen(false);
      assignForm.reset();
      toast.success('Objetivo asignado al socio');
    },
  });

  const deleteMemberGoalMutation = useMutation({
    mutationFn: (id: number) => goalService.deleteMemberGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-goals'] });
      setDeletingMemberGoal(null);
      toast.success('Objetivo retirado');
    },
  });

  const memberGoals = memberGoalsData?.content || [];
  const catalogGoals = catalogGoalsData?.content || [];
  const members = membersData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Metas y Objetivos Físicos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Definición y seguimiento de metas corporales, fuerza y marcas personales.
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
              <span>Nuevo Tipo de Meta</span>
            </Button>
          )}
          <Button onClick={() => setIsAssignModalOpen(true)} className="gap-2">
            <Target className="h-4 w-4" />
            <span>Fijar Objetivo</span>
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'assigned'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Objetivos de Socios
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-emerald-500 text-emerald-400'
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
              Progreso individual respecto al valor meta propuesto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingMemberGoals ? (
              <TableSkeleton rows={5} columns={6} />
            ) : memberGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No hay objetivos fijados"
                description="Aún no se han configurado metas físicas para este periodo."
                actionText="Fijar Nuevo Objetivo"
                onAction={() => setIsAssignModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">Socio</th>
                      <th className="py-3 px-4">Objetivo</th>
                      <th className="py-3 px-4">Valor Actual</th>
                      <th className="py-3 px-4">Valor Meta</th>
                      <th className="py-3 px-4">Fecha Meta</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border/60">
                    {memberGoals.map((mg) => (
                      <tr key={mg.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {mg.memberName || 'Socio'}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{mg.goalName || 'Meta'}</p>
                          {mg.notes && (
                            <p className="text-xs text-muted-foreground italic truncate max-w-xs">
                              "{mg.notes}"
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                          {mg.currentValue != null ? mg.currentValue : '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {mg.targetValue != null ? mg.targetValue : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(mg.targetDate)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={mg.status === 'COMPLETADO' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {mg.status || 'EN_PROGRESO'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingMemberGoal(mg)}
                            title="Eliminar meta"
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
            <CardTitle>Catálogo de Tipos de Objetivos</CardTitle>
            <CardDescription>
              Categorías predefinidas para asignación rápida
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingCatalog ? (
              <TableSkeleton rows={4} columns={4} />
            ) : catalogGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Catálogo vacío"
                description="No hay tipos de objetivos predefinidos."
                actionText="Crear Tipo de Objetivo"
                onAction={() => setIsCatalogModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Nombre del Objetivo</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border/60">
                    {catalogGoals.map((cg) => (
                      <tr key={cg.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">#{cg.id}</td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">{cg.name}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-xs">
                            {cg.category || 'General'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {cg.description || 'Sin descripción'}
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
        title="Crear Tipo de Objetivo en Catálogo"
      >
        <form onSubmit={catalogForm.handleSubmit((d) => createCatalogMutation.mutate(d))} className="space-y-4">
          <div>
            <Label required>Nombre del Objetivo</Label>
            <Input
              placeholder="ej. Reducción % Grasa Corporal, 1RM Sentadilla"
              error={catalogForm.formState.errors.name?.message}
              {...catalogForm.register('name')}
            />
          </div>

          <div>
            <Label required>Categoría</Label>
            <Select {...catalogForm.register('category')}>
              <option value="Composición Corporal">Composición Corporal</option>
              <option value="Fuerza">Fuerza y Rendimiento</option>
              <option value="Resistencia">Resistencia Cardiovascular</option>
              <option value="Salud">Salud General</option>
            </Select>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Criterios de medición y lineamientos de éxito..."
              {...catalogForm.register('description')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsCatalogModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createCatalogMutation.isPending}>
              Guardar Tipo
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Fijar Meta de Entrenamiento para Socio"
      >
        <form onSubmit={assignForm.handleSubmit((d) => assignMutation.mutate(d))} className="space-y-4">
          {!isClient && (
            <div>
              <Label required>Socio</Label>
              <Select {...assignForm.register('memberId')}>
                <option value="">Selecciona socio...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} (@{m.username})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label required>Objetivo</Label>
            <Select {...assignForm.register('goalId')}>
              {catalogGoals.map((cg) => (
                <option key={cg.id} value={cg.id}>
                  {cg.name} ({cg.category})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Valor Actual</Label>
              <Input type="number" step="0.1" {...assignForm.register('currentValue')} />
            </div>
            <div>
              <Label required>Valor Meta a Alcanzar</Label>
              <Input type="number" step="0.1" {...assignForm.register('targetValue')} />
            </div>
          </div>

          <div>
            <Label required>Fecha Límite Estimada</Label>
            <Input type="date" {...assignForm.register('targetDate')} />
          </div>

          <div>
            <Label>Notas o Plan de Acción</Label>
            <Input
              placeholder="Déficit calórico de 300 kcal, 4 sesiones de pesas semanales..."
              {...assignForm.register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={assignMutation.isPending}>
              Establecer Meta
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingMemberGoal}
        onClose={() => setDeletingMemberGoal(null)}
        onConfirm={() => deletingMemberGoal && deleteMemberGoalMutation.mutate(deletingMemberGoal.id)}
        title="Eliminar Meta"
        message="¿Estás seguro de que deseas eliminar este objetivo asignado?"
        confirmText="Eliminar"
        isLoading={deleteMemberGoalMutation.isPending}
      />
    </div>
  );
};
