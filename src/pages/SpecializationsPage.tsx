import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specializationService } from '@/services/specialization.service';
import {
  CreateSpecializationRequest,
  SpecializationResponse,
  UpdateSpecializationRequest,
} from '@/types';
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
import {
  Award,
  Plus,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const specializationSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  description: z.string().optional(),
});

type SpecializationFormData = z.infer<typeof specializationSchema>;

export const SpecializationsPage: React.FC = () => {
  const { checkPolicy } = useAuth();
  const isAdmin = checkPolicy({
    permissions: [PERMISSIONS.SPECIALIZATIONS_MANAGE],
    roles: ['ADMIN', 'ENTRENADOR'],
  });
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<SpecializationResponse | null>(null);
  const [deletingSpec, setDeletingSpec] = useState<SpecializationResponse | null>(null);

  const { data: specsData, isLoading } = useQuery({
    queryKey: ['specializations', page],
    queryFn: () =>
      specializationService.getAll({
        page,
        size: 10,
        sortBy: 'name',
        sortDirection: 'asc',
      }),
  });

  const form = useForm<SpecializationFormData>({
    resolver: zodResolver(specializationSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const openCreateModal = () => {
    setEditingSpec(null);
    form.reset({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (s: SpecializationResponse) => {
    setEditingSpec(s);
    form.reset({ name: s.name, description: s.description || '' });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: SpecializationFormData) => {
      if (editingSpec) {
        return specializationService.update(editingSpec.id, data as UpdateSpecializationRequest);
      }
      return specializationService.create(data as CreateSpecializationRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setIsModalOpen(false);
      toast.success(editingSpec ? 'Especialidad actualizada' : 'Especialidad creada con éxito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => specializationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setDeletingSpec(null);
      toast.success('Especialidad eliminada');
    },
  });

  const specs = specsData?.content || [];
  const filtered = specs.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Especialidades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de áreas de especialización deportiva y disciplinas de entrenamiento.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Especialidad</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar especialidad por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Disciplinas y Especializaciones</CardTitle>
          <CardDescription>
            Total: {specsData?.totalElements ?? 0} registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No hay especialidades encontradas"
              description="No hay disciplinas registradas que coincidan con la búsqueda."
              actionText={isAdmin ? 'Registrar Primera Especialidad' : undefined}
              onAction={isAdmin ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Descripción</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        #{s.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {s.description || 'Sin descripción'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(s)}
                            title="Editar especialidad"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingSpec(s)}
                            title="Eliminar especialidad"
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

          {specsData && specsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {specsData.totalPages}
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
                  disabled={page >= specsData.totalPages - 1}
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
        title={editingSpec ? 'Editar Especialidad' : 'Nueva Especialidad'}
      >
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <Label required>Nombre de la Disciplina / Especialidad</Label>
            <Input
              placeholder="ej. Powerlifting, CrossFit, Yoga, Hiit"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Detalles sobre el enfoque, metodología y requerimientos..."
              {...form.register('description')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editingSpec ? 'Guardar Cambios' : 'Crear Especialidad'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingSpec}
        onClose={() => setDeletingSpec(null)}
        onConfirm={() => deletingSpec && deleteMutation.mutate(deletingSpec.id)}
        title="Eliminar Especialidad"
        message={`¿Estás seguro de que deseas eliminar la especialidad "${deletingSpec?.name}"?`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
