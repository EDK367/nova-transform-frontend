import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { memberService } from '@/services/member.service';
import { invoiceService } from '@/services/invoice.service';
import { branchService } from '@/services/branch.service';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  FileText,
  CreditCard,
  QrCode,
  Download,
  Mail,
  Clock,
  Printer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrRecep = hasRole('ADMIN', 'RECEPCIONISTA');
  const isClient = hasRole('CLIENTE');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(isClient ? user?.id || '' : '');
  const [selectedAttendanceBranch, setSelectedAttendanceBranch] = useState<string>('');
  const [selectedAttendanceMember, setSelectedAttendanceMember] = useState<string>(isClient ? user?.id || '' : '');

  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [downloadingCarnet, setDownloadingCarnet] = useState(false);
  const [sendingCarnetEmail, setSendingCarnetEmail] = useState(false);
  const [downloadingAttendance, setDownloadingAttendance] = useState(false);

  const { data: membersData } = useQuery({
    queryKey: ['members-select-reports'],
    queryFn: () => memberService.getAll({ page: 0, size: 100 }),
    enabled: isAdminOrRecep,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-select-reports'],
    queryFn: () => branchService.getAll({ page: 0, size: 50 }),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-select-reports'],
    queryFn: () =>
      isAdminOrRecep
        ? invoiceService.getAll({ page: 0, size: 50 })
        : invoiceService.getMy().then((data) => ({ content: data })),
  });

  const handleDownloadInvoicePdf = async () => {
    if (!selectedInvoiceId) {
      toast.error('Por favor ingresa o selecciona el ID o Folio de la Factura');
      return;
    }
    try {
      setDownloadingInvoice(true);
      const blob = await reportService.downloadInvoicePdf(Number(selectedInvoiceId));
      reportService.triggerDownload(blob, `factura-nova-${selectedInvoiceId}.pdf`);
      toast.success('Comprobante de factura descargado exitosamente');
    } catch {
      toast.error('Error al generar comprobante de factura');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleDownloadCarnetPdf = async () => {
    const memberId = isClient ? user?.id : selectedMemberId;
    if (!memberId) {
      toast.error('Por favor selecciona un socio');
      return;
    }
    try {
      setDownloadingCarnet(true);
      const blob = await reportService.downloadMemberCarnetPdf(memberId);
      reportService.triggerDownload(blob, `carnet-digital-${memberId.substring(0, 8)}.pdf`);
      toast.success('Carnet digital con código QR descargado exitosamente');
    } catch {
      toast.error('Error al generar carnet digital en PDF');
    } finally {
      setDownloadingCarnet(false);
    }
  };

  const handleSendCarnetEmail = async () => {
    const memberId = isClient ? user?.id : selectedMemberId;
    if (!memberId) {
      toast.error('Por favor selecciona un socio');
      return;
    }
    try {
      setSendingCarnetEmail(true);
      await memberService.solicitarCarnet(memberId);
      toast.success('Carnet con código QR y credenciales enviado al correo electrónico');
    } catch {
      toast.error('Error al solicitar carnet por correo');
    } finally {
      setSendingCarnetEmail(false);
    }
  };

  const handleDownloadAttendancePdf = async () => {
    try {
      setDownloadingAttendance(true);
      const blob = await reportService.downloadAttendanceReportPdf({
        memberId: selectedAttendanceMember || undefined,
        branchId: selectedAttendanceBranch ? Number(selectedAttendanceBranch) : undefined,
      });
      reportService.triggerDownload(blob, 'reporte-asistencias-nova.pdf');
      toast.success('Reporte de asistencias descargado exitosamente');
    } catch {
      toast.error('Error al exportar reporte de asistencias');
    } finally {
      setDownloadingAttendance(false);
    }
  };

  const members = membersData?.content || [];
  const branches = branchesData?.content || [];
  const invoices = invoicesData?.content || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Centro de Reportes y Documentos PDF
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generación oficial de facturas electrónicas, carnet digital con código QR y bitácoras de asistencia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between border-slate-800 bg-slate-900/40">
          <div>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Facturas y Comprobantes</CardTitle>
              <CardDescription>
                Comprobante fiscal con resumen de ítems, estado de cobro y código QR de autenticidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Seleccionar Folio de Factura</Label>
                <Select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                >
                  <option value="">Selecciona una factura...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.id} - {inv.memberName} (Q{inv.amount}) [{inv.status}]
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>O escribe el ID / Folio</Label>
                <Input
                  type="number"
                  placeholder="ej. 1"
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                />
              </div>
            </CardContent>
          </div>
          <div className="p-6 pt-0">
            <Button
              onClick={handleDownloadInvoicePdf}
              isLoading={downloadingInvoice}
              disabled={!selectedInvoiceId}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Factura PDF</span>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-slate-800 bg-slate-900/40">
          <div>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <QrCode className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Carnet Digital de Socio</CardTitle>
              <CardDescription>
                Credencial oficial de membresía con fotografía, datos personales y código QR para ingreso y torniquetes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isClient ? (
                <div>
                  <Label>Seleccionar Socio</Label>
                  <Select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    <option value="">Selecciona socio...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} (@{m.username})
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="p-3 bg-secondary/30 rounded-lg border border-border text-xs space-y-1">
                  <p className="font-semibold text-foreground">Tu Carnet Digital</p>
                  <p className="text-muted-foreground">
                    Asociado a tu cuenta: <strong className="text-foreground">{user?.email}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </div>
          <div className="p-6 pt-0 space-y-2">
            <Button
              onClick={handleDownloadCarnetPdf}
              isLoading={downloadingCarnet}
              disabled={!isClient && !selectedMemberId}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Carnet PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSendCarnetEmail}
              isLoading={sendingCarnetEmail}
              disabled={!isClient && !selectedMemberId}
              className="w-full gap-2 text-xs"
            >
              <Mail className="h-3.5 w-3.5 text-blue-400" />
              <span>Solicitar / Enviar a mi Correo</span>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-slate-800 bg-slate-900/40">
          <div>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Reporte de Asistencias</CardTitle>
              <CardDescription>
                Informe detallado de flujos de socios, horarios de check-in / check-out y sucursales visitadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdminOrRecep && (
                <div>
                  <Label>Filtrar por Sucursal</Label>
                  <Select
                    value={selectedAttendanceBranch}
                    onChange={(e) => setSelectedAttendanceBranch(e.target.value)}
                  >
                    <option value="">Todas las sucursales</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {isAdminOrRecep && (
                <div>
                  <Label>Filtrar por Socio</Label>
                  <Select
                    value={selectedAttendanceMember}
                    onChange={(e) => setSelectedAttendanceMember(e.target.value)}
                  >
                    <option value="">Todos los socios</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </CardContent>
          </div>
          <div className="p-6 pt-0">
            <Button
              onClick={handleDownloadAttendancePdf}
              isLoading={downloadingAttendance}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Asistencias PDF</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
