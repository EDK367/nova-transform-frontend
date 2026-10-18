import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '@/services/member.service';
import { CreateMemberRequest, MemberResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';
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
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

const createMemberSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').max(100),
  lastName: z.string().min(1, 'Apellido es requerido').max(100),
  email: z.string().email('Email inválido').max(150),
  phone: z.string().max(20).optional(),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  branchId: z.coerce.number().optional(),
});

type CreateMemberFormData = z.infer<typeof createMemberSchema>;

export const MembersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberResponse | null>(null);

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

  // Query members from backend
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', page],
    queryFn: () => memberService.getAll({ page, size: 10, sortBy: 'name', sortDirection: 'asc' }),
  });

  const createForm = useForm<CreateMemberFormData>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      branchId: 1,
    },
  });

  // Create Member Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMemberRequest) => memberService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Socio registrado exitosamente');
      setTempPasswordData({
        isOpen: true,
        username: res.username,
        temporaryPassword: res.temporaryPassword,
        fullName: `${res.firstName} ${res.lastName}`,
        roleName: 'CLIENTE',
      });
    },
  });

  // Delete Member Mutation (Admin only)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setDeletingMember(null);
      toast.success('Socio eliminado correctamente');
    },
  });

  const onCreateSubmit = (data: CreateMemberFormData) => {
    createMutation.mutate({
      ...data,
      phone: data.phone || undefined,
    });
  };

  const members = membersData?.content || [];
  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Directorio de Socios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro, control y altas de clientes del gimnasio con membresías.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Registrar Nuevo Socio</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar socio por nombre, usuario o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listado General de Socios</CardTitle>
              <CardDescription>
                Total: {membersData?.totalElements ?? 0} socios registrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No hay socios registrados"
              description="Aún no se han dado de alta socios en esta sede o no coinciden con los filtros."
              actionText="Registrar Primer Socio"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Socio</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Fecha Registro</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        @{m.username}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {m.firstName} {m.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span>{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(m.registrationDate)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                        Sede #{m.branchId || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={m.active ? 'default' : 'destructive'}>
                          {m.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingMember(m)}
                            title="Eliminar socio"
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

          {/* Pagination */}
          {membersData && membersData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {membersData.page + 1} de {membersData.totalPages}
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
                  disabled={page >= membersData.totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create Member */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Nuevo Socio"
        description="Ingresa los datos personales del cliente para crear su cuenta y membresía."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Nombre</Label>
              <Input
                placeholder="ej. Isabel"
                error={createForm.formState.errors.firstName?.message}
                {...createForm.register('firstName')}
              />
            </div>
            <div>
              <Label required>Apellido</Label>
              <Input
                placeholder="ej. Navarro"
                error={createForm.formState.errors.lastName?.message}
                {...createForm.register('lastName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="isabel.navarro@gmail.com"
                error={createForm.formState.errors.email?.message}
                {...createForm.register('email')}
              />
            </div>
            <div>
              <Label>Teléfono Celular</Label>
              <Input
                placeholder="+52 555 400 0001"
                error={createForm.formState.errors.phone?.message}
                {...createForm.register('phone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Nombre de Usuario</Label>
              <Input
                placeholder="ej. inavarro"
                error={createForm.formState.errors.username?.message}
                {...createForm.register('username')}
              />
            </div>
            <div>
              <Label>Sucursal de Inscripción</Label>
              <Select {...createForm.register('branchId')}>
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
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Registrar Socio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog (ADMIN only) */}
      <ConfirmDialog
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={() => deletingMember && deleteMutation.mutate(deletingMember.id)}
        title="Eliminar Socio"
        message={`¿Estás seguro de que deseas dar de baja y eliminar permanentemente al socio "${deletingMember?.firstName} ${deletingMember?.lastName}" (@${deletingMember?.username})?`}
        confirmText="Eliminar Socio"
        isLoading={deleteMutation.isPending}
      />

      {/* Temporary Password Credential Modal */}
      <TemporaryPasswordModal
        isOpen={tempPasswordData.isOpen}
        onClose={() => setTempPasswordData((prev) => ({ ...prev, isOpen: false }))}
        username={tempPasswordData.username}
        temporaryPassword={tempPasswordData.temporaryPassword}
        fullName={tempPasswordData.fullName}
        roleName="CLIENTE / SOCIO"
      />
    </div>
  );
};
