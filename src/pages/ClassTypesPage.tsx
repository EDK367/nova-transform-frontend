import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classService } from '@/services/class.service';
import { ClassTypeResponse, CreateClassTypeRequest, UpdateClassTypeRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/security/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Tag, Plus, Edit2, Trash2, Dumbbell } from 'lucide-react';

const classTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().optional(),
});

type ClassTypeFormData = z.infer<typeof classTypeSchema>;

export const ClassTypesPage: React.FC = () => {
  const { checkPolicy } = useAuth();
  const isAdmin = checkPolicy({ permissions: [PERMISSIONS.CLASS_TYPES_MANAGE], roles: ['ADMIN'] });
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<ClassTypeResponse | null>(null);
  const [deletingType, setDeletingType] = useState<ClassTypeResponse | null>(null);

  const { data: classTypes, isLoading } = useQuery<ClassTypeResponse[]>({
    queryKey: ['class-types'],
    queryFn: () => classService.getTypes(),
  });

  const createForm = useForm<ClassTypeFormData>({
    resolver: zodResolver(classTypeSchema),
    defaultValues: { name: '', description: '' },
  });

  const editForm = useForm<ClassTypeFormData>({
    resolver: zodResolver(classTypeSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClassTypeRequest) => classService.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Tipo de clase creado exitosamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClassTypeRequest }) =>
      classService.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      setEditingType(null);
      toast.success('Tipo de clase actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => classService.deleteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      setDeletingType(null);
      toast.success('Tipo de clase eliminado');
    },
  });

  const onCreateSubmit = (data: ClassTypeFormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || undefined,
    });
  };

  const onEditSubmit = (data: ClassTypeFormData) => {
    if (!editingType) return;
    updateMutation.mutate({
      id: editingType.id,
      data: {
        ...data,
        description: data.description || undefined,
      },
    });
  };

  const openEdit = (type: ClassTypeResponse) => {
    setEditingType(type);
    editForm.reset({
      name: type.name,
      description: type.description || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Tipos y Disciplinas de Clase
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de modalidades deportivas (CrossFit, Spinning, Yoga, Pilates, Box, etc.).
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Disciplina</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Disciplinas Deportivas</CardTitle>
              <CardDescription>
                Modalidades activas para programar en el calendario
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} columns={3} />
          ) : !classTypes || classTypes.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No hay tipos de clase registrados"
              description="Define las disciplinas que imparten los entrenadores en el gimnasio."
              actionText={isAdmin ? 'Crear Disciplina' : undefined}
              onAction={isAdmin ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Disciplina / Modalidad</th>
                    <th className="py-3 px-4">Descripción</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {classTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        #{type.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                        <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                        <span>{type.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs max-w-md">
                        {type.description || 'Sin descripción'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(type)}
                            title="Editar disciplina"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingType(type)}
                            title="Eliminar disciplina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create Class Type */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nueva Disciplina"
        description="Agrega un tipo de clase para la programación del gimnasio."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre de la Disciplina</Label>
            <Input
              placeholder="ej. Spinning Intensivo"
              error={createForm.formState.errors.name?.message}
              {...createForm.register('name')}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Describe los objetivos y requerimientos de esta clase..."
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
              Guardar Disciplina
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Class Type */}
      <Modal
        isOpen={!!editingType}
        onClose={() => setEditingType(null)}
        title="Editar Disciplina"
        description="Modifica el título o descripción del tipo de clase."
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre de la Disciplina</Label>
            <Input
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name')}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...editForm.register('description')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingType(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Actualizar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingType}
        onClose={() => setDeletingType(null)}
        onConfirm={() => deletingType && deleteMutation.mutate(deletingType.id)}
        title="Eliminar Disciplina"
        message={`¿Estás seguro de que deseas eliminar permanentemente la disciplina "${deletingType?.name}"?`}
        confirmText="Eliminar Disciplina"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
