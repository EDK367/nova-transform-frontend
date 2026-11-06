import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipService } from '@/services/membership.service';
import { BenefitResponse, CreateBenefitRequest, UpdateBenefitRequest } from '@/types';
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
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Award, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

const benefitSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

export const BenefitsPage: React.FC = () => {
  const { checkPolicy } = useAuth();
  const isAdmin = checkPolicy({ permissions: [PERMISSIONS.BENEFITS_MANAGE], roles: ['ADMIN'] });
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<BenefitResponse | null>(null);
  const [deletingBenefit, setDeletingBenefit] = useState<BenefitResponse | null>(null);

  const { data: benefits, isLoading } = useQuery<BenefitResponse[]>({
    queryKey: ['benefits'],
    queryFn: () => membershipService.getBenefits(),
  });

  const createForm = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: { name: '', description: '' },
  });

  const editForm = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBenefitRequest) => membershipService.createBenefit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Beneficio creado exitosamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBenefitRequest }) =>
      membershipService.updateBenefit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      setEditingBenefit(null);
      toast.success('Beneficio actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => membershipService.deleteBenefit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      setDeletingBenefit(null);
      toast.success('Beneficio eliminado');
    },
  });

  const onCreateSubmit = (data: BenefitFormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || undefined,
    });
  };

  const onEditSubmit = (data: BenefitFormData) => {
    if (!editingBenefit) return;
    updateMutation.mutate({
      id: editingBenefit.id,
      data: {
        ...data,
        description: data.description || undefined,
      },
    });
  };

  const openEdit = (benefit: BenefitResponse) => {
    setEditingBenefit(benefit);
    editForm.reset({
      name: benefit.name,
      description: benefit.description || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Catálogo de Beneficios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra las ventajas y comodidades que se asignan a cada plan de membresía.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Beneficio</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Beneficios Disponibles</CardTitle>
              <CardDescription>
                Ventajas configuradas para asociar a membresías
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : !benefits || benefits.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No hay beneficios registrados"
              description="Crea beneficios como Casillero VIP, Acceso a Sauna o Entrenador Personal."
              actionText={isAdmin ? 'Crear Beneficio' : undefined}
              onAction={isAdmin ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nombre del Beneficio</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Creado</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {benefits.map((b) => (
                    <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        #{b.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{b.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs max-w-md">
                        {b.description || 'Sin descripción'}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {formatDate(b.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(b)}
                            title="Editar beneficio"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingBenefit(b)}
                            title="Eliminar beneficio"
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

      {/* Modal: Create Benefit */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nuevo Beneficio"
        description="Agrega un beneficio que podrá ser otorgado en los planes de suscripción."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre del Beneficio</Label>
            <Input
              placeholder="ej. Acceso a Área de Hidromasaje y Sauna"
              error={createForm.formState.errors.name?.message}
              {...createForm.register('name')}
            />
          </div>

          <div>
            <Label>Descripción Detallada</Label>
            <Textarea
              placeholder="Explica qué incluye este beneficio y cómo puede disfrutarlo el cliente..."
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
              Guardar Beneficio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Benefit */}
      <Modal
        isOpen={!!editingBenefit}
        onClose={() => setEditingBenefit(null)}
        title="Editar Beneficio"
        description="Modifica el título o descripción del beneficio."
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre del Beneficio</Label>
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
              onClick={() => setEditingBenefit(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Actualizar Beneficio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingBenefit}
        onClose={() => setDeletingBenefit(null)}
        onConfirm={() => deletingBenefit && deleteMutation.mutate(deletingBenefit.id)}
        title="Eliminar Beneficio"
        message={`¿Estás seguro de que deseas eliminar permanentemente el beneficio "${deletingBenefit?.name}"?`}
        confirmText="Eliminar Beneficio"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
