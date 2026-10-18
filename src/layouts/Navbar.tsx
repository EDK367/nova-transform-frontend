import React from 'react';
import { Menu, Moon, Sun, Building2, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/users': 'Gestión de Usuarios',
  '/roles': 'Roles y Permisos',
  '/members': 'Directorio de Socios',
  '/memberships': 'Membresías',
  '/plans': 'Planes de Membresía',
  '/benefits': 'Catálogo de Beneficios',
  '/classes': 'Programación de Clases',
  '/class-types': 'Tipos de Clases',
  '/attendances': 'Control de Asistencias',
  '/invoices': 'Facturación y Cobranza',
  '/payment-receipts': 'Comprobantes de Pago',
  '/payment-methods': 'Métodos de Pago',
  '/promotions': 'Promociones y Descuentos',
  '/waitlists': 'Listas de Espera',
  '/ratings': 'Calificaciones de Clases',
  '/profile': 'Mi Perfil',
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = pageTitles[location.pathname] || 'NOVA TRANSFORM';

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {/* Toggle mobile menu */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Current Page Title */}
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {currentTitle}
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>NOVA</span>
            <span>/</span>
            <span className="text-primary font-medium">{currentTitle}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Branch indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium border border-border">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span>Sucursal Principal #{user?.branchId || 1}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </button>

        {/* Profile Avatar & Trigger */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-secondary transition-colors group"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center">
            {user?.firstName?.charAt(0) || <UserCircle2 className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-foreground leading-tight">
              {user?.firstName}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">
              {user?.roleName}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
