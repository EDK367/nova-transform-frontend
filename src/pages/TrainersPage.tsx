import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerService } from '@/services/trainer.service';
import { specializationService } from '@/services/specialization.service';
import { branchService } from '@/services/branch.service';
import { userService } from '@/services/user.service';
import {
  CreateTrainerRequest,
  SpecializationResponse,
  TrainerResponse,
  TrainerSpecializationResponse,
  UpdateTrainerRequest,
} from '@/types';
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
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Dumbbell,
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Award,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Calendar,
  X,
  Plus,
} from 'lucide-react';

const trainerSchema = z.object({
  userId: z.string().min(1, 'Selecciona un usuario'),
  branchId: z.coerce.number().optional(),
  bio: z.string().optional(),
  hireDate: z.string().optional(),
});

type TrainerFormData = z.infer<typeof trainerSchema>;

export const TrainersPage: React.FC = () => {
  const { checkPolicy } = useAuth();
  const isAdmin = checkPolicy({ permissions: [PERMISSIONS.TRAINERS_MANAGE], roles: ['ADMIN'] });
  const canManageSpecs = checkPolicy({
    permissions: [PERMISSIONS.SPECIALIZATIONS_MANAGE],
    roles: ['ADMIN', 'ENTRENADOR'],
  });
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerResponse | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState<TrainerResponse | null>(null);

  const [selectedTrainerForSpecs, setSelectedTrainerForSpecs] = useState<TrainerResponse | null>(null);
  const [selectedSpecToAdd, setSelectedSpecToAdd] = useState<number | ''>('');

  const { data: trainersData, isLoading } = useQuery({
    queryKey: ['trainers', page, branchFilter],
    queryFn: () =>
      trainerService.getAll({
        page,
        size: 10,
        branchId: branchFilter ? Number(branchFilter) : undefined,
      }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-select'],
    queryFn: () => branchService.getAll({ page: 0, size: 50 }),
  });

  const { data: specializationsData } = useQuery({
    queryKey: ['specializations-select'],
    queryFn: () => specializationService.getAll({ page: 0, size: 100 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-select-trainers'],
    queryFn: () => userService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && !editingTrainer && isAdmin,
  });

  const { data: trainerSpecs, refetch: refetchTrainerSpecs } = useQuery({
    queryKey: ['trainer-specializations', selectedTrainerForSpecs?.id],
    queryFn: () =>
      selectedTrainerForSpecs ? trainerService.getSpecializations(selectedTrainerForSpecs.id) : [],
    enabled: !!selectedTrainerForSpecs,
  });

  const form = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      userId: '',
      branchId: 1,
      bio: '',
      hireDate: new Date().toISOString().split('T')[0],
    },
  });

  const openCreateModal = () => {
    setEditingTrainer(null);
    form.reset({
      userId: '',
      branchId: 1,
      bio: '',
      hireDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: TrainerResponse) => {
    setEditingTrainer(t);
    form.reset({
      userId: t.userId,
      branchId: t.branchId || 1,
      bio: t.bio || '',
      hireDate: t.hireDate || '',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      if (editingTrainer) {
        const updatePayload: UpdateTrainerRequest = {
          branchId: data.branchId || undefined,
          bio: data.bio || undefined,
          hireDate: data.hireDate || undefined,
        };
        return trainerService.update(editingTrainer.id, updatePayload);
      }
      const createPayload: CreateTrainerRequest = {
        userId: data.userId,
        branchId: data.branchId || undefined,
        bio: data.bio || undefined,
        hireDate: data.hireDate || undefined,
      };
      return trainerService.create(createPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setIsModalOpen(false);
      toast.success(editingTrainer ? 'Entrenador actualizado' : 'Entrenador dado de alta');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setDeletingTrainer(null);
      toast.success('Entrenador dado de baja');
    },
  });

  const assignSpecMutation = useMutation({
    mutationFn: async ({ trainerId, specId }: { trainerId: string; specId: number }) => {
      return trainerService.assignSpecialization(trainerId, specId);
    },
    onSuccess: () => {
      refetchTrainerSpecs();
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setSelectedSpecToAdd('');
      toast.success('Especialidad asignada al entrenador');
    },
  });

  const removeSpecMutation = useMutation({
    mutationFn: async ({ trainerId, specId }: { trainerId: string; specId: number }) => {
      return trainerService.removeSpecialization(trainerId, specId);
    },
    onSuccess: () => {
      refetchTrainerSpecs();
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Especialidad desvinculada');
    },
  });

  const trainers = trainersData?.content || [];
  const filtered = trainers.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.firstName?.toLowerCase().includes(q) ||
      t.lastName?.toLowerCase().includes(q) ||
      t.username?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      (t.bio && t.bio.toLowerCase().includes(q))
    );
  });

  const branches = branchesData?.content || [];
  const users = usersData?.content || [];
  const allSpecs = specializationsData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Entrenadores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión del staff deportivo, asignación de especialidades y sucursales.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Registrar Entrenador</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, especialidad, usuario o correo..."
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
          <CardTitle>Staff de Entrenadores</CardTitle>
          <CardDescription>
            Total: {trainersData?.totalElements ?? 0} entrenadores activos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No hay entrenadores encontrados"
              description="No hay entrenadores registrados que coincidan con la búsqueda."
              actionText={isAdmin ? 'Registrar Primer Entrenador' : undefined}
              onAction={isAdmin ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Entrenador</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Especialidades</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">
                          {t.firstName} {t.lastName}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">@{t.username}</p>
                        {t.bio && (
                          <p className="text-xs text-muted-foreground/80 italic mt-0.5 max-w-xs line-clamp-1">
                            "{t.bio}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span>{t.email}</span>
                        </div>
                        {t.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{t.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{t.branchName || (t.branchId ? `Sede #${t.branchId}` : 'Multi-sede')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.specializationNames && t.specializationNames.length > 0 ? (
                            t.specializationNames.map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-[11px] py-0">
                                {spec}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin especialidades</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={t.active ? 'default' : 'destructive'}>
                          {t.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTrainerForSpecs(t)}
                          title="Gestionar Especialidades"
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(t)}
                              title="Editar entrenador"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => setDeletingTrainer(t)}
                              title="Dar de baja entrenador"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {trainersData && trainersData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {trainersData.totalPages}
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
                  disabled={page >= trainersData.totalPages - 1}
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
        title={editingTrainer ? 'Editar Entrenador' : 'Registrar Nuevo Entrenador'}
      >
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          {!editingTrainer && (
            <div>
              <Label required>Usuario del Sistema</Label>
              <Select {...form.register('userId')}>
                <option value="">Selecciona usuario con rol ENTRENADOR...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} (@{u.username}) - {u.roleName}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label>Sucursal Asignada</Label>
            <Select {...form.register('branchId')}>
              <option value="">Multi-sede / General</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Biografía / Resumen de Experiencia</Label>
            <Textarea
              placeholder="Certificado en musculación, nutrición deportiva, entrenamiento funcional..."
              {...form.register('bio')}
            />
          </div>

          <div>
            <Label>Fecha de Contratación</Label>
            <Input type="date" {...form.register('hireDate')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editingTrainer ? 'Guardar Cambios' : 'Registrar Entrenador'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedTrainerForSpecs}
        onClose={() => setSelectedTrainerForSpecs(null)}
        title={`Especialidades de ${selectedTrainerForSpecs?.firstName} ${selectedTrainerForSpecs?.lastName}`}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Especialidades asignadas actualmente</Label>
            {trainerSpecs && trainerSpecs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trainerSpecs.map((ts) => (
                  <Badge
                    key={ts.specializationId}
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1 px-3 text-xs"
                  >
                    <span>{ts.specializationName || `Especialidad #${ts.specializationId}`}</span>
                    {canManageSpecs && (
                      <button
                        type="button"
                        onClick={() =>
                          selectedTrainerForSpecs &&
                          removeSpecMutation.mutate({
                            trainerId: selectedTrainerForSpecs.id,
                            specId: ts.specializationId,
                          })
                        }
                        className="text-muted-foreground hover:text-red-400 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No cuenta con especialidades registradas aún.</p>
            )}
          </div>

          {canManageSpecs && (
            <div className="pt-4 border-t border-border space-y-3">
              <Label>Añadir nueva especialidad</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedSpecToAdd}
                  onChange={(e) => setSelectedSpecToAdd(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1"
                >
                  <option value="">Selecciona especialidad...</option>
                  {allSpecs
                    .filter((s) => !trainerSpecs?.some((ts) => ts.specializationId === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
                <Button
                  disabled={!selectedSpecToAdd || assignSpecMutation.isPending}
                  onClick={() => {
                    if (selectedTrainerForSpecs && selectedSpecToAdd) {
                      assignSpecMutation.mutate({
                        trainerId: selectedTrainerForSpecs.id,
                        specId: Number(selectedSpecToAdd),
                      });
                    }
                  }}
                  className="gap-1 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Asignar</span>
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setSelectedTrainerForSpecs(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingTrainer}
        onClose={() => setDeletingTrainer(null)}
        onConfirm={() => deletingTrainer && deleteMutation.mutate(deletingTrainer.id)}
        title="Dar de baja Entrenador"
        message={`¿Estás seguro de que deseas retirar a "${deletingTrainer?.firstName} ${deletingTrainer?.lastName}" del staff de entrenadores?`}
        confirmText="Confirmar Baja"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
