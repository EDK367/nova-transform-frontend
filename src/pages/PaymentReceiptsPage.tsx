import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { PaymentReceiptResponse } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Receipt, Search, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export const PaymentReceiptsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: receiptsData, isLoading } = useQuery({
    queryKey: ['payment-receipts', page],
    queryFn: () =>
      invoiceService.getReceipts({
        page,
        size: 10,
        sortBy: 'paymentDate',
        sortDirection: 'desc',
      }),
  });

  const receipts = receiptsData?.content || [];
  const filteredReceipts = receipts.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      String(r.id).includes(q) ||
      String(r.invoiceId).includes(q) ||
      r.paymentMethodName?.toLowerCase().includes(q) ||
      r.reference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Comprobantes de Pago
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro inmutable de recibos y transacciones emitidas para liquidación de facturas.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio de comprobante, factura vinculada o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>
            Total: {receiptsData?.totalElements ?? 0} comprobantes emitidos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredReceipts.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No hay comprobantes de pago registrados"
              description="Los recibos se emiten automáticamente al aplicar cobros a facturas."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-4">Folio Recibo</th>
                    <th className="py-3 px-4">Factura Vinculada</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Referencia / Banco</th>
                    <th className="py-3 px-4">Monto Liquidado</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        REC-{r.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-primary font-semibold">
                        Factura #{r.invoiceId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {r.paymentMethodName || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                        {r.reference || 'Sin referencia'}
                      </td>
                      <td className="py-3.5 px-4 text-base font-extrabold text-emerald-400">
                        {formatCurrency(r.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {formatDateTime(r.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Aplicado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {receiptsData && receiptsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {receiptsData.page + 1} de {receiptsData.totalPages}
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
                  disabled={page >= receiptsData.totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
