import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { membershipService } from '@/services/membership.service';
import {
  CreateInvoiceRequest,
  CreatePaymentReceiptRequest,
  InvoiceResponse,
  InvoiceStatus,
  PaymentMethodResponse,
  PaymentReceiptResponse,
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
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  CreditCard,
  XCircle,
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
} from 'lucide-react';

const createInvoiceSchema = z.object({
  membershipId: z.coerce.number().min(1, 'Selecciona una membresía'),
  branchId: z.coerce.number().min(1, 'Selecciona una sucursal'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  observation: z.string().optional(),
});

type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

const createPaymentSchema = z.object({
  paymentMethodId: z.coerce.number().min(1, 'Selecciona método de pago'),
  amountPaid: z.coerce.number().min(0.01, 'Monto debe ser mayor a 0'),
  reference: z.string().max(150).optional(),
});

type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

export const InvoicesPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isAdmin = hasRole('ADMIN');
  const isClient = hasRole('CLIENTE');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<InvoiceResponse | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<InvoiceResponse | null>(null);
  const [viewingPaymentsInvoiceId, setViewingPaymentsInvoiceId] = useState<number | null>(null);

  // Queries
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', page, statusFilter],
    queryFn: () =>
      isAdminOrRecep
        ? invoiceService.getAll({
            page,
            size: 10,
            status: statusFilter || undefined,
            sortBy: 'createdAt',
            sortDirection: 'desc',
          })
        : invoiceService.getMy().then((data) => ({
            content: data,
            page: 0,
            size: data.length,
            totalElements: data.length,
            totalPages: 1,
          })),
  });

  const { data: membershipsList } = useQuery({
    queryKey: ['memberships-select'],
    queryFn: () => membershipService.getAll({ page: 0, size: 50, status: 'ACTIVE' }),
    enabled: isCreateOpen,
  });

  const { data: paymentMethods } = useQuery<PaymentMethodResponse[]>({
    queryKey: ['payment-methods'],
    queryFn: () => invoiceService.getPaymentMethods(),
    enabled: !!payingInvoice,
  });

  const { data: invoicePayments, isLoading: loadingPayments } = useQuery<PaymentReceiptResponse[]>({
    queryKey: ['invoice-payments', viewingPaymentsInvoiceId],
    queryFn: () => invoiceService.getPayments(viewingPaymentsInvoiceId!),
    enabled: !!viewingPaymentsInvoiceId,
  });

  // Forms
  const createForm = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      membershipId: 1,
      branchId: user?.branchId || 1,
      amount: 599,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      observation: '',
    },
  });

  const paymentForm = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
  });

  // Create Invoice Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoiceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Factura generada exitosamente');
    },
  });

  // Cancel Invoice Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => invoiceService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setCancellingInvoice(null);
      toast.success('Factura cancelada por el administrador');
    },
  });

  // Create Payment Receipt Mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentReceiptRequest) => invoiceService.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPayingInvoice(null);
      paymentForm.reset();
      toast.success('Comprobante de pago registrado exitosamente');
    },
  });

  const onCreateSubmit = (data: CreateInvoiceFormData) => {
    createMutation.mutate({
      ...data,
      observation: data.observation || undefined,
    });
  };

  const onPaymentSubmit = (data: CreatePaymentFormData) => {
    if (!payingInvoice) return;
    createPaymentMutation.mutate({
      invoiceId: payingInvoice.id,
      paymentMethodId: data.paymentMethodId,
      amountPaid: data.amountPaid,
      reference: data.reference || undefined,
    });
  };

  const openPaymentModal = (inv: InvoiceResponse) => {
    setPayingInvoice(inv);
    paymentForm.reset({
      paymentMethodId: 1,
      amountPaid: inv.balanceDue,
      reference: '',
    });
  };

  const invoices = invoicesData?.content || [];
  const filteredInvoices = invoices.filter((i) => {
    const q = searchTerm.toLowerCase();
    return (
      i.memberName?.toLowerCase().includes(q) ||
      i.memberEmail?.toLowerCase().includes(q) ||
      i.branchName?.toLowerCase().includes(q) ||
      String(i.id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isClient ? 'Mis Facturas y Pagos' : 'Facturación y Cobranza'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? 'Consulta tus facturas emitidas, saldos pendientes y comprobantes aplicados.'
              : 'Emisión de facturas por membresía, control de cartera y registro de cobros.'}
          </p>
        </div>
        {isAdminOrRecep && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Emitir Factura</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio, socio o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {isAdminOrRecep && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
                className="w-full sm:w-44"
              >
                <option value="">Todos los Estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="PARTIALLY_PAID">Pago Parcial</option>
                <option value="PAID">Pagadas</option>
                <option value="CANCELLED">Canceladas</option>
                <option value="REFUNDED">Reembolsadas</option>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Facturas Emitidas</CardTitle>
          <CardDescription>
            Total: {invoicesData?.totalElements ?? 0} facturas en registro
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No hay facturas registradas"
              description="No se encontraron registros de cobro con los filtros actuales."
              actionText={isAdminOrRecep ? 'Emitir Primera Factura' : undefined}
              onAction={isAdminOrRecep ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Socio</th>
                    <th className="py-3 px-4">Plan / Concepto</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Pagado</th>
                    <th className="py-3 px-4">Saldo Pendiente</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        #{inv.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{inv.memberName}</p>
                        <p className="text-xs text-muted-foreground">{inv.memberEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {inv.planName || 'Membresía Gimnasio'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-emerald-400">
                        {formatCurrency(inv.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-amber-400">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingPaymentsInvoiceId(inv.id)}
                          title="Ver comprobantes de pago"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>

                        {isAdminOrRecep && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentModal(inv)}
                            className="h-8 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            title="Cobrar factura"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            Cobrar
                          </Button>
                        )}

                        {isAdmin && inv.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setCancellingInvoice(inv)}
                            title="Anular factura"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {invoicesData && invoicesData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {invoicesData.page + 1} de {invoicesData.totalPages}
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
                  disabled={page >= invoicesData.totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create Invoice */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Emitir Nueva Factura"
        description="Genera una factura de cobro asociada a una suscripción de membresía."
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Membresía a Facturar</Label>
            <Select
              error={createForm.formState.errors.membershipId?.message}
              {...createForm.register('membershipId')}
            >
              <option value="">Selecciona la membresía activa del socio...</option>
              {membershipsList?.content?.map((m) => (
                <option key={m.id} value={m.id}>
                  Folio #{m.id} - {m.memberName} ({m.planName})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Monto a Facturar ($ MXN)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="599.00"
                error={createForm.formState.errors.amount?.message}
                {...createForm.register('amount')}
              />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de Emisión</Label>
              <Input type="date" {...createForm.register('issueDate')} />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input type="date" {...createForm.register('dueDate')} />
            </div>
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea
              placeholder="Notas internas o aclaraciones del cobro..."
              {...createForm.register('observation')}
            />
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
              Emitir Factura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Register Payment (Cobrar Factura) */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title={`Cobro de Factura #${payingInvoice?.id}`}
        description={`Socio: ${payingInvoice?.memberName}. Saldo pendiente: ${formatCurrency(payingInvoice?.balanceDue)}`}
      >
        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4 py-2">
          <div>
            <Label required>Método de Pago</Label>
            <Select
              error={paymentForm.formState.errors.paymentMethodId?.message}
              {...paymentForm.register('paymentMethodId')}
            >
              {paymentMethods?.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Monto a Abonar ($ MXN)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              error={paymentForm.formState.errors.amountPaid?.message}
              {...paymentForm.register('amountPaid')}
            />
          </div>

          <div>
            <Label>Referencia / Comprobante Bancario</Label>
            <Input
              placeholder="ej. Autorización terminal #829103 o Transf SPEI"
              error={paymentForm.formState.errors.reference?.message}
              {...paymentForm.register('reference')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayingInvoice(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createPaymentMutation.isPending}>
              Registrar Cobro
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Payments attached to Invoice */}
      <Modal
        isOpen={!!viewingPaymentsInvoiceId}
        onClose={() => setViewingPaymentsInvoiceId(null)}
        title={`Comprobantes de Pago - Factura #${viewingPaymentsInvoiceId}`}
        description="Abonos y recibos vinculados a esta factura."
        maxWidth="md"
      >
        <div className="py-2">
          {loadingPayments ? (
            <TableSkeleton rows={3} columns={3} />
          ) : !invoicePayments || invoicePayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Esta factura no cuenta con pagos registrados todavía.
            </p>
          ) : (
            <div className="space-y-3">
              {invoicePayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-secondary/50 border border-border flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-foreground">
                      {p.paymentMethodName || 'Método registrado'}
                    </span>
                    {p.reference && (
                      <p className="text-muted-foreground font-mono mt-0.5">
                        Ref: {p.reference}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Fecha: {formatDate(p.paymentDate)}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {formatCurrency(p.amountPaid)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setViewingPaymentsInvoiceId(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Cancel Invoice Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingInvoice}
        onClose={() => setCancellingInvoice(null)}
        onConfirm={() => cancellingInvoice && cancelMutation.mutate(cancellingInvoice.id)}
        title="Cancelar Factura"
        message={`¿Estás seguro de que deseas anular y cancelar la Factura #${cancellingInvoice?.id} emitida a "${cancellingInvoice?.memberName}" por ${formatCurrency(cancellingInvoice?.amount)}?`}
        confirmText="Confirmar Anulación"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
