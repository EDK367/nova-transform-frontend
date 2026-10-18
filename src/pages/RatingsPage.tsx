import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classService } from '@/services/class.service';
import { ClassEnrollmentResponse, ClassRatingResponse, CreateClassRatingRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDateTime, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Star, MessageSquarePlus, CalendarDays, Award } from 'lucide-react';

const ratingSchema = z.object({
  enrollmentId: z.coerce.number().min(1, 'Selecciona una inscripción'),
  rating: z.coerce.number().min(1, 'Calificación mínima es 1').max(5, 'Calificación máxima es 5'),
  comment: z.string().optional(),
});

type RatingFormData = z.infer<typeof ratingSchema>;

export const RatingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isRateOpen, setIsRateOpen] = useState(false);

  // Query classes to filter ratings
  const { data: classesData } = useQuery({
    queryKey: ['classes-rating-filter'],
    queryFn: () => classService.getAll({ page: 0, size: 50 }),
  });

  // Query ratings for selected class, or default to first class in list
  const activeClassId = selectedClassId || classesData?.content?.[0]?.id;

  const { data: ratings, isLoading } = useQuery<ClassRatingResponse[]>({
    queryKey: ['class-ratings', activeClassId],
    queryFn: () => (activeClassId ? classService.getClassRatings(activeClassId) : Promise.resolve([])),
    enabled: !!activeClassId,
  });

  // Query my enrollments if client wants to rate
  const { data: myEnrollments } = useQuery<ClassEnrollmentResponse[]>({
    queryKey: ['my-enrollments-to-rate'],
    queryFn: () => classService.getMyEnrollments(),
    enabled: isClient && isRateOpen,
  });

  const rateForm = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });

  const rateMutation = useMutation({
    mutationFn: (data: CreateClassRatingRequest) => classService.createRating(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsRateOpen(false);
      rateForm.reset();
      toast.success('¡Gracias por calificar tu entrenamiento!');
    },
  });

  const onRateSubmit = (data: RatingFormData) => {
    rateMutation.mutate({
      enrollmentId: data.enrollmentId,
      rating: data.rating,
      comment: data.comment || undefined,
    });
  };

  const selectedClass = classesData?.content?.find((c) => c.id === activeClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Calificaciones y Reseñas de Clases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evaluación de desempeño, retroalimentación y calidad técnica de los entrenamientos.
          </p>
        </div>
        {isClient && (
          <Button onClick={() => setIsRateOpen(true)} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            <span>Calificar una Clase</span>
          </Button>
        )}
      </div>

      {/* Class Selector Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <Label>Filtrar por Clase:</Label>
              <Select
                value={activeClassId || ''}
                onChange={(e) => setSelectedClassId(Number(e.target.value) || null)}
              >
                {classesData?.content?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.classTypeName} - {c.trainerName} ({formatDateTime(c.schedule)})
                  </option>
                ))}
              </Select>
            </div>

            {selectedClass && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border self-stretch sm:self-auto">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Promedio de Clase:</p>
                  <p className="text-base font-extrabold text-foreground">
                    {selectedClass.averageRating
                      ? `${selectedClass.averageRating.toFixed(1)} / 5.0`
                      : 'Sin calificar'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ratings List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Comentarios de los Socios</CardTitle>
          <CardDescription>
            {selectedClass ? `${selectedClass.classTypeName} con ${selectedClass.trainerName}` : 'Reseñas'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <TableSkeleton rows={4} columns={3} />
          ) : !ratings || ratings.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No hay calificaciones para esta clase"
              description="Aún ningún socio ha compartido su opinión sobre esta sesión."
              actionText={isClient ? 'Calificar esta Clase' : undefined}
              onAction={isClient ? () => setIsRateOpen(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{r.memberName}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-foreground/90 italic">"{r.comment}"</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin comentario adicional.</p>
                  )}
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    Fecha de reseña: {formatDate(r.dateTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Client Rate Class */}
      <Modal
        isOpen={isRateOpen}
        onClose={() => setIsRateOpen(false)}
        title="Calificar Entrenamiento"
        description="Comparte tu experiencia para ayudar a mejorar la calidad de las clases."
      >
        <form onSubmit={rateForm.handleSubmit(onRateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Selecciona la Clase a la que Asististe</Label>
            <Select
              error={rateForm.formState.errors.enrollmentId?.message}
              {...rateForm.register('enrollmentId')}
            >
              <option value="">Selecciona tu inscripción...</option>
              {myEnrollments?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.classTypeName} - {formatDateTime(e.classSchedule)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Calificación (1 a 5 Estrellas)</Label>
            <Select {...rateForm.register('rating')}>
              <option value={5}>⭐⭐⭐⭐⭐ (5 - Excelente entrenamiento)</option>
              <option value={4}>⭐⭐⭐⭐ (4 - Muy bueno)</option>
              <option value={3}>⭐⭐⭐ (3 - Bueno)</option>
              <option value={2}>⭐⭐ (2 - Regular)</option>
              <option value={1}>⭐ (1 - Malo)</option>
            </Select>
          </div>

          <div>
            <Label>Comentarios u Observaciones</Label>
            <Textarea
              placeholder="¿Qué tal estuvo la intensidad, técnica, música y ritmo del entrenador?..."
              {...rateForm.register('comment')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRateOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={rateMutation.isPending}>
              Enviar Calificación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
