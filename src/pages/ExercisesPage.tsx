import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciseService } from '@/services/exercise.service';
import { CreateExerciseRequest, ExerciseResponse, UpdateExerciseRequest } from '@/types';
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
  Dumbbell,
  Plus,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const exerciseSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, 'Grupo muscular requerido'),
  equipment: z.string().optional(),
  difficulty: z.string().optional(),
  videoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core / Abdomen',
  'Cardiovascular',
  'Full Body',
];

export const ExercisesPage: React.FC = () => {
  const { checkPolicy } = useAuth();
  const isAdminOrTrainer = checkPolicy({
    permissions: [PERMISSIONS.EXERCISES_MANAGE],
    roles: ['ADMIN', 'ENTRENADOR'],
  });
  const isAdmin = checkPolicy({
    permissions: [PERMISSIONS.EXERCISES_MANAGE],
    roles: ['ADMIN'],
  });
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseResponse | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<ExerciseResponse | null>(null);

  const { data: exercisesData, isLoading } = useQuery({
    queryKey: ['exercises', page, groupFilter],
    queryFn: () =>
      exerciseService.getAll({
        page,
        size: 10,
        muscleGroup: groupFilter || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      }),
  });

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: '',
      description: '',
      muscleGroup: 'Pecho',
      equipment: 'Mancuernas',
      difficulty: 'Intermedio',
      videoUrl: '',
      active: true,
    },
  });

  const openCreateModal = () => {
    setEditingExercise(null);
    form.reset({
      name: '',
      description: '',
      muscleGroup: 'Pecho',
      equipment: 'Mancuernas',
      difficulty: 'Intermedio',
      videoUrl: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ex: ExerciseResponse) => {
    setEditingExercise(ex);
    form.reset({
      name: ex.name,
      description: ex.description || '',
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment || 'Mancuernas',
      difficulty: ex.difficulty || 'Intermedio',
      videoUrl: ex.videoUrl || '',
      active: ex.active,
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        muscleGroup: data.muscleGroup,
        equipment: data.equipment || undefined,
        difficulty: data.difficulty || undefined,
        videoUrl: data.videoUrl || undefined,
        active: data.active,
      };
      if (editingExercise) {
        return exerciseService.update(editingExercise.id, payload as UpdateExerciseRequest);
      }
      return exerciseService.create(payload as CreateExerciseRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setIsModalOpen(false);
      toast.success(editingExercise ? 'Ejercicio actualizado' : 'Ejercicio registrado con éxito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => exerciseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setDeletingExercise(null);
      toast.success('Ejercicio eliminado');
    },
  });

  const exercises = exercisesData?.content || [];
  const filtered = exercises.filter((ex) => {
    const q = searchTerm.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      (ex.description && ex.description.toLowerCase().includes(q)) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Banco de Ejercicios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de movimientos, grupos musculares, equipo necesario y videos guía.
          </p>
        </div>
        {isAdminOrTrainer && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Ejercicio</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, equipo o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="">Todos los grupos musculares</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Ejercicios Registrados</CardTitle>
          <CardDescription>
            Total: {exercisesData?.totalElements ?? 0} ejercicios en catálogo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No hay ejercicios encontrados"
              description="No hay movimientos registrados que coincidan con los filtros."
              actionText={isAdminOrTrainer ? 'Crear Primer Ejercicio' : undefined}
              onAction={isAdminOrTrainer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Ejercicio</th>
                    <th className="py-3 px-4">Grupo Muscular</th>
                    <th className="py-3 px-4">Equipamiento</th>
                    <th className="py-3 px-4">Dificultad</th>
                    <th className="py-3 px-4">Tutorial</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdminOrTrainer && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((ex) => (
                    <tr key={ex.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{ex.name}</p>
                        {ex.description && (
                          <p className="text-xs text-muted-foreground max-w-xs line-clamp-1">
                            {ex.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-medium text-xs">
                          {ex.muscleGroup}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {ex.equipment || 'Peso Corporal'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="text-xs">
                          {ex.difficulty || 'Intermedio'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {ex.videoUrl ? (
                          <a
                            href={ex.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            <span>Ver Video</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={ex.active ? 'default' : 'destructive'}>
                          {ex.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {isAdminOrTrainer && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(ex)}
                            title="Editar ejercicio"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => setDeletingExercise(ex)}
                              title="Eliminar ejercicio"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exercisesData && exercisesData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {exercisesData.totalPages}
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
                  disabled={page >= exercisesData.totalPages - 1}
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
        title={editingExercise ? 'Editar Ejercicio' : 'Registrar Nuevo Ejercicio'}
      >
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <Label required>Nombre del Ejercicio</Label>
            <Input
              placeholder="ej. Press de Banca Plano, Sentadilla Libre"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Grupo Muscular</Label>
              <Select {...form.register('muscleGroup')}>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Equipamiento</Label>
              <Select {...form.register('equipment')}>
                <option value="Mancuernas">Mancuernas</option>
                <option value="Barra Olímpica">Barra Olímpica</option>
                <option value="Máquina / Prensa">Máquina / Prensa</option>
                <option value="Poleas / Cables">Poleas / Cables</option>
                <option value="Peso Corporal">Peso Corporal / Calistenia</option>
                <option value="Bandas Elásticas">Bandas Elásticas</option>
                <option value="Kettlebell">Kettlebell</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nivel de Dificultad</Label>
              <Select {...form.register('difficulty')}>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </Select>
            </div>
            <div>
              <Label>URL de Video Guía</Label>
              <Input
                placeholder="https://youtube.com/..."
                error={form.formState.errors.videoUrl?.message}
                {...form.register('videoUrl')}
              />
            </div>
          </div>

          <div>
            <Label>Descripción e Instrucciones de Ejecución</Label>
            <Textarea
              placeholder="Retracción escapular, pies firmes en el suelo, descenso controlado..."
              {...form.register('description')}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeExercise"
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              {...form.register('active')}
            />
            <Label htmlFor="activeExercise" className="cursor-pointer">
              Ejercicio activo en catálogo
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editingExercise ? 'Guardar Cambios' : 'Registrar Ejercicio'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingExercise}
        onClose={() => setDeletingExercise(null)}
        onConfirm={() => deletingExercise && deleteMutation.mutate(deletingExercise.id)}
        title="Eliminar Ejercicio"
        message={`¿Estás seguro de que deseas eliminar el ejercicio "${deletingExercise?.name}"?`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
