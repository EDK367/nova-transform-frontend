import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutLogService } from '@/services/workout-log.service';
import { routineService } from '@/services/routine.service';
import { memberService } from '@/services/member.service';
import {
  CreateWorkoutLogRequest,
  ExerciseResponse,
  WorkoutLogResponse,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/security/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
  Activity,
  Plus,
  Search,
  Trash2,
  Calendar,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';

const workoutLogSchema = z.object({
  memberId: z.string().min(1, 'Selecciona cliente'),
  exerciseId: z.coerce.number().min(1, 'Selecciona un ejercicio de rutina'),
  logDate: z.string().min(1, 'Fecha requerida'),
  setsCompleted: z.coerce.number().min(1, 'Series mínimas: 1'),
  repsCompleted: z.coerce.number().min(1, 'Repeticiones mínimas: 1'),
  weightUsed: z.coerce.number().min(0).optional(),
  perceivedEffort: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

type WorkoutLogFormData = z.infer<typeof workoutLogSchema>;

export const WorkoutLogsPage: React.FC = () => {
  const { user, hasRole, checkPolicy } = useAuth();
  const isAdminOrTrainer = checkPolicy({
    permissions: [PERMISSIONS.WORKOUT_LOGS_MANAGE],
    roles: ['ADMIN', 'ENTRENADOR'],
  });
  const canCreateLog = checkPolicy({
    permissions: [PERMISSIONS.WORKOUT_LOGS_MANAGE],
    roles: ['ADMIN', 'ENTRENADOR', 'CLIENTE'],
  });
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingLog, setDeletingLog] = useState<WorkoutLogResponse | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['workout-logs', page, isClient ? user?.id : 'all'],
    queryFn: () =>
      workoutLogService.getAll({
        page,
        size: 10,
        memberId: isClient ? user?.id : undefined,
        sortBy: 'logDate',
        sortDirection: 'desc',
      }),
  });

  const { data: routineExercisesData } = useQuery({
    queryKey: ['routine-exercises-select-logs'],
    queryFn: () => routineService.getExercises(),
    enabled: isModalOpen,
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select-logs'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && !isClient,
  });

  const form = useForm<WorkoutLogFormData>({
    resolver: zodResolver(workoutLogSchema),
    defaultValues: {
      memberId: user?.id || '',
      exerciseId: 1,
      logDate: new Date().toISOString().split('T')[0],
      setsCompleted: 4,
      repsCompleted: 10,
      weightUsed: 20,
      perceivedEffort: 8,
      notes: '',
    },
  });

  const openCreateModal = () => {
    form.reset({
      memberId: isClient ? user?.id || '' : '',
      exerciseId: 1,
      logDate: new Date().toISOString().split('T')[0],
      setsCompleted: 4,
      repsCompleted: 10,
      weightUsed: 20,
      perceivedEffort: 8,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: WorkoutLogFormData) => {
      const payload: CreateWorkoutLogRequest = {
        memberId: data.memberId,
        routineExerciseId: data.exerciseId,
        exerciseId: data.exerciseId,
        logDate: data.logDate,
        setsCompleted: data.setsCompleted,
        repsCompleted: data.repsCompleted,
        weightUsed: data.weightUsed || undefined,
        perceivedEffort: data.perceivedEffort || undefined,
        notes: data.notes || undefined,
      };
      return workoutLogService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      setIsModalOpen(false);
      toast.success('Entrenamiento registrado exitosamente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workoutLogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      setDeletingLog(null);
      toast.success('Registro de entrenamiento eliminado');
    },
  });

  const logs = logsData?.content || [];
  const filtered = logs.filter((l) => {
    const q = searchTerm.toLowerCase();
    return (
      (l.exerciseName && l.exerciseName.toLowerCase().includes(q)) ||
      (l.memberName && l.memberName.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  });

  const routineExercises = routineExercisesData || [];
  const members = membersData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isClient ? 'Mi Bitácora de Entrenamientos' : 'Bitácora de Entrenamientos'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? 'Tu registro personal de series, repeticiones, peso levantado y esfuerzo percibido (RPE).'
              : 'Registro y control de levantamientos, repeticiones, peso y esfuerzo percibido (RPE) de los clientes.'}
          </p>
        </div>
        {canCreateLog && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Registrar Entrenamiento</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ejercicio, cliente o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Historial de Entrenamientos</CardTitle>
          <CardDescription>
            Total: {logsData?.totalElements ?? 0} registros completados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No hay registros de entrenamiento"
              description="Aún no se han asentado series o ejercicios en la bitácora."
              actionText="Registrar Primera Serie"
              onAction={openCreateModal}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Ejercicio</th>
                    <th className="py-3 px-4">Series & Reps</th>
                    <th className="py-3 px-4">Carga / Peso</th>
                    <th className="py-3 px-4">Esfuerzo (RPE)</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border/60">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(l.logDate)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {l.memberName || 'Cliente'}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground text-sm">
                          {l.exerciseName || `Ejercicio #${l.exerciseId}`}
                        </p>
                        {l.notes && (
                          <p className="text-xs text-muted-foreground italic truncate max-w-xs">
                            "{l.notes}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-foreground">
                        {l.setsCompleted} series × {l.repsCompleted} reps
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {l.weightUsed != null ? `${l.weightUsed} kg` : 'Peso Corporal'}
                      </td>
                      <td className="py-3.5 px-4">
                        {l.perceivedEffort != null ? (
                          <Badge
                            variant={l.perceivedEffort >= 8 ? 'destructive' : 'secondary'}
                            className="text-xs gap-1"
                          >
                            <Flame className="h-3 w-3" />
                            <span>RPE {l.perceivedEffort}/10</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdminOrTrainer && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingLog(l)}
                            title="Eliminar registro"
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

          {logsData && logsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {logsData.totalPages}
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
                  disabled={page >= logsData.totalPages - 1}
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
        title="Registrar Sesión de Ejercicio"
      >
        <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {!isClient && (
            <div>
              <Label required>Cliente</Label>
              <Select {...form.register('memberId')}>
                <option value="">Selecciona cliente...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} (@{m.username})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label required>Ejercicio de Rutina</Label>
            <Select {...form.register('exerciseId')}>
              <option value="">Selecciona ejercicio de rutina...</option>
              {routineExercises.map((re) => (
                <option key={re.id} value={re.id}>
                  {re.exerciseName} — {re.routineName || `Rutina #${re.routineId}`} ({re.sets}×{re.repetitions || 10})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fecha</Label>
              <Input type="date" {...form.register('logDate')} />
            </div>
            <div>
              <Label>Carga / Peso Levantado (kg)</Label>
              <Input type="number" step="0.5" min="0" {...form.register('weightUsed')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Series Completadas</Label>
              <Input type="number" min="1" {...form.register('setsCompleted')} />
            </div>
            <div>
              <Label required>Repeticiones por Serie</Label>
              <Input type="number" min="1" {...form.register('repsCompleted')} />
            </div>
          </div>

          <div>
            <Label>Nivel de Esfuerzo Percibido (RPE 1-10)</Label>
            <Select {...form.register('perceivedEffort')}>
              <option value="6">RPE 6 - Muy liviano, varias repeticiones en recámara</option>
              <option value="7">RPE 7 - Carga moderada, 3 reps en recámara</option>
              <option value="8">RPE 8 - Carga desafiante, 2 reps en recámara</option>
              <option value="9">RPE 9 - Carga muy dura, 1 rep en recámara</option>
              <option value="10">RPE 10 - Esfuerzo máximo / Fallo concéntrico</option>
            </Select>
          </div>

          <div>
            <Label>Notas y Sensaciones</Label>
            <Input
              placeholder="Sensación de fatiga, molestia articular o progreso en peso..."
              {...form.register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Guardar Entrenamiento
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingLog}
        onClose={() => setDeletingLog(null)}
        onConfirm={() => deletingLog && deleteMutation.mutate(deletingLog.id)}
        title="Eliminar Registro"
        message="¿Estás seguro de que deseas eliminar este registro de entrenamiento?"
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
