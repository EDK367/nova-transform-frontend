import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { CreateUserRequest, RoleResponse, UpdateUserRequest, UserResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TemporaryPasswordModal } from '@/components/common/TemporaryPasswordModal';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Mail,
} from 'lucide-react';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').max(100),
  lastName: z.string().min(1, 'Apellido es requerido').max(100),
  email: z.string().email('Email inválido').max(150),
  phone: z.string().max(20).optional(),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  roleId: z.coerce.number().min(1, 'Selecciona un rol'),
  branchId: z.coerce.number().min(1, 'Selecciona una sucursal'),
  hireDate: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').max(100),
  lastName: z.string().min(1, 'Apellido es requerido').max(100),
  email: z.string().email('Email inválido').max(150),
  phone: z.string().max(20).optional(),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  branchId: z.coerce.number().optional(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);

  // Temporary password modal state
  const [tempPasswordData, setTempPasswordData] = useState<{
    isOpen: boolean;
    username: string;
    temporaryPassword?: string;
    fullName: string;
    roleName: string;
  }>({
    isOpen: false,
    username: '',
    fullName: '',
    roleName: '',
  });

  // Queries
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userService.getAll({ page, size: 10, sortBy: 'name', sortDirection: 'asc' }),
  });

  const { data: roles } = useQuery<RoleResponse[]>({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
  });

  const allowedStaffRoles = roles?.filter((r) => r.name === 'ENTRENADOR' || r.name === 'RECEPCIONISTA') || [];

  // Create Form
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      roleId: 2,
      branchId: 1,
      hireDate: new Date().toISOString().split('T')[0],
    },
  });

  React.useEffect(() => {
    if (allowedStaffRoles.length > 0) {
      const current = createForm.getValues('roleId');
      if (!allowedStaffRoles.some((r) => r.id === Number(current))) {
        createForm.setValue('roleId', allowedStaffRoles[0].id);
      }
    }
  }, [allowedStaffRoles, createForm]);

  // Edit Form
  const editForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Usuario interno creado exitosamente');
      // Show temporary password modal
      setTempPasswordData({
        isOpen: true,
        username: res.username,
        temporaryPassword: res.temporaryPassword,
        fullName: `${res.firstName} ${res.lastName}`,
        roleName: res.role,
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al registrar usuario interno';
      toast.error(msg);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast.success('Usuario actualizado correctamente');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
      toast.success('Usuario eliminado del sistema');
    },
  });

  const onCreateSubmit = (data: CreateUserFormData) => {
    createMutation.mutate({
      ...data,
      phone: data.phone || undefined,
      hireDate: data.hireDate || undefined,
    });
  };

  const onEditSubmit = (data: UpdateUserFormData) => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      data: {
        ...data,
        phone: data.phone || undefined,
      },
    });
  };

  const openEdit = (user: UserResponse) => {
    setEditingUser(user);
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      username: user.username,
      branchId: user.branchId || 1,
    });
  };

  // Client-side search filtering
  const users = usersData?.content || [];
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roleName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra cuentas de personal administrativo, entrenadores y recepcionistas.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario, correo o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Directorio de Cuentas</CardTitle>
              <CardDescription>
                Total: {usersData?.totalElements ?? 0} usuarios registrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No se encontraron usuarios"
              description="No hay registros que coincidan con la búsqueda o la base de datos está vacía."
              actionText="Crear Usuario"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        @{u.username}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Shield className="h-3 w-3" />
                          {u.roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                        Sucursal #{u.branchId || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={u.active ? 'default' : 'destructive'}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          title="Editar usuario"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => setDeletingUser(u)}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {usersData && usersData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {usersData.page + 1} de {usersData.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= usersData.totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nuevo Usuario del Personal"
        description="Registra personal operativo del gimnasio (entrenadores o recepcionistas)."
      >
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg border border-border text-xs text-muted-foreground flex items-center justify-between gap-2">
          <span>¿Deseas registrar un cliente o socio?</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 h-auto py-1 px-2 text-xs font-semibold shrink-0"
            onClick={() => {
              setIsCreateOpen(false);
              navigate('/members');
            }}
          >
            Ir a Socios &rarr;
          </Button>
        </div>

        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Nombre</Label>
              <Input
                placeholder="ej. Elena"
                error={createForm.formState.errors.firstName?.message}
                {...createForm.register('firstName')}
              />
            </div>
            <div>
              <Label required>Apellido</Label>
              <Input
                placeholder="ej. Torres"
                error={createForm.formState.errors.lastName?.message}
                {...createForm.register('lastName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Email Corporativo</Label>
              <Input
                type="email"
                placeholder="elena.torres@nova.com"
                error={createForm.formState.errors.email?.message}
                {...createForm.register('email')}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                placeholder="+52 555 123 4567"
                error={createForm.formState.errors.phone?.message}
                {...createForm.register('phone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Nombre de Usuario</Label>
              <Input
                placeholder="ej. elenatorres"
                error={createForm.formState.errors.username?.message}
                {...createForm.register('username')}
              />
            </div>
            <div>
              <Label required>Rol del Personal</Label>
              <Select
                error={createForm.formState.errors.roleId?.message}
                {...createForm.register('roleId')}
              >
                {allowedStaffRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.description}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Sucursal</Label>
              <Select {...createForm.register('branchId')}>
                <option value={1}>Sede Central (ID: 1)</option>
                <option value={2}>Sede Norte (ID: 2)</option>
                <option value={3}>Sede Sur (ID: 3)</option>
                <option value={4}>Sede Poniente (ID: 4)</option>
              </Select>
            </div>
            <div>
              <Label>Fecha de Contratación</Label>
              <Input type="date" {...createForm.register('hireDate')} />
            </div>
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
              Guardar Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuario"
        description="Actualiza la información básica del usuario."
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Nombre</Label>
              <Input
                error={editForm.formState.errors.firstName?.message}
                {...editForm.register('firstName')}
              />
            </div>
            <div>
              <Label required>Apellido</Label>
              <Input
                error={editForm.formState.errors.lastName?.message}
                {...editForm.register('lastName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                error={editForm.formState.errors.email?.message}
                {...editForm.register('email')}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                error={editForm.formState.errors.phone?.message}
                {...editForm.register('phone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Nombre de Usuario</Label>
              <Input
                error={editForm.formState.errors.username?.message}
                {...editForm.register('username')}
              />
            </div>
            <div>
              <Label>Sucursal</Label>
              <Select {...editForm.register('branchId')}>
                <option value={1}>Sede Central (ID: 1)</option>
                <option value={2}>Sede Norte (ID: 2)</option>
                <option value={3}>Sede Sur (ID: 3)</option>
                <option value={4}>Sede Poniente (ID: 4)</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingUser(null)}
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
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar permanentemente al usuario "${deletingUser?.firstName} ${deletingUser?.lastName}" (@${deletingUser?.username})? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Definitivamente"
        isLoading={deleteMutation.isPending}
      />

      {/* Temporary Password Credential Modal */}
      <TemporaryPasswordModal
        isOpen={tempPasswordData.isOpen}
        onClose={() => setTempPasswordData((prev) => ({ ...prev, isOpen: false }))}
        username={tempPasswordData.username}
        temporaryPassword={tempPasswordData.temporaryPassword}
        fullName={tempPasswordData.fullName}
        roleName={tempPasswordData.roleName}
      />
    </div>
  );
};
