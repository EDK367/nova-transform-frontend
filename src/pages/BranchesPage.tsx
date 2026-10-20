import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { BranchResponse, CreateBranchRequest, UpdateBranchRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Building2,
  Plus,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type BranchFormData = z.infer<typeof branchSchema>;

export const BranchesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<BranchResponse | null>(null);

  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches', page],
    queryFn: () => branchService.getAll({ page, size: 10, sortBy: 'name', sortDirection: 'asc' }),
  });

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      active: true,
    },
  });

  const openCreateModal = () => {
    setEditingBranch(null);
    form.reset({
      name: '',
      address: '',
      phone: '',
      email: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: BranchResponse) => {
    setEditingBranch(b);
    form.reset({
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      active: b.active,
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const payload = {
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        active: data.active,
      };
      if (editingBranch) {
        return branchService.update(editingBranch.id, payload);
      }
      return branchService.create(payload as CreateBranchRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsModalOpen(false);
      toast.success(editingBranch ? 'Sucursal actualizada con éxito' : 'Sucursal creada con éxito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => branchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setDeletingBranch(null);
      toast.success('Sucursal eliminada');
    },
  });

  const branches = branchesData?.content || [];
  const filtered = branches.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.address && b.address.toLowerCase().includes(q)) ||
      (b.phone && b.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sucursales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de las sedes operativas, ubicaciones y datos de contacto de la cadena.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Sucursal</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, dirección o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Listado de Sedes</CardTitle>
          <CardDescription>
            Total: {branchesData?.totalElements ?? 0} sucursales
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No hay sucursales encontradas"
              description="No hay sedes registradas que coincidan con la búsqueda."
              actionText={isAdmin ? 'Registrar Primera Sucursal' : undefined}
              onAction={isAdmin ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nombre de Sede</th>
                    <th className="py-3 px-4">Dirección</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        #{b.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {b.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{b.address || 'Sin dirección registrada'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground space-y-1">
                        {b.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{b.phone}</span>
                          </div>
                        )}
                        {b.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            <span>{b.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={b.active ? 'default' : 'destructive'}>
                          {b.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(b)}
                            title="Editar sucursal"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingBranch(b)}
                            title="Eliminar sucursal"
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

          {branchesData && branchesData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {branchesData.totalPages}
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
                  disabled={page >= branchesData.totalPages - 1}
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
        title={editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
      >
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <Label required>Nombre de la Sucursal</Label>
            <Input
              placeholder="ej. Sede Santa Fe"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input
              placeholder="ej. Av. Reforma 123, Piso 4"
              error={form.formState.errors.address?.message}
              {...form.register('address')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input
                placeholder="+52 555 123 4567"
                error={form.formState.errors.phone?.message}
                {...form.register('phone')}
              />
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="sucursal@gym.com"
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeBranch"
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              {...form.register('active')}
            />
            <Label htmlFor="activeBranch" className="cursor-pointer">
              Sucursal operativa / activa
            </Label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingBranch}
        onClose={() => setDeletingBranch(null)}
        onConfirm={() => deletingBranch && deleteMutation.mutate(deletingBranch.id)}
        title="Eliminar Sucursal"
        message={`¿Estás seguro de que deseas eliminar la sucursal "${deletingBranch?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Sucursal"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
