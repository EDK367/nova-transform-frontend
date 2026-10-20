# Nova Transform Frontend

Plataforma Web SPA corporativa construida para la gestión integral de centros de acondicionamiento físico, gimnasios y academias deportivas. Desarrollada con React 18, Vite, TypeScript, Tailwind CSS, TanStack React Query, React Router DOM, Recharts, Lucide Icons y Sonner.

---

## Características y Módulos del Sistema

### 1. Panel de Control y Analítica
- Dashboard con métricas clave: total de socios activos, asistencias diarias, facturación del periodo y clases programadas.
- Gráficas interactivas con Recharts para visualización de ingresos, estados de cuenta y ocupación.

### 2. Administración y Sucursales
- **Sucursales**: Gestión de sedes operativas, direcciones, teléfonos y estado operativo.
- **Usuarios y Roles**: Control de personal con asignación de roles (ADMIN, RECEPCIONISTA, ENTRENADOR, CLIENTE).
- **Recepcionistas**: Asignación de turnos laborales (Matutino, Vespertino, Nocturno) y sede designada.
- **Socios**: Registro y alta de miembros con generación de contraseñas temporales y envío automático de credenciales vía Resend.

### 3. Membresías y Planes
- **Membresías**: Control de estados (ACTIVE, INACTIVE, FROZEN, CANCELLED), fechas de corte y renovación.
- **Planes de Membresía**: Definición de tarifas, periodicidad y beneficios incluidos.
- **Beneficios**: Catálogo de beneficios asignables a cada plan.

### 4. Entrenamiento y Rutinas
- **Staff de Entrenadores**: Perfiles de instructores, biografía, sede y gestión de especialidades asignadas.
- **Especialidades**: Catálogo de disciplinas deportivas (CrossFit, Pilates, Musculación, etc.).
- **Asignaciones**: Vinculación personalizada entre socios y entrenadores.
- **Banco de Ejercicios**: Catálogo categorizado por grupo muscular, equipo requerido, dificultad y videos tutoriales.
- **Planes de Rutinas**: Creación de rutinas con desglose de series, repeticiones, descansos y notas.
- **Bitácora de Entrenamientos**: Registro de levantamientos, volumen de entrenamiento y escala de esfuerzo percibido (RPE 1-10).

### 5. Salud y Evaluación Física
- **Metas y Objetivos**: Seguimiento cuantitativo de objetivos de composición corporal y marcas de fuerza.
- **Medidas Antropométricas**: Control de peso corporal, porcentaje de grasa, masa muscular y perímetros corporales con gráfica evolutiva histórica.

### 6. Clases y Asistencias
- **Clases Grupales**: Programación de sesiones con control de aforo y cupos en tiempo real.
- **Listas de Espera y Calificaciones**: Registro de miembros en cola y valoraciones con estrellas.
- **Control de Asistencias (Check-In / Out)**: Bitácora de accesos en torniquetes y exportación tabular.

### 7. Finanzas, Facturación y Reportes PDF
- **Facturas**: Emisión de cargos, desglose de pagos y saldos pendientes.
- **Comprobantes de Pago**: Registro de transacciones con métodos de pago configurables.
- **Comprobante Fiscal en PDF**: Descarga de factura con código QR de verificación fiscal.
- **Carnet Digital de Socio con QR**: Descarga del carnet oficial y solicitud de reenvío por correo electrónico.
- **Reporte de Asistencias en PDF**: Generación de reportes tabulares de acceso.

---

## Requisitos de Entorno

- Node.js v18 o superior (probado en Node.js v24)
- npm v9 o superior (probado en npm v11)
- Backend Nova Transform (Quarkus 3.39.1) en ejecución

---

## Configuración y Variables de Entorno

Crea el archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
VITE_API_URL=http://localhost:8080
```

---

## Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Modo Desarrollo con Hot-Reload:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

3. **Compilación para Producción (Deploy):**
   ```bash
   npm run build
   ```
   Genera el bundle optimizado en la carpeta `dist/`.

4. **Previsualizar Build de Producción:**
   ```bash
   npm run preview
   ```

---

## Estructura de Directorios

```
src/
├── components/          # Componentes reutilizables (UI, Modales, Tablas, Skeletons)
│   ├── common/          # Componentes de negocio compartidos
│   └── ui/              # Componentes base (Botones, Inputs, Badges, Modales)
├── contexts/            # Contextos de React (AuthContext, ThemeContext)
├── hooks/               # Custom hooks de autenticación y tema
├── layouts/             # Plantilla principal, Navbar y Sidebar responsive
├── lib/                 # Funciones utilitarias (formato de moneda, fechas, CN)
├── pages/               # Páginas y vistas correspondientes a cada módulo
├── routes/              # Configuración de rutas y ProtectedRoute con control de roles
├── services/            # Clientes Axios tipados para consumir la API REST de Quarkus
└── types/               # Definiciones de TypeScript para DTOs, peticiones y respuestas
```
