import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Shield, Building2, LogOut, CheckCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Perfil de Usuario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Información general de la cuenta y credenciales autenticadas en NOVA TRANSFORM.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-black shadow-glow-emerald">
                {user?.firstName?.charAt(0) || 'U'}
                {user?.lastName?.charAt(0) || ''}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                <CardDescription className="font-mono mt-0.5">
                  @{user?.username}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm py-1 px-3">
                {user?.roleName}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Correo Electrónico:</p>
                <p className="text-sm font-semibold text-foreground">{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Teléfono Móvil:</p>
                <p className="text-sm font-semibold text-foreground">{user?.phone || 'Sin registrar'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Sucursal Asignada:</p>
                <p className="text-sm font-semibold text-foreground">
                  Sede #{user?.branchId || 1}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Estado de la Cuenta:</p>
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {user?.active ? 'Activa y Verificada' : 'Inactiva'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              variant="destructive"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
