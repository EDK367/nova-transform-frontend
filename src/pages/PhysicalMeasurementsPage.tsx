import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { physicalMeasurementService } from '@/services/physical-measurement.service';
import { memberService } from '@/services/member.service';
import { trainerService } from '@/services/trainer.service';
import {
  CreatePhysicalMeasurementRequest,
  PhysicalMeasurementResponse,
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
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Activity,
  Plus,
  Search,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const measurementSchema = z.object({
  memberId: z.string().min(1, 'Selecciona un socio'),
  measurementDate: z.string().min(1, 'Fecha requerida'),
  measuredByTrainerId: z.string().optional(),
  weightKg: z.coerce.number().min(20).max(300).optional(),
  heightCm: z.coerce.number().min(50).max(250).optional(),
  bodyFatPercentage: z.coerce.number().min(3).max(60).optional(),
  muscleMassKg: z.coerce.number().min(10).max(150).optional(),
  chestCm: z.coerce.number().min(20).max(200).optional(),
  waistCm: z.coerce.number().min(20).max(200).optional(),
  hipsCm: z.coerce.number().min(20).max(200).optional(),
  armCm: z.coerce.number().min(10).max(80).optional(),
  thighCm: z.coerce.number().min(10).max(120).optional(),
  notes: z.string().optional(),
});

type MeasurementFormData = z.infer<typeof measurementSchema>;

export const PhysicalMeasurementsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrTrainer = hasRole('ADMIN', 'ENTRENADOR');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingMeasurement, setDeletingMeasurement] = useState<PhysicalMeasurementResponse | null>(null);

  const { data: measurementsData, isLoading } = useQuery({
    queryKey: ['physical-measurements', page],
    queryFn: () =>
      physicalMeasurementService.getAll({
        page,
        size: 15,
        memberId: isClient ? user?.id : undefined,
        sortBy: 'measurementDate',
        sortDirection: 'desc',
      }),
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-select-measurements'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen && !isClient,
  });

  const { data: trainersData } = useQuery({
    queryKey: ['trainers-select-measurements'],
    queryFn: () => trainerService.getAll({ page: 0, size: 100 }),
    enabled: isModalOpen,
  });

  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      memberId: isClient ? user?.id || '' : '',
      measurementDate: new Date().toISOString().split('T')[0],
      weightKg: 75,
      heightCm: 175,
      bodyFatPercentage: 18,
      muscleMassKg: 35,
      waistCm: 82,
      chestCm: 98,
      notes: '',
    },
  });

  const openCreateModal = () => {
    form.reset({
      memberId: isClient ? user?.id || '' : '',
      measurementDate: new Date().toISOString().split('T')[0],
      weightKg: 75,
      heightCm: 175,
      bodyFatPercentage: 18,
      muscleMassKg: 35,
      waistCm: 82,
      chestCm: 98,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: MeasurementFormData) => {
      const payload: CreatePhysicalMeasurementRequest = {
        memberId: data.memberId,
        measurementDate: data.measurementDate,
        measuredByTrainerId: data.measuredByTrainerId || undefined,
        weightKg: data.weightKg || undefined,
        heightCm: data.heightCm || undefined,
        bodyFatPercentage: data.bodyFatPercentage || undefined,
        muscleMassKg: data.muscleMassKg || undefined,
        chestCm: data.chestCm || undefined,
        waistCm: data.waistCm || undefined,
        hipsCm: data.hipsCm || undefined,
        armCm: data.armCm || undefined,
        thighCm: data.thighCm || undefined,
        notes: data.notes || undefined,
      };
      return physicalMeasurementService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-measurements'] });
      setIsModalOpen(false);
      toast.success('Medición antropométrica guardada con éxito');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => physicalMeasurementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-measurements'] });
      setDeletingMeasurement(null);
      toast.success('Medición eliminada');
    },
  });

  const measurements = measurementsData?.content || [];
  const filtered = measurements.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      (m.memberName && m.memberName.toLowerCase().includes(q)) ||
      (m.trainerName && m.trainerName.toLowerCase().includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    );
  });

  const chartData = [...measurements]
    .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
    .map((m) => ({
      date: formatDate(m.measurementDate),
      peso: m.weightKg || 0,
      grasa: m.bodyFatPercentage || 0,
      musculo: m.muscleMassKg || 0,
    }));

  const members = membersData?.content || [];
  const trainers = trainersData?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Medidas Físicas y Antropometría
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evolución corporal: peso, porcentaje de grasa, masa muscular y circunferencias.
          </p>
        </div>
        {isAdminOrTrainer && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Medición</span>
          </Button>
        )}
      </div>

      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Gráfica de Evolución Corporal</CardTitle>
            <CardDescription>Progreso histórico de peso (kg) vs grasa corporal (%)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} name="Peso (kg)" />
                <Line type="monotone" dataKey="grasa" stroke="#f59e0b" strokeWidth={2} name="% Grasa" />
                <Line type="monotone" dataKey="musculo" stroke="#3b82f6" strokeWidth={2} name="Masa Muscular (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por socio, evaluador o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Historial de Evaluaciones</CardTitle>
          <CardDescription>
            Total: {measurementsData?.totalElements ?? 0} mediciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No hay mediciones registradas"
              description="Aún no se han asentado evaluaciones antropométricas con los filtros dados."
              actionText={isAdminOrTrainer ? 'Registrar Primera Medición' : undefined}
              onAction={isAdminOrTrainer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Socio</th>
                    <th className="py-3 px-4">Peso</th>
                    <th className="py-3 px-4">% Grasa</th>
                    <th className="py-3 px-4">Masa Muscular</th>
                    <th className="py-3 px-4">Cintura / Cadera</th>
                    <th className="py-3 px-4">Evaluador</th>
                    {isAdminOrTrainer && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y border-border/60">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(m.measurementDate)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {m.memberName || 'Socio'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {m.weightKg != null ? `${m.weightKg} kg` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        {m.bodyFatPercentage != null ? `${m.bodyFatPercentage}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-400">
                        {m.muscleMassKg != null ? `${m.muscleMassKg} kg` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {m.waistCm ? `${m.waistCm} cm` : '-'} / {m.hipsCm ? `${m.hipsCm} cm` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {m.trainerName || 'Entrenador'}
                      </td>
                      {isAdminOrTrainer && (
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeletingMeasurement(m)}
                            title="Eliminar medición"
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

          {measurementsData && measurementsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {measurementsData.totalPages}
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
                  disabled={page >= measurementsData.totalPages - 1}
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
        title="Nueva Evaluación Antropométrica"
      >
        <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {!isClient && (
            <div>
              <Label required>Socio Evaluado</Label>
              <Select {...form.register('memberId')}>
                <option value="">Selecciona socio...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} (@{m.username})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fecha de Medición</Label>
              <Input type="date" {...form.register('measurementDate')} />
            </div>
            <div>
              <Label>Entrenador Evaluador</Label>
              <Select {...form.register('measuredByTrainerId')}>
                <option value="">Selecciona entrenador...</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" {...form.register('weightKg')} />
            </div>
            <div>
              <Label>Estatura (cm)</Label>
              <Input type="number" step="0.5" {...form.register('heightCm')} />
            </div>
            <div>
              <Label>% Grasa</Label>
              <Input type="number" step="0.1" {...form.register('bodyFatPercentage')} />
            </div>
            <div>
              <Label>Músculo (kg)</Label>
              <Input type="number" step="0.1" {...form.register('muscleMassKg')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cintura (cm)</Label>
              <Input type="number" step="0.5" {...form.register('waistCm')} />
            </div>
            <div>
              <Label>Cadera (cm)</Label>
              <Input type="number" step="0.5" {...form.register('hipsCm')} />
            </div>
            <div>
              <Label>Pecho (cm)</Label>
              <Input type="number" step="0.5" {...form.register('chestCm')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Brazo (cm)</Label>
              <Input type="number" step="0.5" {...form.register('armCm')} />
            </div>
            <div>
              <Label>Muslo (cm)</Label>
              <Input type="number" step="0.5" {...form.register('thighCm')} />
            </div>
          </div>

          <div>
            <Label>Notas / Observaciones del Evaluador</Label>
            <Textarea
              placeholder="Postura adecuada, simetría muscular, recomendaciones nutricionales..."
              {...form.register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Guardar Medición
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingMeasurement}
        onClose={() => setDeletingMeasurement(null)}
        onConfirm={() => deletingMeasurement && deleteMutation.mutate(deletingMeasurement.id)}
        title="Eliminar Medición"
        message="¿Estás seguro de que deseas eliminar este registro de evaluación física?"
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
