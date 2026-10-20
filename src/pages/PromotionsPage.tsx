import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionService } from '@/services/promotion.service';
import {
  CreatePromotionRequest,
  PromotionDiscountType,
  PromotionResponse,
  UpdatePromotionRequest,
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Sparkles, Plus, Edit2, Trash2, Percent, DollarSign, Calendar } from 'lucide-react';

const promoSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.coerce.number().min(0.01, 'El descuento debe ser mayor a 0'),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de fin requerida'),
  active: z.boolean().default(true),
});

type PromoFormData = z.infer<typeof promoSchema>;

export const PromotionsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();

  const [onlyActive, setOnlyActive] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionResponse | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromotionResponse | null>(null);

  const { data: promotions, isLoading } = useQuery<PromotionResponse[]>({
    queryKey: ['promotions', onlyActive],
    queryFn: () => promotionService.getAll(onlyActive),
  });

  const createForm = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      active: true,
    },
  });

  const editForm = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionRequest) => promotionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Promoción creada exitosamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePromotionRequest }) =>
      promotionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setEditingPromo(null);
      toast.success('Promoción actualizada con éxito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => promotionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setDeletingPromo(null);
      toast.success('Promoción eliminada');
    },
  });

  const onCreateSubmit = (data: PromoFormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || undefined,
    });
  };

  const onEditSubmit = (data: PromoFormData) => {
    if (!editingPromo) return;
    updateMutation.mutate({
      id: editingPromo.id,
      data: {
        ...data,
        description: data.description || undefined,
      },
    });
  };

  const openEdit = (promo: PromotionResponse) => {
    setEditingPromo(promo);
    editForm.reset({
      name: promo.name,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      active: promo.active,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Promociones y Descuentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Campañas promocionales por porcentaje o importe directo aplicables en facturas.
          </p>
        </div>
        {isAdminOrRecep && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Crear Promoción</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span>Mostrar únicamente promociones vigentes/activas</span>
          </label>
          <span className="text-xs text-muted-foreground">
            Total: {promotions?.length || 0} campañas
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campañas Promocionales</CardTitle>
              <CardDescription>
                Beneficios temporales aplicables a compras de membresías
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} columns={6} />
          ) : !promotions || promotions.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No hay promociones registradas"
              description="Diseña promociones de temporada para atraer e incentivar a nuevos socios."
              actionText={isAdminOrRecep ? 'Crear Promoción' : undefined}
              onAction={isAdminOrRecep ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Nombre de la Campaña</th>
                    <th className="py-3 px-4">Tipo Descuento</th>
                    <th className="py-3 px-4">Valor Descuento</th>
                    <th className="py-3 px-4">Vigencia</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdminOrRecep && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {promotions.map((p) => {
                    const isPercentage = p.discountType === 'PERCENTAGE';
                    return (
                      <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          PROMO-{p.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-muted-foreground">{p.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground">
                            {isPercentage ? (
                              <Percent className="h-3 w-3 text-primary" />
                            ) : (
                              <DollarSign className="h-3 w-3 text-emerald-400" />
                            )}
                            {isPercentage ? 'Porcentaje' : 'Monto Fijo'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-base font-extrabold text-emerald-400">
                          {isPercentage
                            ? `${p.discountValue}% OFF`
                            : formatCurrency(p.discountValue)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>
                              {formatDate(p.startDate)} - {formatDate(p.endDate)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={p.active ? 'default' : 'destructive'}>
                            {p.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </td>
                        {isAdminOrRecep && (
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(p)}
                              title="Editar promoción"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => setDeletingPromo(p)}
                                title="Eliminar promoción"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create Promotion */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nueva Promoción"
        description="Establece los términos y montos de descuento para la campaña."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre de la Promoción</Label>
            <Input
              placeholder="ej. Descuento Apertura de Año Nuevo"
              error={createForm.formState.errors.name?.message}
              {...createForm.register('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Tipo de Descuento</Label>
              <Select {...createForm.register('discountType')}>
                <option value="PERCENTAGE">Porcentaje (% Descuento)</option>
                <option value="FIXED_AMOUNT">Monto Fijo (Q Directo)</option>
              </Select>
            </div>
            <div>
              <Label required>Valor del Descuento</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="ej. 15 ó 100"
                error={createForm.formState.errors.discountValue?.message}
                {...createForm.register('discountValue')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fecha de Inicio</Label>
              <Input
                type="date"
                error={createForm.formState.errors.startDate?.message}
                {...createForm.register('startDate')}
              />
            </div>
            <div>
              <Label required>Fecha de Fin</Label>
              <Input
                type="date"
                error={createForm.formState.errors.endDate?.message}
                {...createForm.register('endDate')}
              />
            </div>
          </div>

          <div>
            <Label>Descripción de la Campaña</Label>
            <Textarea
              placeholder="Condiciones de la promoción o paquetes participantes..."
              {...createForm.register('description')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activePromo"
              {...createForm.register('active')}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="activePromo" className="cursor-pointer mb-0">
              Activar de forma inmediata
            </Label>
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
              Guardar Promoción
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Promotion */}
      <Modal
        isOpen={!!editingPromo}
        onClose={() => setEditingPromo(null)}
        title="Editar Promoción"
        description="Actualiza la vigencia o importe de la promoción."
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre de la Promoción</Label>
            <Input
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Tipo de Descuento</Label>
              <Select {...editForm.register('discountType')}>
                <option value="PERCENTAGE">Porcentaje (% Descuento)</option>
                <option value="FIXED_AMOUNT">Monto Fijo (Q Directo)</option>
              </Select>
            </div>
            <div>
              <Label required>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                error={editForm.formState.errors.discountValue?.message}
                {...editForm.register('discountValue')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Inicio</Label>
              <Input type="date" {...editForm.register('startDate')} />
            </div>
            <div>
              <Label required>Fin</Label>
              <Input type="date" {...editForm.register('endDate')} />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...editForm.register('description')} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editActivePromo"
              {...editForm.register('active')}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="editActivePromo" className="cursor-pointer mb-0">
              Campaña Activa
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPromo(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPromo}
        onClose={() => setDeletingPromo(null)}
        onConfirm={() => deletingPromo && deleteMutation.mutate(deletingPromo.id)}
        title="Eliminar Promoción"
        message={`¿Estás seguro de que deseas eliminar permanentemente la campaña "${deletingPromo?.name}"?`}
        confirmText="Eliminar Promoción"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
