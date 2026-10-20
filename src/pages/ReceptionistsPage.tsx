import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistService } from '@/services/receptionist.service';
import { branchService } from '@/services/branch.service';
import { userService } from '@/services/user.service';
import {
  CreateReceptionistRequest,
  ReceptionistResponse,
  UpdateReceptionistRequest,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
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
  UserCheck,
  UserPlus,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Calendar,
} from 'lucide-react';

const receptionistSchema = z.object({
  userId: z.string().min(1, 'Selecciona un usuario'),
  branchId: z.coerce.number().min(1, 'Selecciona una sucursal'),
  hireDate: z.string().optional(),
  shift: z.string().min(1, 'Turno requerido'),
});

type ReceptionistFormData = z.infer<typeof receptionistSchema>;

export const ReceptionistsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecep, setEditingRecep] = useState<ReceptionistResponse | null>(null);
  const [deletingRecep, setDeletingRecep] = useState<ReceptionistResponse | null>(null);

  const { data: receptionistsData, isLoading } = useQuery({
    queryKey: ['receptionists', page, branchFilter],
    queryFn: () =>
      receptionistService.getAll({
        page,
        size: 10,
        branchId: branchFilter ? Number(branchFilter) : undefined,
      }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-select'],
    queryFn: () => branchService.getAll({ page: 0, size: 50 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => userService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && !editingRecep,
  });

  const form = useForm<ReceptionistFormData>({
    resolver: zodResolver(receptionistSchema),
    defaultValues: {
      userId: '',
      branchId: 1,
      hireDate: new Date().toISOString().split('T')[0],
      shift: 'Matutino',
    },
  });

  const openCreateModal = () => {
    setEditingRecep(null);
    form.reset({
      userId: '',
      branchId: 1,
      hireDate: new Date().toISOString().split('T')[0],
      shift: 'Matutino',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (r: ReceptionistResponse) => {
    setEditingRecep(r);
    form.reset({
      userId: r.userId,
      branchId: r.branchId,
      hireDate: r.hireDate || '',
      shift: r.shift || 'Matutino',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ReceptionistFormData) => {
      if (editingRecep) {
        const updatePayload: UpdateReceptionistRequest = {
          branchId: data.branchId,
          hireDate: data.hireDate || undefined,
          shift: data.shift,
        };
        return receptionistService.update(editingRecep.id, updatePayload);
      }
      const createPayload: CreateReceptionistRequest = {
        userId: data.userId,
        branchId: data.branchId,
        hireDate: data.hireDate || undefined,
        shift: data.shift,
      };
      return receptionistService.create(createPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] });
      setIsModalOpen(false);
      toast.success(editingRecep ? 'Recepcionista actualizado' : 'Recepcionista asignado exitosamente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => receptionistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] });
      setDeletingRecep(null);
      toast.success('Recepcionista dado de baja');
    },
  });

  const receptionists = receptionistsData?.content || [];
  const filtered = receptionists.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.firstName?.toLowerCase().includes(q) ||
      r.lastName?.toLowerCase().includes(q) ||
      r.username?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.shift?.toLowerCase().includes(q)
    );
  });

  const branches = branchesData?.content || [];
  const users = usersData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Recepcionistas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personal encargado de accesos, atención a clientes y caja por sucursal.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Asignar Recepcionista</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario, email o turno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Equipo de Recepción</CardTitle>
          <CardDescription>
            Total: {receptionistsData?.totalElements ?? 0} recepcionistas registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No hay recepcionistas encontrados"
              description="No hay recepcionistas registrados con los filtros seleccionados."
              actionText={isAdmin ? 'Asignar Primer Recepcionista' : undefined}
              onAction={isAdmin ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Recepcionista</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Turno</th>
                    <th className="py-3 px-4">Fecha de Ingreso</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">
                          {r.firstName} {r.lastName}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">@{r.username}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span>{r.email}</span>
                        </div>
                        {r.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{r.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{r.branchName || `Sede #${r.branchId}`}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="font-medium text-xs">
                          {r.shift || 'General'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(r.hireDate)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={r.active ? 'default' : 'destructive'}>
                          {r.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(r)}
                            title="Editar recepcionista"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingRecep(r)}
                            title="Dar de baja recepcionista"
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

          {receptionistsData && receptionistsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {receptionistsData.totalPages}
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
                  disabled={page >= receptionistsData.totalPages - 1}
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
        title={editingRecep ? 'Editar Recepcionista' : 'Asignar Nuevo Recepcionista'}
      >
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          {!editingRecep && (
            <div>
              <Label required>Usuario del Sistema</Label>
              <Select {...form.register('userId')}>
                <option value="">Selecciona un usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} (@{u.username}) - {u.roleName}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label required>Sucursal Asignada</Label>
            <Select {...form.register('branchId')}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Turno de Trabajo</Label>
              <Select {...form.register('shift')}>
                <option value="Matutino">Matutino (6:00 - 14:00)</option>
                <option value="Vespertino">Vespertino (14:00 - 22:00)</option>
                <option value="Nocturno">Nocturno (22:00 - 6:00)</option>
                <option value="Completo">Tiempo Completo</option>
              </Select>
            </div>
            <div>
              <Label>Fecha de Contratación</Label>
              <Input type="date" {...form.register('hireDate')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editingRecep ? 'Guardar Cambios' : 'Asignar Recepcionista'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingRecep}
        onClose={() => setDeletingRecep(null)}
        onConfirm={() => deletingRecep && deleteMutation.mutate(deletingRecep.id)}
        title="Dar de baja Recepcionista"
        message={`¿Estás seguro de que deseas retirar a "${deletingRecep?.firstName} ${deletingRecep?.lastName}" como recepcionista?`}
        confirmText="Confirmar Baja"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
