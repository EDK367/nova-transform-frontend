import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerAssignmentService } from '@/services/trainer-assignment.service';
import { trainerService } from '@/services/trainer.service';
import { memberService } from '@/services/member.service';
import {
  CreateTrainerAssignmentRequest,
  TrainerAssignmentResponse,
  UpdateTrainerAssignmentRequest,
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
  UserCheck,
  Plus,
  Search,
  Trash2,
  Calendar,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const assignmentSchema = z.object({
  trainerId: z.string().min(1, 'Selecciona un entrenador'),
  memberId: z.string().min(1, 'Selecciona un cliente'),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const TrainerAssignmentsPage: React.FC = () => {
  const { user, hasRole, checkPolicy } = useAuth();
  const isClient = hasRole('CLIENTE');
  const canCreateAssignment = checkPolicy({
    permissions: [PERMISSIONS.ASSIGNMENTS_MANAGE],
    roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR'],
  });
  const isAdmin = checkPolicy({
    permissions: [PERMISSIONS.ASSIGNMENTS_MANAGE],
    roles: ['ADMIN'],
  });
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<TrainerAssignmentResponse | null>(null);

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['trainer-assignments', page, isClient ? user?.id : 'all'],
    queryFn: () =>
      trainerAssignmentService.getAll({
        page,
        size: 10,
        memberId: isClient ? user?.id : undefined,
        sortBy: 'startDate',
        sortDirection: 'desc',
      }),
  });

  const { data: trainersData } = useQuery({
    queryKey: ['trainers-select'],
    queryFn: () => trainerService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && canCreateAssignment,
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select-assignments'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && canCreateAssignment,
  });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      trainerId: '',
      memberId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
    },
  });

  const openCreateModal = () => {
    form.reset({
      trainerId: '',
      memberId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: AssignmentFormData) => {
      const payload: CreateTrainerAssignmentRequest = {
        trainerId: data.trainerId,
        memberId: data.memberId,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        notes: data.notes || undefined,
      };
      return trainerAssignmentService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-assignments'] });
      setIsModalOpen(false);
      toast.success('Entrenador asignado exitosamente al cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainerAssignmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-assignments'] });
      setDeletingAssignment(null);
      toast.success('Asignación finalizada / eliminada');
    },
  });

  const assignments = assignmentsData?.content || [];
  const filtered = assignments.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      (a.trainerName && a.trainerName.toLowerCase().includes(q)) ||
      (a.memberName && a.memberName.toLowerCase().includes(q)) ||
      (a.notes && a.notes.toLowerCase().includes(q))
    );
  });

  const trainers = trainersData?.content || [];
  const members = membersData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isClient ? 'Mi Entrenador Asignado' : 'Asignaciones de Entrenador'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? 'Consulta el entrenador personal vinculado a tu cuenta para seguimiento individual.'
              : 'Vinculación de entrenadores personales con clientes para seguimiento individual.'}
          </p>
        </div>
        {canCreateAssignment && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Asignar Entrenador a Cliente</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por entrenador, cliente u observaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Historial de Asignaciones</CardTitle>
          <CardDescription>
            Total: {assignmentsData?.totalElements ?? 0} asignaciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No hay asignaciones encontradas"
              description="No hay entrenadores vinculados actualmente con los filtros dados."
              actionText={canCreateAssignment ? 'Crear Primera Asignación' : undefined}
              onAction={canCreateAssignment ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Entrenador</th>
                    <th className="py-3 px-4">Cliente Asignado</th>
                    <th className="py-3 px-4">Periodo</th>
                    <th className="py-3 px-4">Notas</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y border-border/60">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-emerald-400" />
                          <span>{a.trainerName || 'Entrenador'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-400" />
                          <span>{a.memberName || 'Cliente'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {formatDate(a.startDate)} {a.endDate ? `- ${formatDate(a.endDate)}` : '(En curso)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {a.notes || 'Sin observaciones'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={a.active ? 'default' : 'secondary'}>
                          {a.active ? 'Activa' : 'Finalizada'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingAssignment(a)}
                            title="Eliminar asignación"
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

          {assignmentsData && assignmentsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {assignmentsData.totalPages}
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
                  disabled={page >= assignmentsData.totalPages - 1}
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
        title="Asignar Entrenador a Cliente"
      >
        <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div>
            <Label required>Entrenador</Label>
            <Select {...form.register('trainerId')}>
              <option value="">Selecciona entrenador...</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} (@{t.username})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Cliente</Label>
            <Select {...form.register('memberId')}>
              <option value="">Selecciona cliente...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} (@{m.username})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fecha de Inicio</Label>
              <Input type="date" {...form.register('startDate')} />
            </div>
            <div>
              <Label>Fecha de Fin (Opcional)</Label>
              <Input type="date" {...form.register('endDate')} />
            </div>
          </div>

          <div>
            <Label>Notas y Objetivos de la Asignación</Label>
            <Textarea
              placeholder="Preparación física, descenso de peso, hipertrofia..."
              {...form.register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Guardar Asignación
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={() => deletingAssignment && deleteMutation.mutate(deletingAssignment.id)}
        title="Eliminar Asignación"
        message="¿Estás seguro de que deseas eliminar esta asignación de entrenador?"
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
