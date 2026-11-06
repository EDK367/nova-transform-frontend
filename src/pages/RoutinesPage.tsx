import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routineService } from '@/services/routine.service';
import { exerciseService } from '@/services/exercise.service';
import { trainerService } from '@/services/trainer.service';
import { trainerAssignmentService } from '@/services/trainer-assignment.service';
import { memberService } from '@/services/member.service';
import {
  AddRoutineExerciseRequest,
  CreateRoutineRequest,
  ExerciseResponse,
  RoutineExerciseResponse,
  RoutineResponse,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/security/permissions';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit2,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Clock,
  User,
  X,
} from 'lucide-react';

const routineSchema = z.object({
  assignmentId: z.coerce.number().optional(),
  name: z.string().min(2, 'Nombre requerido').max(100),
  description: z.string().optional(),
  goal: z.string().optional(),
  difficultyLevel: z.string().optional(),
  trainerId: z.string().optional(),
  memberId: z.string().optional(),
});

type RoutineFormData = z.infer<typeof routineSchema>;

const exerciseItemSchema = z.object({
  exerciseId: z.coerce.number().min(1, 'Selecciona un ejercicio'),
  sets: z.coerce.number().min(1, 'Mínimo 1 serie'),
  repetitions: z.coerce.number().min(1, 'Mínimo 1 repetición'),
  restSeconds: z.coerce.number().min(0, 'Tiempo de descanso válido'),
  notes: z.string().optional(),
});

type ExerciseItemFormData = z.infer<typeof exerciseItemSchema>;

export const RoutinesPage: React.FC = () => {
  const { user, hasRole, checkPolicy } = useAuth();
  const isClient = hasRole('CLIENTE');
  const isAdminOrTrainer = checkPolicy({
    permissions: [PERMISSIONS.ROUTINES_MANAGE],
    roles: ['ADMIN', 'ENTRENADOR'],
  });
  const isAdmin = checkPolicy({
    permissions: [PERMISSIONS.ROUTINES_MANAGE],
    roles: ['ADMIN'],
  });
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineResponse | null>(null);
  const [deletingRoutine, setDeletingRoutine] = useState<RoutineResponse | null>(null);

  const [viewingRoutine, setViewingRoutine] = useState<RoutineResponse | null>(null);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);

  const { data: routinesData, isLoading } = useQuery({
    queryKey: ['routines', page, isClient ? user?.id : 'all'],
    queryFn: () =>
      routineService.getAll({
        page,
        size: 10,
        memberId: isClient ? user?.id : undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      }),
  });

  const { data: trainersData } = useQuery({
    queryKey: ['trainers-select-routines'],
    queryFn: () => trainerService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && isAdminOrTrainer,
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select-routines'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && isAdminOrTrainer,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments-select-routines'],
    queryFn: () => trainerAssignmentService.getAll({ page: 0, size: 100, active: true }),
    enabled: isModalOpen && isAdminOrTrainer,
  });

  const { data: allExercisesData } = useQuery({
    queryKey: ['exercises-select-routines'],
    queryFn: () => exerciseService.getAll({ page: 0, size: 200 }),
    enabled: isAddExerciseOpen,
  });

  const { data: routineExercises, refetch: refetchExercises } = useQuery({
    queryKey: ['routine-exercises', viewingRoutine?.id],
    queryFn: () => (viewingRoutine ? routineService.getExercises(viewingRoutine.id) : []),
    enabled: !!viewingRoutine,
  });

  const form = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: '',
      description: '',
      goal: 'Hipertrofia',
      difficultyLevel: 'Intermedio',
      trainerId: '',
      memberId: '',
    },
  });

  const exerciseItemForm = useForm<ExerciseItemFormData>({
    resolver: zodResolver(exerciseItemSchema),
    defaultValues: {
      exerciseId: 1,
      sets: 4,
      repetitions: 12,
      restSeconds: 60,
      notes: '',
    },
  });

  const openCreateModal = () => {
    setEditingRoutine(null);
    form.reset({
      name: '',
      description: '',
      goal: 'Hipertrofia',
      difficultyLevel: 'Intermedio',
      trainerId: '',
      memberId: '',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: RoutineFormData) => {
      let resolvedAssignmentId = data.assignmentId ? Number(data.assignmentId) : undefined;

      if (!resolvedAssignmentId && !editingRoutine) {
        const existingAssignments = assignmentsData?.content || [];
        const matched = existingAssignments.find(
          (a) =>
            (!data.memberId || a.memberId === data.memberId) &&
            (!data.trainerId || a.trainerId === data.trainerId)
        );
        if (matched) {
          resolvedAssignmentId = matched.id;
        } else if (data.trainerId && data.memberId) {
          const createdAssignment = await trainerAssignmentService.create({
            trainerId: data.trainerId,
            memberId: data.memberId,
            startDate: new Date().toISOString().split('T')[0],
            notes: data.goal || 'Asignación para rutina',
          });
          resolvedAssignmentId = createdAssignment.id;
        } else if (existingAssignments.length > 0) {
          resolvedAssignmentId = existingAssignments[0].id;
        }
      }

      const payload: CreateRoutineRequest = {
        assignmentId: resolvedAssignmentId,
        name: data.name,
        description: data.description || `${data.goal || 'General'} - ${data.difficultyLevel || 'Intermedio'}`,
        goal: data.goal || undefined,
        difficultyLevel: data.difficultyLevel || undefined,
        trainerId: data.trainerId || undefined,
        memberId: data.memberId || undefined,
      };
      if (editingRoutine) {
        return routineService.update(editingRoutine.id, payload);
      }
      return routineService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['assignments-select-routines'] });
      setIsModalOpen(false);
      toast.success(editingRoutine ? 'Rutina actualizada' : 'Rutina creada con éxito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => routineService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setDeletingRoutine(null);
      toast.success('Rutina eliminada');
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (data: ExerciseItemFormData) => {
      if (!viewingRoutine) return;
      const payload: AddRoutineExerciseRequest = {
        exerciseId: data.exerciseId,
        sets: data.sets,
        repetitions: data.repetitions,
        restSeconds: data.restSeconds,
        notes: data.notes || undefined,
      };
      return routineService.addExercise(viewingRoutine.id, payload);
    },
    onSuccess: () => {
      refetchExercises();
      setIsAddExerciseOpen(false);
      exerciseItemForm.reset();
      toast.success('Ejercicio añadido a la rutina');
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (routineExerciseId: number) => routineService.removeExercise(routineExerciseId),
    onSuccess: () => {
      refetchExercises();
      toast.success('Ejercicio retirado de la rutina');
    },
  });

  const routines = routinesData?.content || [];
  const filtered = routines.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.goal && r.goal.toLowerCase().includes(q)) ||
      (r.trainerName && r.trainerName.toLowerCase().includes(q)) ||
      (r.memberName && r.memberName.toLowerCase().includes(q))
    );
  });

  const trainers = trainersData?.content || [];
  const members = membersData?.content || [];
  const allExercises = allExercisesData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Planes de Rutinas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diseño de rutinas estructuradas, series, repeticiones y asignación a clientes.
          </p>
        </div>
        {isAdminOrTrainer && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Rutina</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, objetivo, entrenador o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Rutinas de Entrenamiento</CardTitle>
          <CardDescription>
            Total: {routinesData?.totalElements ?? 0} rutinas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No hay rutinas encontradas"
              description="No se encontraron rutinas registradas con los términos de búsqueda."
              actionText={isAdminOrTrainer ? 'Crear Primera Rutina' : undefined}
              onAction={isAdminOrTrainer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Rutina</th>
                    <th className="py-3 px-4">Objetivo</th>
                    <th className="py-3 px-4">Nivel</th>
                    <th className="py-3 px-4">Entrenador</th>
                    <th className="py-3 px-4">Cliente Asignado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border/60">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <p>{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground max-w-xs line-clamp-1">
                            {r.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-xs">
                          {r.goal || 'General'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="text-xs">
                          {r.difficultyLevel || 'Intermedio'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {r.trainerName || 'Entrenador General'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                        {r.memberName ? (
                          <span className="text-emerald-400">{r.memberName}</span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Plantilla General</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingRoutine(r)}
                          className="text-emerald-400 hover:text-emerald-300"
                          title="Ver ejercicios de la rutina"
                        >
                          <ListOrdered className="h-4 w-4 mr-1" />
                          <span>Ejercicios</span>
                        </Button>
                        {isAdminOrTrainer && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingRoutine(r)}
                            title="Eliminar rutina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {routinesData && routinesData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {routinesData.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= routinesData.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Rutina"
      >
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <Label required>Nombre de la Rutina</Label>
            <Input
              placeholder="ej. Torso-Pierna Hipertrofia, Push-Pull-Legs"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Objetivo Principal</Label>
              <Select {...form.register('goal')}>
                <option value="Hipertrofia">Hipertrofia / Ganancia Muscular</option>
                <option value="Fuerza Máxima">Fuerza Máxima</option>
                <option value="Pérdida de Grasa">Pérdida de Grasa / Definición</option>
                <option value="Resistencia">Resistencia Cardiovascular</option>
                <option value="Salud y Movilidad">Salud y Movilidad</option>
              </Select>
            </div>
            <div>
              <Label>Nivel de Dificultad</Label>
              <Select {...form.register('difficultyLevel')}>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Entrenador a Cargo</Label>
              <Select {...form.register('trainerId')}>
                <option value="">Selecciona entrenador...</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Cliente Asignado</Label>
              <Select {...form.register('memberId')}>
                <option value="">Selecciona cliente...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Descripción y Recomendaciones</Label>
            <Textarea
              placeholder="Calentar 5 minutos antes, respetar tiempos de descanso..."
              {...form.register('description')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Crear Rutina
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!viewingRoutine}
        onClose={() => setViewingRoutine(null)}
        title={`Ejercicios de la Rutina: ${viewingRoutine?.name}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground">
                Objetivo: <strong className="text-foreground">{viewingRoutine?.goal || 'General'}</strong> | Nivel:{' '}
                <strong className="text-foreground">{viewingRoutine?.difficultyLevel || 'Intermedio'}</strong>
              </p>
            </div>
            {isAdminOrTrainer && (
              <Button size="sm" onClick={() => setIsAddExerciseOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                <span>Añadir Ejercicio</span>
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {routineExercises && routineExercises.length > 0 ? (
              routineExercises.map((re, index) => (
                <div
                  key={re.id}
                  className="p-3 bg-secondary/30 rounded-lg border border-border flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">#{index + 1}</span>
                      <h4 className="font-semibold text-sm text-foreground">
                        {re.exerciseName || `Ejercicio #${re.exerciseId}`}
                      </h4>
                      {re.muscleGroup && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          {re.muscleGroup}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Series: <strong className="text-foreground">{re.sets}</strong>
                      </span>
                      <span>
                        Reps: <strong className="text-foreground">{re.repetitions || 10}</strong>
                      </span>
                      <span>
                        Descanso: <strong className="text-foreground">{re.restSeconds || 60}s</strong>
                      </span>
                    </div>
                    {re.notes && <p className="text-xs text-muted-foreground italic">"{re.notes}"</p>}
                  </div>
                  {isAdminOrTrainer && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => removeExerciseMutation.mutate(re.id)}
                      title="Eliminar de rutina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Esta rutina aún no contiene ejercicios asignados.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setViewingRoutine(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        title="Añadir Ejercicio a la Rutina"
      >
        <form
          onSubmit={exerciseItemForm.handleSubmit((d) => addExerciseMutation.mutate(d))}
          className="space-y-4"
        >
          <div>
            <Label required>Ejercicio del Catálogo</Label>
            <Select {...exerciseItemForm.register('exerciseId')}>
              {allExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.muscleGroup} - {ex.equipment || 'Libre'})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label required>Series (Sets)</Label>
              <Input type="number" min="1" {...exerciseItemForm.register('sets')} />
            </div>
            <div>
              <Label required>Repeticiones</Label>
              <Input type="number" min="1" {...exerciseItemForm.register('repetitions')} />
            </div>
            <div>
              <Label required>Descanso (seg)</Label>
              <Input type="number" min="0" step="5" {...exerciseItemForm.register('restSeconds')} />
            </div>
          </div>

          <div>
            <Label>Notas o Indicaciones</Label>
            <Input
              placeholder="RPE 8, tempo 3-0-1, llegar cerca del fallo..."
              {...exerciseItemForm.register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddExerciseOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={addExerciseMutation.isPending}>
              Añadir a la Rutina
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingRoutine}
        onClose={() => setDeletingRoutine(null)}
        onConfirm={() => deletingRoutine && deleteMutation.mutate(deletingRoutine.id)}
        title="Eliminar Rutina"
        message={`¿Estás seguro de que deseas eliminar la rutina "${deletingRoutine?.name}"?`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
