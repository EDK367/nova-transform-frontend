import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classService } from '@/services/class.service';
import { memberService } from '@/services/member.service';
import { userService } from '@/services/user.service';
import {
  ClassEnrollmentResponse,
  ClassRatingResponse,
  ClassResponse,
  ClassStatus,
  ClassTypeResponse,
  CreateClassRequest,
  CreateEnrollmentRequest,
  UpdateClassRequest,
  WaitlistResponse,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateTime, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  CalendarDays,
  Plus,
  Edit2,
  XCircle,
  Users,
  Star,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

const createClassSchema = z.object({
  branchId: z.coerce.number().min(1, 'Selecciona una sucursal'),
  classTypeId: z.coerce.number().min(1, 'Selecciona un tipo de clase'),
  trainerId: z.string().min(1, 'Selecciona un entrenador'),
  scheduleDate: z.string().min(1, 'Fecha requerida'),
  scheduleTime: z.string().min(1, 'Hora requerida'),
  duration: z.coerce.number().min(1, 'Duración mínima 1 min'),
  maxCapacity: z.coerce.number().min(1, 'Capacidad mínima 1'),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

export const ClassesPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ClassStatus | ''>('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassResponse | null>(null);
  const [cancellingClass, setCancellingClass] = useState<ClassResponse | null>(null);
  const [enrollingClass, setEnrollingClass] = useState<ClassResponse | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // Details drawer/modals
  const [viewingEnrollmentsClassId, setViewingEnrollmentsClassId] = useState<number | null>(null);
  const [viewingRatingsClassId, setViewingRatingsClassId] = useState<number | null>(null);

  // Queries
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', page, statusFilter],
    queryFn: () =>
      classService.getAll({
        page,
        size: 9,
        status: statusFilter || undefined,
        sortBy: 'schedule',
        sortDirection: 'asc',
      }),
  });

  const { data: classTypes } = useQuery<ClassTypeResponse[]>({
    queryKey: ['class-types'],
    queryFn: () => classService.getTypes(),
  });

  const { data: trainersData } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => userService.getAll({ page: 0, size: 50 }),
    enabled: isAdminOrRecep,
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isAdminOrRecep,
  });

  // Class Enrollments query
  const { data: classEnrollments, isLoading: loadingEnrollments } = useQuery<ClassEnrollmentResponse[]>({
    queryKey: ['class-enrollments', viewingEnrollmentsClassId],
    queryFn: () => classService.getClassEnrollments(viewingEnrollmentsClassId!),
    enabled: !!viewingEnrollmentsClassId,
  });

  // Class Waitlist query
  const { data: classWaitlist } = useQuery<WaitlistResponse[]>({
    queryKey: ['class-waitlist', viewingEnrollmentsClassId],
    queryFn: () => classService.getClassWaitlist(viewingEnrollmentsClassId!),
    enabled: !!viewingEnrollmentsClassId,
  });

  // Class Ratings query
  const { data: classRatings, isLoading: loadingRatings } = useQuery<ClassRatingResponse[]>({
    queryKey: ['class-ratings', viewingRatingsClassId],
    queryFn: () => classService.getClassRatings(viewingRatingsClassId!),
    enabled: !!viewingRatingsClassId,
  });

  // Create Form
  const createForm = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      branchId: 1,
      classTypeId: 1,
      trainerId: '',
      scheduleDate: new Date().toISOString().split('T')[0],
      scheduleTime: '08:00',
      duration: 60,
      maxCapacity: 20,
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateClassRequest) => classService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Clase programada exitosamente');
    },
  });

  // Cancel Class Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => classService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setCancellingClass(null);
      toast.success('Clase cancelada');
    },
  });

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: (data: CreateEnrollmentRequest) => classService.enroll(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEnrollingClass(null);
      setSelectedMemberId('');
      toast.success(`Inscripción confirmada (${res.status})`);
    },
  });

  const onCreateSubmit = (data: CreateClassFormData) => {
    // Construct ISO string from date and time
    const isoSchedule = new Date(`${data.scheduleDate}T${data.scheduleTime}:00Z`).toISOString();
    createMutation.mutate({
      branchId: data.branchId,
      classTypeId: data.classTypeId,
      trainerId: data.trainerId,
      schedule: isoSchedule,
      duration: data.duration,
      maxCapacity: data.maxCapacity,
    });
  };

  const trainers = (trainersData?.content || []).filter(
    (u) => u.roleName === 'ENTRENADOR' || u.roleName === 'ADMIN'
  );

  const classes = classesData?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Programación de Clases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sesiones grupales, entrenamientos funcionales, cupos y reservas.
          </p>
        </div>
        {isAdminOrRecep && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Programar Clase</span>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClassStatus | '')}
              className="w-full sm:w-56"
            >
              <option value="">Todas las Clases</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="IN_PROGRESS">En Curso</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            Total en catálogo: {classesData?.totalElements ?? 0}
          </span>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No hay clases programadas"
          description="Aún no se han calendarizado sesiones en el sistema o no coinciden con el filtro."
          actionText={isAdminOrRecep ? 'Programar Primera Clase' : undefined}
          onAction={isAdminOrRecep ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const capacityRatio = Math.min(
              100,
              Math.round((cls.enrolledCount / cls.maxCapacity) * 100)
            );
            const isFull = cls.availableSpots <= 0;

            return (
              <Card
                key={cls.id}
                className="flex flex-col justify-between border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {cls.classTypeName}
                      </span>
                      <StatusBadge status={cls.status} />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground mt-2">
                      {cls.classTypeName}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Instructor: <span className="font-semibold text-foreground">{cls.trainerName}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          Horario:
                        </span>
                        <span className="font-medium text-foreground">
                          {formatDateTime(cls.schedule)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          Duración:
                        </span>
                        <span className="font-medium text-foreground">
                          {cls.duration} minutos
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                          Calificación:
                        </span>
                        <span className="font-bold text-foreground">
                          {cls.averageRating ? `${cls.averageRating.toFixed(1)} / 5.0` : 'Sin calificaciones'}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Ocupación:</span>
                        <span className="font-semibold text-foreground">
                          {cls.enrolledCount} / {cls.maxCapacity} ({capacityRatio}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFull ? 'bg-amber-500' : 'bg-primary'
                          }`}
                          style={{ width: `${capacityRatio}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{cls.availableSpots} lugares libres</span>
                        {cls.waitlistCount > 0 && (
                          <span className="text-amber-400 font-medium">
                            {cls.waitlistCount} en espera
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingEnrollmentsClassId(cls.id)}
                      title="Ver inscritos y lista de espera"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingRatingsClassId(cls.id)}
                      title="Ver comentarios y calificaciones"
                    >
                      <Star className="h-4 w-4 text-amber-400" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {cls.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEnrollingClass(cls);
                          setSelectedMemberId('');
                        }}
                        className="h-8 text-xs"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        {isFull ? 'Lista de espera' : 'Inscribir'}
                      </Button>
                    )}

                    {isAdminOrRecep && cls.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => setCancellingClass(cls)}
                        title="Cancelar clase"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {classesData && classesData.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Página {classesData.page + 1} de {classesData.totalPages}
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
              disabled={page >= classesData.totalPages - 1}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Schedule Class */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Programar Nueva Clase"
        description="Selecciona la disciplina, instructor, horario y aforo máximo."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Tipo / Disciplina de Clase</Label>
            <Select
              error={createForm.formState.errors.classTypeId?.message}
              {...createForm.register('classTypeId')}
            >
              <option value="">Selecciona una disciplina...</option>
              {classTypes?.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Instructor / Entrenador</Label>
            <Select
              error={createForm.formState.errors.trainerId?.message}
              {...createForm.register('trainerId')}
            >
              <option value="">Selecciona un instructor...</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} (@{t.username})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fecha</Label>
              <Input
                type="date"
                error={createForm.formState.errors.scheduleDate?.message}
                {...createForm.register('scheduleDate')}
              />
            </div>
            <div>
              <Label required>Hora</Label>
              <Input
                type="time"
                error={createForm.formState.errors.scheduleTime?.message}
                {...createForm.register('scheduleTime')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Duración (minutos)</Label>
              <Input
                type="number"
                min="1"
                placeholder="60"
                error={createForm.formState.errors.duration?.message}
                {...createForm.register('duration')}
              />
            </div>
            <div>
              <Label required>Cupo Máximo</Label>
              <Input
                type="number"
                min="1"
                placeholder="20"
                error={createForm.formState.errors.maxCapacity?.message}
                {...createForm.register('maxCapacity')}
              />
            </div>
          </div>

          <div>
            <Label required>Sucursal</Label>
            <Select {...createForm.register('branchId')}>
              <option value={1}>Sede Central (ID: 1)</option>
              <option value={2}>Sede Norte (ID: 2)</option>
              <option value={3}>Sede Sur (ID: 3)</option>
              <option value={4}>Sede Poniente (ID: 4)</option>
            </Select>
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
              Programar Sesión
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Enroll Member into Class */}
      <Modal
        isOpen={!!enrollingClass}
        onClose={() => setEnrollingClass(null)}
        title="Inscripción a Clase"
        description={`Clase: ${enrollingClass?.classTypeName} (${formatDateTime(enrollingClass?.schedule)}).`}
      >
        <div className="space-y-4 py-2">
          {isAdminOrRecep ? (
            <div>
              <Label required>Selecciona el Socio a Inscribir</Label>
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">Selecciona un socio registrado...</option>
                {membersData?.content?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} (@{m.username})
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <p className="text-sm text-foreground">
              ¿Deseas confirmar tu inscripción a esta sesión de entrenamiento?
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setEnrollingClass(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (enrollingClass) {
                  enrollMutation.mutate({
                    classId: enrollingClass.id,
                    memberId: isAdminOrRecep ? selectedMemberId || undefined : undefined,
                  });
                }
              }}
              isLoading={enrollMutation.isPending}
              disabled={isAdminOrRecep && !selectedMemberId}
            >
              Confirmar Inscripción
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Enrollments & Waitlist */}
      <Modal
        isOpen={!!viewingEnrollmentsClassId}
        onClose={() => setViewingEnrollmentsClassId(null)}
        title="Inscripciones y Lista de Espera"
        description="Socios registrados para esta clase deportiva."
        maxWidth="lg"
      >
        <div className="space-y-6 py-2">
          {loadingEnrollments ? (
            <TableSkeleton rows={3} columns={3} />
          ) : (
            <>
              {/* Active Enrollments */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Socios Inscritos ({classEnrollments?.length || 0})
                </h4>
                {!classEnrollments || classEnrollments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No hay socios inscritos en esta clase aún.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classEnrollments.map((enr) => (
                      <div
                        key={enr.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{enr.memberName}</p>
                          <p className="text-muted-foreground">{enr.memberEmail}</p>
                        </div>
                        <StatusBadge status={enr.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Waitlist */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  En Lista de Espera ({classWaitlist?.length || 0})
                </h4>
                {!classWaitlist || classWaitlist.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Sin socios en lista de espera.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classWaitlist.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{w.memberName}</p>
                          <p className="text-muted-foreground">{w.memberEmail}</p>
                        </div>
                        <span className="text-amber-400 font-mono">
                          Registrado: {formatDate(w.registrationDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setViewingEnrollmentsClassId(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Class Ratings */}
      <Modal
        isOpen={!!viewingRatingsClassId}
        onClose={() => setViewingRatingsClassId(null)}
        title="Calificaciones y Retroalimentación"
        description="Opiniones enviadas por los socios que asistieron a esta clase."
        maxWidth="md"
      >
        <div className="py-2">
          {loadingRatings ? (
            <TableSkeleton rows={3} columns={3} />
          ) : !classRatings || classRatings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no se han recibido calificaciones para esta sesión.
            </p>
          ) : (
            <div className="space-y-3">
              {classRatings.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{r.memberName}</span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{r.rating} / 5</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-muted-foreground italic">"{r.comment}"</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(r.dateTime)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setViewingRatingsClassId(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Cancel Class Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingClass}
        onClose={() => setCancellingClass(null)}
        onConfirm={() => cancellingClass && cancelMutation.mutate(cancellingClass.id)}
        title="Cancelar Clase Programada"
        message={`¿Estás seguro de que deseas cancelar la sesión de "${cancellingClass?.classTypeName}" (${formatDateTime(cancellingClass?.schedule)})? Los socios inscritos serán notificados.`}
        confirmText="Confirmar Cancelación"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
