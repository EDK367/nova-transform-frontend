import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import {
  CreatePaymentMethodRequest,
  PaymentMethodResponse,
  UpdatePaymentMethodRequest,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Wallet, Plus, Edit2, Trash2, CreditCard } from 'lucide-react';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().optional(),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

export const PaymentMethodsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodResponse | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethodResponse | null>(null);

  const { data: methods, isLoading } = useQuery<PaymentMethodResponse[]>({
    queryKey: ['payment-methods'],
    queryFn: () => invoiceService.getPaymentMethods(),
  });

  const createForm = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { name: '', description: '' },
  });

  const editForm = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentMethodRequest) => invoiceService.createPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Método de pago registrado exitosamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentMethodRequest }) =>
      invoiceService.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setEditingMethod(null);
      toast.success('Método de pago actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoiceService.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setDeletingMethod(null);
      toast.success('Método de pago eliminado');
    },
  });

  const onCreateSubmit = (data: PaymentMethodFormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || undefined,
    });
  };

  const onEditSubmit = (data: PaymentMethodFormData) => {
    if (!editingMethod) return;
    updateMutation.mutate({
      id: editingMethod.id,
      data: {
        ...data,
        description: data.description || undefined,
      },
    });
  };

  const openEdit = (method: PaymentMethodResponse) => {
    setEditingMethod(method);
    editForm.reset({
      name: method.name,
      description: method.description || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Métodos de Pago
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Formas de pago autorizadas para el cobro de mensualidades y clases (Efectivo, Tarjeta, Transferencia SPEI).
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Método de Pago</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Canales de Cobro Habilitados</CardTitle>
              <CardDescription>
                Opciones disponibles para emitir recibos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} columns={3} />
          ) : !methods || methods.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No hay métodos de pago registrados"
              description="Agrega opciones de liquidación para que los recepcionistas cobren facturas."
              actionText={isAdmin ? 'Crear Método' : undefined}
              onAction={isAdmin ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Fecha de Alta</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {methods.map((method) => (
                    <tr key={method.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        #{method.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary shrink-0" />
                        <span>{method.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs max-w-md">
                        {method.description || 'Sin notas'}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {formatDate(method.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(method)}
                            title="Editar método"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingMethod(method)}
                            title="Eliminar método"
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

      {/* Modal: Create Payment Method */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Método de Pago"
        description="Agrega una opción de liquidación financiera."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre del Método</Label>
            <Input
              placeholder="ej. Tarjeta de Débito / Crédito Terminal"
              error={createForm.formState.errors.name?.message}
              {...createForm.register('name')}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Notas sobre comisiones bancarias o terminales asociadas..."
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
              Guardar Método
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Payment Method */}
      <Modal
        isOpen={!!editingMethod}
        onClose={() => setEditingMethod(null)}
        title="Editar Método de Pago"
        description="Modifica la denominación del canal de cobro."
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Nombre del Método</Label>
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
              onClick={() => setEditingMethod(null)}
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
        isOpen={!!deletingMethod}
        onClose={() => setDeletingMethod(null)}
        onConfirm={() => deletingMethod && deleteMutation.mutate(deletingMethod.id)}
        title="Eliminar Método de Pago"
        message={`¿Estás seguro de que deseas eliminar permanentemente el método "${deletingMethod?.name}"?`}
        confirmText="Eliminar Método"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
