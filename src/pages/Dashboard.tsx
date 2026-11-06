import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { memberService } from '@/services/member.service';
import { membershipService } from '@/services/membership.service';
import { classService } from '@/services/class.service';
import { attendanceService } from '@/services/attendance.service';
import { invoiceService } from '@/services/invoice.service';
import { StatsCard } from '@/components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  CreditCard,
  CalendarDays,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { AttendanceResponse, InvoiceResponse, PageResponse } from '@/types';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isClient = hasRole('CLIENTE');

  // Admin / Receptionist queries
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ['dashboard', 'members'],
    queryFn: () => memberService.getAll({ page: 0, size: 10 }),
    enabled: isAdminOrRecep,
  });

  const { data: membershipsData, isLoading: loadingMemberships } = useQuery({
    queryKey: ['dashboard', 'memberships'],
    queryFn: () => membershipService.getAll({ page: 0, size: 50 }),
    enabled: isAdminOrRecep,
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['dashboard', 'classes'],
    queryFn: () => classService.getAll({ page: 0, size: 20 }),
    enabled: true,
  });

  // Attendance: admin/recep/trainer get paginated, client gets array — use two separate queries
  const { data: attendancesPageData } = useQuery<PageResponse<AttendanceResponse>>({
    queryKey: ['dashboard', 'attendances', 'paged'],
    queryFn: () => attendanceService.getAll({ page: 0, size: 20 }),
    enabled: !isClient,
  });

  const { data: myAttendancesData } = useQuery<AttendanceResponse[]>({
    queryKey: ['dashboard', 'attendances', 'my'],
    queryFn: () => attendanceService.getMy(),
    enabled: isClient,
  });

  // Invoices: only for admin/recep
  const { data: invoicesPageData, isLoading: loadingInvoices } = useQuery<PageResponse<InvoiceResponse>>({
    queryKey: ['dashboard', 'invoices', 'paged'],
    queryFn: () => invoiceService.getAll({ page: 0, size: 20 }),
    enabled: isAdminOrRecep,
  });

  // Client specific queries
  const { data: myEnrollments } = useQuery({
    queryKey: ['dashboard', 'myEnrollments'],
    queryFn: () => classService.getMyEnrollments(),
    enabled: isClient,
  });

  // Compute metrics from real data
  const totalMembers = membersData?.totalElements ?? 0;

  const membershipList = membershipsData?.content ?? [];
  const activeMemberships = membershipList.filter((m) => m.status === 'ACTIVE').length;
  const frozenMemberships = membershipList.filter((m) => m.status === 'FROZEN').length;
  const cancelledMemberships = membershipList.filter((m) => m.status === 'CANCELLED').length;
  const expiredMemberships = membershipList.filter((m) => m.status === 'EXPIRED').length;

  const classList = classesData?.content ?? [];
  const scheduledClasses = classList.filter((c) => c.status === 'SCHEDULED').length;
  const inProgressClasses = classList.filter((c) => c.status === 'IN_PROGRESS').length;

  const attendanceCount = !isClient
    ? (attendancesPageData?.totalElements ?? 0)
    : (myAttendancesData?.length ?? 0);

  const invoiceList: InvoiceResponse[] = isAdminOrRecep
    ? (invoicesPageData?.content ?? [])
    : [];

  const totalCollected = invoiceList
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

  const totalPending = invoiceList
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID')
    .reduce((acc, curr) => acc + (Number(curr.balanceDue) || 0), 0);

  // Recharts data
  const membershipChartData = [
    { name: 'Activas', value: activeMemberships, color: '#10B981' },
    { name: 'Congeladas', value: frozenMemberships, color: '#F59E0B' },
    { name: 'Expiradas', value: expiredMemberships, color: '#EF4444' },
    { name: 'Canceladas', value: cancelledMemberships, color: '#64748B' },
  ].filter((item) => item.value > 0);

  const classesChartData = [
    { name: 'Programadas', cantidad: scheduledClasses },
    { name: 'En curso', cantidad: inProgressClasses },
    { name: 'Completadas', cantidad: classList.filter((c) => c.status === 'COMPLETED').length },
    { name: 'Canceladas', cantidad: classList.filter((c) => c.status === 'CANCELLED').length },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#111827] to-[#062e20] border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-premium">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Activity className="h-3.5 w-3.5" />
              <span>Panel Operativo en Vivo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAdminOrRecep
                ? 'Monitorea el rendimiento operativo, asistencias y membresías del gimnasio.'
                : isClient
                ? 'Accede al resumen de tus clases inscritas, entrenamientos y asistencias.'
                : 'Supervisa tus clases asignadas y el avance de los clientes.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {user?.roleName}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Section */}
      {isAdminOrRecep ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Clientes"
            value={loadingMembers ? '...' : totalMembers}
            subtitle="Clientes registrados en el sistema"
            icon={Users}
            color="emerald"
          />
          <StatsCard
            title="Membresías Activas"
            value={loadingMemberships ? '...' : activeMemberships}
            subtitle={`${frozenMemberships} membresías congeladas`}
            icon={CreditCard}
            color="blue"
          />
          <StatsCard
            title="Clases Disponibles"
            value={loadingClasses ? '...' : scheduledClasses}
            subtitle={`${inProgressClasses} clases en curso hoy`}
            icon={CalendarDays}
            color="purple"
          />
          <StatsCard
            title="Total Cobrado (Muestra)"
            value={loadingInvoices ? '...' : formatCurrency(totalCollected)}
            subtitle={`Pendiente: ${formatCurrency(totalPending)}`}
            icon={DollarSign}
            color="amber"
          />
        </div>
      ) : isClient ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            title="Mis Inscripciones"
            value={myEnrollments?.length ?? 0}
            subtitle="Clases programadas"
            icon={CalendarDays}
            color="blue"
          />
          <StatsCard
            title="Mis Asistencias"
            value={attendanceCount}
            subtitle="Entradas registradas"
            icon={Clock}
            color="purple"
          />
        </div>
      ) : (
        /* Entrenador */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            title="Clases Programadas"
            value={scheduledClasses}
            subtitle="En el catálogo actual"
            icon={CalendarDays}
            color="emerald"
          />
          <StatsCard
            title="Total Asistencias"
            value={attendanceCount}
            subtitle="Control general de accesos"
            icon={Clock}
            color="blue"
          />
        </div>
      )}

      {/* Real Charts Section (For Admins and Receptionists) */}
      {isAdminOrRecep && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Distribution of Memberships */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estado de Membresías</CardTitle>
                  <CardDescription>
                    Distribución actual de las membresías registradas
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {membershipChartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {membershipChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                        itemStyle={{
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                        labelStyle={{
                          color: '#FFFFFF',
                          fontWeight: 600,
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                  No hay datos suficientes de membresías para graficar.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Classes by Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estado de Clases</CardTitle>
                  <CardDescription>
                    Resumen de clases por estatus operativo
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {classList.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classesChartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                        }}
                      />
                      <Bar dataKey="cantidad" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                  No hay clases registradas en el backend actualmente.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity Table (Solo Administración y Recepción) */}
      {isAdminOrRecep && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Facturas y Movimientos Recientes</CardTitle>
                <CardDescription>
                  Últimos registros financieros consultados del backend
                </CardDescription>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
          </CardHeader>
          <CardContent>
            {invoiceList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">Folio</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Emisión</th>
                      <th className="py-3 px-4">Vencimiento</th>
                      <th className="py-3 px-4">Monto</th>
                      <th className="py-3 px-4">Pagado</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoiceList.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                          #{inv.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {inv.memberName || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                          {formatCurrency(inv.amountPaid)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No hay facturas registradas en la base de datos en este momento.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
