import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import {
  CreatePermissionRequest,
  CreateRoleRequest,
  PermissionResponse,
  RoleResponse,
  UpdatePermissionRequest,
  UpdateRoleRequest,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Dumbbell,
  Shield,
  Crown,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Search,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';

const PROTECTED_PERMISSION_CODES = new Set([
  'ROLES_MANAGE',
  'PERMISSIONS_MANAGE',
  'ROLES_READ',
  'PERMISSIONS_READ',
]);

const DEFAULT_MODULES = [
  'SEGURIDAD',
  'USUARIOS',
  'SUCURSALES',
  'CLIENTES',
  'MEMBRESIAS',
  'ENTRENAMIENTO',
  'CLASES',
  'FINANZAS',
  'REPORTES',
];

const roleVisualMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  SUPER_ADMIN: {
    icon: Crown,
    color: 'text-amber-300 bg-amber-500/15 border-amber-400/40',
  },
  ADMIN: {
    icon: ShieldCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  RECEPCIONISTA: {
    icon: UserCheck,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  ENTRENADOR: {
    icon: Dumbbell,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  CLIENTE: {
    icon: Shield,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
};

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  // Role modal states
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleResponse | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  // Permission modal states
  const [permSearch, setPermSearch] = useState('');
  const [permModuleFilter, setPermModuleFilter] = useState('ALL');
  const [isCreatePermOpen, setIsCreatePermOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<PermissionResponse | null>(null);
  const [deletingPerm, setDeletingPerm] = useState<PermissionResponse | null>(null);
  const [permCode, setPermCode] = useState('');
  const [permName, setPermName] = useState('');
  const [permModule, setPermModule] = useState('USUARIOS');
  const [permDescription, setPermDescription] = useState('');

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<RoleResponse[]>({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<PermissionResponse[]>({
    queryKey: ['permissions'],
    queryFn: () => userService.getPermissions(),
  });

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, PermissionResponse[]> = {};
    permissions.forEach((p) => {
      const mod = p.module || 'GENERAL';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(p);
    });
    return grouped;
  }, [permissions]);

  const allModules = useMemo(() => {
    const set = new Set<string>(DEFAULT_MODULES);
    permissions.forEach((p) => {
      if (p.module) set.add(p.module);
    });
    return Array.from(set);
  }, [permissions]);

  // Filtered permissions for catalog tab
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchesModule = permModuleFilter === 'ALL' || p.module === permModuleFilter;
      const q = permSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      return matchesModule && matchesQuery;
    });
  }, [permissions, permModuleFilter, permSearch]);

  // Role Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => userService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateRoleOpen(false);
      toast.success('Rol creado exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al crear el rol');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) =>
      userService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingRole(null);
      toast.success('Rol y permisos actualizados correctamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al actualizar el rol');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => userService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeletingRole(null);
      toast.success('Rol eliminado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No se pudo eliminar el rol');
    },
  });

  // Permission Mutations
  const createPermMutation = useMutation({
    mutationFn: (data: CreatePermissionRequest) => userService.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreatePermOpen(false);
      toast.success('Permiso registrado en el catálogo');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al crear permiso');
    },
  });

  const updatePermMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePermissionRequest }) =>
      userService.updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingPerm(null);
      toast.success('Permiso actualizado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al actualizar permiso');
    },
  });

  const deletePermMutation = useMutation({
    mutationFn: (id: number) => userService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeletingPerm(null);
      toast.success('Permiso eliminado del catálogo');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No se pudo eliminar el permiso');
    },
  });

  // Role modal handlers
  const openCreateRole = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissionIds([]);
    setIsCreateRoleOpen(true);
  };

  const openEditRole = (role: RoleResponse) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissionIds((role.permissions || []).map((p) => p.id));
  };

  const togglePermissionId = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleModulePermissions = (modulePerms: PermissionResponse[]) => {
    const ids = modulePerms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleSaveCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }
    createRoleMutation.mutate({
      name: roleName.trim().toUpperCase(),
      description: roleDescription.trim() || undefined,
      permissionIds: selectedPermissionIds,
    });
  };

  const handleSaveEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    updateRoleMutation.mutate({
      id: editingRole.id,
      data: {
        name: editingRole.systemRole ? editingRole.name : roleName.trim().toUpperCase(),
        description: roleDescription.trim() || undefined,
        permissionIds: selectedPermissionIds,
      },
    });
  };

  // Permission modal handlers
  const openCreatePerm = () => {
    setPermCode('');
    setPermName('');
    setPermModule('USUARIOS');
    setPermDescription('');
    setIsCreatePermOpen(true);
  };

  const openEditPerm = (perm: PermissionResponse) => {
    setEditingPerm(perm);
    setPermCode(perm.code);
    setPermName(perm.name);
    setPermModule(perm.module);
    setPermDescription(perm.description || '');
  };

  const handleSaveCreatePerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permCode.trim() || !permName.trim() || !permModule.trim()) {
      toast.error('Código, nombre y módulo son obligatorios');
      return;
    }
    createPermMutation.mutate({
      code: permCode.trim().toUpperCase(),
      name: permName.trim(),
      module: permModule.trim().toUpperCase(),
      description: permDescription.trim() || undefined,
    });
  };

  const handleSaveEditPerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerm) return;
    updatePermMutation.mutate({
      id: editingPerm.id,
      data: {
        code: permCode.trim().toUpperCase(),
        name: permName.trim(),
        module: permModule.trim().toUpperCase(),
        description: permDescription.trim() || undefined,
      },
    });
  };

  const renderPermissionMatrixSelector = () => (
    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 border border-border rounded-xl p-3 bg-secondary/20">
      {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => {
        const allSelected =
          modulePerms.length > 0 &&
          modulePerms.every((p) => selectedPermissionIds.includes(p.id));
        return (
          <div key={moduleName} className="space-y-2 border-b border-border/60 pb-3 last:border-none last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {moduleName}
              </span>
              <button
                type="button"
                onClick={() => toggleModulePermissions(modulePerms)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                    Desmarcar módulo
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" />
                    Seleccionar todo ({modulePerms.length})
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {modulePerms.map((perm) => {
                const checked = selectedPermissionIds.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${checked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                      : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermissionId(perm.id)}
                      className="mt-0.5 rounded border-border text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="overflow-hidden">
                      <p className="font-semibold text-foreground truncate">{perm.name}</p>
                      <p className="font-mono text-[10px] text-emerald-400/90 truncate">
                        {perm.code}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Administración de Roles y Permisos
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
              <Crown className="h-3.5 w-3.5" />
              SUPER_ADMIN
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Panel maestro del propietario para gestionar roles, crear nuevos perfiles y administrar permisos granulares.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={openCreatePerm} className="gap-2">
            <KeyRound className="h-4 w-4" />
            <span>Nuevo Permiso</span>
          </Button>
          <Button onClick={openCreateRole} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Rol</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'roles'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Roles y Asignación de Permisos ({roles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'permissions'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Catálogo de Permisos ({permissions.length})</span>
        </button>
      </div>

      {/* TAB 1: ROLES */}
      {activeTab === 'roles' && (
        <>
          {isLoadingRoles ? (
            <TableSkeleton rows={4} columns={3} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roles.map((role) => {
                const isOwnerRole = role.name === 'SUPER_ADMIN';
                const meta = roleVisualMeta[role.name] || {
                  icon: Shield,
                  color: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
                };
                const Icon = meta.icon;
                const rolePerms = role.permissions || [];

                // Group role permissions by module for clean display
                const groupedRolePerms: Record<string, PermissionResponse[]> = {};
                rolePerms.forEach((p) => {
                  const m = p.module || 'GENERAL';
                  if (!groupedRolePerms[m]) groupedRolePerms[m] = [];
                  groupedRolePerms[m].push(p);
                });

                return (
                  <Card
                    key={role.id}
                    className={`overflow-hidden border transition-shadow ${isOwnerRole
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent'
                      : 'border-border hover:shadow-md'
                      }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${meta.color}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                              <span>{role.name}</span>
                              <span className="text-xs font-mono font-normal text-muted-foreground">
                                ID: {role.id}
                              </span>
                              {isOwnerRole ? (
                                <Badge variant="default" className="bg-amber-500/20 text-amber-300 border-amber-400/30">
                                  Super Usuario
                                </Badge>
                              ) : role.systemRole ? (
                                <Badge variant="secondary">Rol de Sistema</Badge>
                              ) : (
                                <Badge variant="outline">Personalizado</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {role.description || 'Sin descripción'}
                            </CardDescription>
                          </div>
                        </div>

                        {!isOwnerRole && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditRole(role)}
                              className="gap-1.5 text-xs"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Permisos / Editar</span>
                            </Button>
                            {!role.systemRole && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => setDeletingRole(role)}
                                title="Eliminar rol personalizado"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider">
                          Permisos Asignados ({rolePerms.length})
                        </span>
                      </div>

                      {rolePerms.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          Este rol aún no tiene permisos asignados.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {Object.entries(groupedRolePerms).map(([mod, perms]) => (
                            <div key={mod} className="space-y-1">
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                {mod} ({perms.length})
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {perms.map((p) => (
                                  <span
                                    key={p.id}
                                    title={p.description || p.code}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-secondary/70 text-foreground/90 border border-border/70"
                                  >
                                    <span>{p.name}</span>
                                    <span className="text-[9px] font-mono text-muted-foreground">
                                      ({p.code})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: PERMISSIONS CATALOG */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar permiso por código, nombre o descripción..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-56">
                <Select
                  value={permModuleFilter}
                  onChange={(e) => setPermModuleFilter(e.target.value)}
                >
                  <option value="ALL">Todos los módulos ({permissions.length})</option>
                  {allModules.map((mod) => (
                    <option key={mod} value={mod}>
                      Módulo: {mod}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Catálogo Maestro de Permisos</CardTitle>
              <CardDescription>
                Mostrando {filteredPermissions.length} de {permissions.length} permisos registrados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingPermissions ? (
                <TableSkeleton rows={6} columns={5} />
              ) : filteredPermissions.length === 0 ? (
                <EmptyState
                  title="No se encontraron permisos"
                  description="Intenta con otros términos de búsqueda o crea un nuevo permiso."
                  actionText="Crear Permiso"
                  onAction={openCreatePerm}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase font-semibold">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Nombre</th>
                        <th className="py-3 px-4">Módulo</th>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredPermissions.map((perm) => {
                        const isProtected = PROTECTED_PERMISSION_CODES.has(perm.code);
                        return (
                          <tr key={perm.id} className="hover:bg-secondary/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-400">
                              {perm.code}
                            </td>
                            <td className="py-3 px-4 font-semibold text-foreground">
                              {perm.name}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{perm.module}</Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground max-w-md">
                              {perm.description || '—'}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditPerm(perm)}
                                title="Editar permiso"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {!isProtected && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                  onClick={() => setDeletingPerm(perm)}
                                  title="Eliminar permiso"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: CREATE ROLE */}
      <Modal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        title="Crear Nuevo Rol"
        description="Define un nuevo rol y selecciona los permisos que heredarán los usuarios asignados."
      >
        <form onSubmit={handleSaveCreateRole} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Código / Nombre del Rol</Label>
              <Input
                placeholder="ej. AUDITOR_FINANCIERO"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="ej. Supervisión de facturas y cajas"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Matriz de Permisos ({selectedPermissionIds.length} seleccionados)
            </Label>
            {renderPermissionMatrixSelector()}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateRoleOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createRoleMutation.isPending}>
              Crear Rol
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT ROLE & PERMISSIONS */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Configurar Rol: ${editingRole?.name || ''}`}
        description="Actualiza la descripción y marca o desmarca los permisos asignados a este rol."
      >
        <form onSubmit={handleSaveEditRole} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Código del Rol</Label>
              <Input
                value={roleName}
                disabled={editingRole?.systemRole}
                onChange={(e) => setRoleName(e.target.value.toUpperCase())}
              />
              {editingRole?.systemRole && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  El código de un rol nativo del sistema se mantiene fijo por compatibilidad.
                </p>
              )}
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Permisos Asignados al Rol ({selectedPermissionIds.length} activos)
            </Label>
            {renderPermissionMatrixSelector()}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingRole(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateRoleMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE PERMISSION */}
      <Modal
        isOpen={isCreatePermOpen}
        onClose={() => setIsCreatePermOpen(false)}
        title="Crear Nuevo Permiso"
        description="Registra un nuevo permiso granular en el catálogo del sistema."
      >
        <form onSubmit={handleSaveCreatePerm} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Código Identificador</Label>
              <Input
                placeholder="ej. INVENTORY_MANAGE"
                value={permCode}
                onChange={(e) => setPermCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label required>Módulo</Label>
              <Select
                value={permModule}
                onChange={(e) => setPermModule(e.target.value)}
              >
                {allModules.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label required>Nombre Legible</Label>
            <Input
              placeholder="ej. Gestionar Inventario de Equipos"
              value={permName}
              onChange={(e) => setPermName(e.target.value)}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              placeholder="Describe qué acciones habilita este permiso..."
              value={permDescription}
              onChange={(e) => setPermDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreatePermOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createPermMutation.isPending}>
              Guardar Permiso
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT PERMISSION */}
      <Modal
        isOpen={!!editingPerm}
        onClose={() => setEditingPerm(null)}
        title="Editar Permiso"
        description="Actualiza los metadatos del permiso seleccionado."
      >
        <form onSubmit={handleSaveEditPerm} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Código Identificador</Label>
              <Input
                value={permCode}
                disabled={
                  !!editingPerm && PROTECTED_PERMISSION_CODES.has(editingPerm.code)
                }
                onChange={(e) => setPermCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label required>Módulo</Label>
              <Select
                value={permModule}
                onChange={(e) => setPermModule(e.target.value)}
              >
                {allModules.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label required>Nombre Legible</Label>
            <Input
              value={permName}
              onChange={(e) => setPermName(e.target.value)}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              value={permDescription}
              onChange={(e) => setPermDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPerm(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updatePermMutation.isPending}>
              Actualizar Permiso
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE ROLE */}
      <ConfirmDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={() => deletingRole && deleteRoleMutation.mutate(deletingRole.id)}
        title="Eliminar Rol Personalizado"
        message={`¿Estás seguro de que deseas eliminar el rol "${deletingRole?.name}"? Solo puede eliminarse si no tiene usuarios asignados.`}
        confirmText="Eliminar Rol"
        isLoading={deleteRoleMutation.isPending}
      />

      {/* CONFIRM DELETE PERMISSION */}
      <ConfirmDialog
        isOpen={!!deletingPerm}
        onClose={() => setDeletingPerm(null)}
        onConfirm={() => deletingPerm && deletePermMutation.mutate(deletingPerm.id)}
        title="Eliminar Permiso"
        message={`¿Estás seguro de que deseas eliminar el permiso "${deletingPerm?.code}" (${deletingPerm?.name})? Se desvinculará automáticamente de los roles que lo tengan.`}
        confirmText="Eliminar Permiso"
        isLoading={deletePermMutation.isPending}
      />
    </div>
  );
};
