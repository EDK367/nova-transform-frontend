import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { reportService } from '@/services/report.service';
import { memberService } from '@/services/member.service';
import { AttendanceResponse, CreateAttendanceRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Clock,
  LogIn,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle,
  Download,
} from 'lucide-react';

const checkInSchema = z.object({
  branchId: z.coerce.number().min(1, 'Selecciona una sucursal'),
  memberId: z.string().min(1, 'Selecciona un socio'),
  date: z.string().optional(),
  entryTime: z.string().optional(),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

export const AttendancesPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkoutAttendance, setCheckoutAttendance] = useState<AttendanceResponse | null>(null);
  const [customExitTime, setCustomExitTime] = useState<string>('');

  // Queries
  const { data: attendancesData, isLoading } = useQuery({
    queryKey: ['attendances', page, selectedDate],
    queryFn: () =>
      isAdminOrRecep
        ? attendanceService.getAll({
            page,
            size: 10,
            date: selectedDate || undefined,
            sortBy: 'date',
            sortDirection: 'desc',
          })
        : attendanceService.getMy().then((data) => ({
            content: data,
            page: 0,
            size: data.length,
            totalElements: data.length,
            totalPages: 1,
          })),
  });

  const { data: membersList } = useQuery({
    queryKey: ['members-select'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isAdminOrRecep,
  });

  // Check-In Form
  const now = new Date();
  const currentTime = now.toTimeString().substring(0, 5);
  const todayStr = now.toISOString().split('T')[0];

  const checkInForm = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      branchId: user?.branchId || 1,
      memberId: '',
      date: todayStr,
      entryTime: currentTime,
    },
  });

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (data: CreateAttendanceRequest) => attendanceService.checkIn(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      setIsCheckInOpen(false);
      checkInForm.reset();
      toast.success(`Entrada registrada para ${res.memberName} a las ${formatTime(res.entryTime)}`);
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: ({ id, exitTime }: { id: number; exitTime?: string }) =>
      attendanceService.checkOut(id, exitTime ? { exitTime } : {}),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      setCheckoutAttendance(null);
      toast.success(`Salida registrada para ${res.memberName} a las ${formatTime(res.exitTime)}`);
    },
  });

  const onCheckInSubmit = (data: CheckInFormData) => {
    checkInMutation.mutate({
      branchId: data.branchId,
      memberId: data.memberId,
      date: data.date || todayStr,
      entryTime: data.entryTime ? `${data.entryTime}:00` : `${currentTime}:00`,
    });
  };

  const handleCheckoutNow = (att: AttendanceResponse) => {
    const curTime = new Date().toTimeString().substring(0, 8);
    checkOutMutation.mutate({ id: att.id, exitTime: curTime });
  };

  const handleDownloadReportPdf = async () => {
    try {
      const blob = await reportService.downloadAttendanceReportPdf({
        date: selectedDate || undefined,
      } as any);
      reportService.triggerDownload(blob, 'reporte-asistencias.pdf');
      toast.success('Reporte de asistencias descargado');
    } catch {
      toast.error('Error al descargar reporte de asistencias');
    }
  };

  const attendances = attendancesData?.content || [];
  const filteredAttendances = attendances.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      a.memberName?.toLowerCase().includes(q) ||
      a.memberEmail?.toLowerCase().includes(q) ||
      a.branchName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isClient ? 'Mis Registros de Asistencia' : 'Control de Asistencias (Check-In / Out)'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? 'Historial de tus ingresos y tiempo de entrenamiento en las instalaciones.'
              : 'Registro en tiempo real de entradas y salidas de socios en torniquetes y recepción.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadReportPdf}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Reporte PDF</span>
          </Button>
          {isAdminOrRecep && (
            <Button onClick={() => setIsCheckInOpen(true)} className="gap-2">
              <LogIn className="h-4 w-4" />
              <span>Registrar Entrada (Check-In)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de socio o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {isAdminOrRecep && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-44"
              />
              {selectedDate && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedDate('')}
                  className="text-xs"
                >
                  Limpiar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Bitácora de Accesos</CardTitle>
          <CardDescription>
            Total: {attendancesData?.totalElements ?? 0} registros
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredAttendances.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No hay asistencias registradas"
              description="No se han registrado ingresos para el día o filtro seleccionado."
              actionText={isAdminOrRecep ? 'Registrar Primera Entrada' : undefined}
              onAction={isAdminOrRecep ? () => setIsCheckInOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Socio</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Entrada</th>
                    <th className="py-3 px-4">Salida</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Estado</th>
                    {isAdminOrRecep && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAttendances.map((att) => {
                    const isInGym = !att.exitTime;
                    return (
                      <tr key={att.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                          #{att.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{att.memberName}</p>
                          <p className="text-xs text-muted-foreground">{att.memberEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {formatDate(att.date)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono font-bold text-emerald-400">
                          {formatTime(att.entryTime)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono">
                          {att.exitTime ? (
                            <span className="font-bold text-slate-300">
                              {formatTime(att.exitTime)}
                            </span>
                          ) : (
                            <span className="text-amber-400 italic">En instalación</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {att.branchName || `Sede #${att.branchId}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isInGym ? 'warning' : 'default'}>
                            {isInGym ? 'En Gimnasio' : 'Finalizada'}
                          </Badge>
                        </td>
                        {isAdminOrRecep && (
                          <td className="py-3.5 px-4 text-right">
                            {isInGym ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckoutNow(att)}
                                isLoading={checkOutMutation.isPending}
                                className="h-8 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                title="Marcar salida en este momento"
                              >
                                <LogOut className="h-3.5 w-3.5 mr-1" />
                                Check-Out
                              </Button>
                            ) : (
                              <span className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Salida ok
                              </span>
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

          {/* Pagination */}
          {attendancesData && attendancesData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {attendancesData.page + 1} de {attendancesData.totalPages}
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
                  disabled={page >= attendancesData.totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Check-In */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Registrar Entrada (Check-In)"
        description="Registra el ingreso de un socio a las instalaciones del gimnasio."
      >
        <form onSubmit={checkInForm.handleSubmit(onCheckInSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Socio</Label>
            <Select
              error={checkInForm.formState.errors.memberId?.message}
              {...checkInForm.register('memberId')}
            >
              <option value="">Selecciona al socio que ingresa...</option>
              {membersList?.content?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} (@{m.username})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fecha</Label>
              <Input
                type="date"
                error={checkInForm.formState.errors.date?.message}
                {...checkInForm.register('date')}
              />
            </div>
            <div>
              <Label required>Hora de Entrada</Label>
              <Input
                type="time"
                error={checkInForm.formState.errors.entryTime?.message}
                {...checkInForm.register('entryTime')}
              />
            </div>
          </div>

          <div>
            <Label required>Sucursal</Label>
            <Select {...checkInForm.register('branchId')}>
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
              onClick={() => setIsCheckInOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={checkInMutation.isPending}>
              Registrar Entrada
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
