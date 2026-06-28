import { storage } from './storage'

export interface MaintenanceMode {
  enabled: boolean
  message: string
  expectedEnd?: string
  enabledAt?: string
}

export interface BroadcastBanner {
  id: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  active: boolean
  createdAt: string
  expiresAt?: string
}

export interface SystemConfig {
  siteName: string
  siteTagline: string
  contactEmail: string
  maxUploadSizeMb: number
  articlesPerPage: number
  enableRegistration: boolean
  enableComments: boolean
  maintenanceMessage: string
}

export interface PermissionRole {
  id: string
  name: string
  permissions: string[]
  color: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  banned: boolean
  createdAt: string
  lastLoginAt?: string
}

const MAINTENANCE_KEY = 'gta6hub_maintenance'
const BANNERS_KEY = 'gta6hub_banners'
const CONFIG_KEY = 'gta6hub_system_config'
const ROLES_KEY = 'gta6hub_roles'
const ADMIN_USERS_KEY = 'gta6hub_admin_users'

const DEFAULT_CONFIG: SystemConfig = {
  siteName: 'GTA 6 News Hub',
  siteTagline: 'Deine Quelle für alles rund um GTA VI',
  contactEmail: 'admin@gta6newshub.de',
  maxUploadSizeMb: 10,
  articlesPerPage: 20,
  enableRegistration: true,
  enableComments: true,
  maintenanceMessage: 'Wir sind gleich zurück!',
}

const DEFAULT_ROLES: PermissionRole[] = [
  { id: 'admin', name: 'Admin', color: '#e94560', permissions: ['*'] },
  { id: 'editor', name: 'Redakteur', color: '#0f3460', permissions: ['articles.create', 'articles.edit', 'articles.delete', 'media.upload', 'comments.moderate'] },
  { id: 'moderator', name: 'Moderator', color: '#16213e', permissions: ['comments.moderate', 'reports.view', 'users.ban'] },
  { id: 'author', name: 'Autor', color: '#1a1a2e', permissions: ['articles.create', 'media.upload'] },
  { id: 'member', name: 'Mitglied', color: '#333', permissions: ['comments.create', 'reactions.add', 'votes.cast'] },
]

export function getMaintenanceMode(): MaintenanceMode {
  return storage.get<MaintenanceMode>(MAINTENANCE_KEY) ?? { enabled: false, message: DEFAULT_CONFIG.maintenanceMessage }
}

export function setMaintenanceMode(enabled: boolean, message?: string, expectedEnd?: string): MaintenanceMode {
  const mode: MaintenanceMode = { enabled, message: message ?? DEFAULT_CONFIG.maintenanceMessage, expectedEnd, enabledAt: enabled ? new Date().toISOString() : undefined }
  storage.set(MAINTENANCE_KEY, mode)
  return mode
}

export function getBanners(): BroadcastBanner[] {
  return storage.get<BroadcastBanner[]>(BANNERS_KEY) ?? []
}

export function getActiveBanners(): BroadcastBanner[] {
  const now = new Date().toISOString()
  return getBanners().filter(b => b.active && (!b.expiresAt || b.expiresAt > now))
}

export function createBanner(message: string, type: BroadcastBanner['type'] = 'info', expiresAt?: string): BroadcastBanner {
  const banners = getBanners()
  const banner: BroadcastBanner = { id: crypto.randomUUID(), message, type, active: true, createdAt: new Date().toISOString(), expiresAt }
  banners.push(banner)
  storage.set(BANNERS_KEY, banners)
  return banner
}

export function dismissBanner(id: string): void {
  const banners = getBanners()
  const b = banners.find(x => x.id === id)
  if (b) { b.active = false; storage.set(BANNERS_KEY, banners) }
}

export function getSystemConfig(): SystemConfig {
  return { ...DEFAULT_CONFIG, ...storage.get<Partial<SystemConfig>>(CONFIG_KEY) }
}

export function updateSystemConfig(patch: Partial<SystemConfig>): SystemConfig {
  const current = getSystemConfig()
  const updated = { ...current, ...patch }
  storage.set(CONFIG_KEY, updated)
  return updated
}

export function getRoles(): PermissionRole[] {
  return storage.get<PermissionRole[]>(ROLES_KEY) ?? DEFAULT_ROLES
}

export function createRole(name: string, permissions: string[], color = '#555'): PermissionRole {
  const roles = getRoles()
  const role: PermissionRole = { id: crypto.randomUUID(), name, permissions, color }
  roles.push(role)
  storage.set(ROLES_KEY, roles)
  return role
}

export function updateRolePermissions(id: string, permissions: string[]): PermissionRole | null {
  const roles = getRoles()
  const role = roles.find(r => r.id === id)
  if (!role) return null
  role.permissions = permissions
  storage.set(ROLES_KEY, roles)
  return role
}

export function getAdminUsers(): AdminUser[] {
  return storage.get<AdminUser[]>(ADMIN_USERS_KEY) ?? [
    { id: 'user1', username: 'Admin', email: 'admin@gta6newshub.de', role: 'admin', banned: false, createdAt: '2024-01-01T00:00:00Z', lastLoginAt: new Date().toISOString() },
    { id: 'user2', username: 'RedakteurMax', email: 'max@gta6newshub.de', role: 'editor', banned: false, createdAt: '2024-02-15T00:00:00Z' },
    { id: 'user3', username: 'ModLisa', email: 'lisa@gta6newshub.de', role: 'moderator', banned: false, createdAt: '2024-03-10T00:00:00Z' },
  ]
}

export function searchUsers(query: string): AdminUser[] {
  const lower = query.toLowerCase()
  return getAdminUsers().filter(u => u.username.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower))
}

export function banUser(id: string, banned: boolean): AdminUser | null {
  const users = getAdminUsers()
  const user = users.find(u => u.id === id)
  if (!user) return null
  user.banned = banned
  storage.set(ADMIN_USERS_KEY, users)
  return user
}

export function updateUserRole(userId: string, roleId: string): AdminUser | null {
  const users = getAdminUsers()
  const user = users.find(u => u.id === userId)
  if (!user) return null
  user.role = roleId
  storage.set(ADMIN_USERS_KEY, users)
  return user
}
