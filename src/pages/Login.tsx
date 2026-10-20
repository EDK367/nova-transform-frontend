import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Sparkles, Dumbbell, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario o correo debe tener al menos 3 caracteres')
    .max(150, 'El usuario o correo no puede superar 150 caracteres'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al min 6 caracteres')
    .max(100, 'La contraseña no puede superar 100 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        'Credenciales inválidas. Verifica tu usuario y contraseña.';
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex bg-[#0B0F19] text-white">
      {/* Left Column: Branding Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#062419] border-r border-slate-800 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-glow-emerald">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-white">
              NOVA <span className="text-emerald-400">TRANSFORM</span>
            </h1>
            <p className="text-xs text-slate-400 tracking-widest font-semibold uppercase">
              Gym Management System
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Versión 2.0 • Quarkus & React High-Performance</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
            Potencia la administración de tu gimnasio con <span className="text-emerald-400">precisión empresarial</span>.
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Control integral de socios, membresías con beneficios dinámicos, clases especializadas, check-in en tiempo real y facturación automatizada.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Seguridad JWT RS256</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">RBAC Multinivel</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          <span>© 2026 NOVA TRANSFORM. Todos los derechos reservados.</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-wider text-white">
              NOVA <span className="text-emerald-400">TRANSFORM</span>
            </span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-slate-400">
              Ingresa tus credenciales para acceder a la plataforma.
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
              <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="username" required>
                Usuario o Correo Electrónico
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="ej. admin o usuario@correo.com"
                  className="pl-9 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" required>
                  Contraseña
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-10 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-glow-emerald"
              isLoading={isSubmitting}
            >
              <span>Acceder al Sistema</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>


        </div>
      </div>
    </div>
  );
};
