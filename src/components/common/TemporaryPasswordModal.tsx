import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Check, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface TemporaryPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  temporaryPassword?: string;
  fullName: string;
  roleName: string;
}

export const TemporaryPasswordModal: React.FC<TemporaryPasswordModalProps> = ({
  isOpen,
  onClose,
  username,
  temporaryPassword,
  fullName,
  roleName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro Exitoso de Credenciales"
      description="El usuario ha sido registrado en el sistema. Proporciónele sus credenciales iniciales de acceso."
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <KeyRound className="h-5 w-5 shrink-0" />
          <p className="text-xs">
            Esta contraseña es temporal y solo se mostrará en esta ocasión.
          </p>
        </div>

        <div className="space-y-3 bg-secondary/50 p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Nombre:</span>
            <span className="font-semibold text-foreground">{fullName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Rol:</span>
            <span className="font-semibold text-primary">{roleName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Usuario:</span>
            <span className="font-mono font-semibold text-foreground bg-card px-2 py-0.5 rounded border border-border">
              {username}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-border/60">
            <span className="text-muted-foreground font-medium">Contraseña temporal:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-emerald-400 bg-card px-3 py-1 rounded-lg border border-border tracking-wider select-all">
                {temporaryPassword || '********'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-8 px-2"
                title="Copiar contraseña"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Entendido y Guardado
          </Button>
        </div>
      </div>
    </Modal>
  );
};
