/**
 * Permission Service
 * Manages role-based access control (RBAC) and permissions
 */

export type Role = 'admin' | 'moderator' | 'editor' | 'user' | 'guest'

export type Permission =
  | 'read:articles'
  | 'create:articles'
  | 'edit:articles'
  | 'delete:articles'
  | 'read:comments'
  | 'create:comments'
  | 'edit:comments'
  | 'delete:comments'
  | 'read:users'
  | 'manage:users'
  | 'manage:roles'
  | 'manage:permissions'
  | 'moderate:content'
  | 'admin:system'

export interface RoleDefinition {
  id: Role
  name: string
  permissions: Permission[]
  description: string
  priority: number
}

export interface UserRole {
  userId: string
  role: Role
  assignedAt: number
  assignedBy: string
  expiresAt?: number
}

class PermissionService {
  private roleCache: Map<Role, RoleDefinition> = new Map()

  /**
   * Get user's role
   */
  async getUserRole(userId: string): Promise<Role | null> {
    const response = await fetch(`/api/users/${userId}/role`)
    if (!response.ok) return null
    const result = await response.json()
    return result.role ?? null
  }

  /**
   * Get all user roles
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const response = await fetch(`/api/users/${userId}/roles`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: Role, expiresAt?: number): Promise<UserRole> {
    const response = await fetch(`/api/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, expiresAt }),
    })

    if (!response.ok) throw new Error('Failed to assign role')
    return response.json()
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/role`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to remove role')
  }

  /**
   * Get role definition
   */
  async getRoleDefinition(role: Role): Promise<RoleDefinition | null> {
    if (this.roleCache.has(role)) {
      return this.roleCache.get(role) ?? null
    }

    const response = await fetch(`/api/roles/${role}`)
    if (!response.ok) return null

    const definition = await response.json()
    this.roleCache.set(role, definition)
    return definition
  }

  /**
   * Get all role definitions
   */
  async getAllRoles(): Promise<RoleDefinition[]> {
    const response = await fetch('/api/roles')
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId)
      if (!role) return false

      const roleDefinition = await this.getRoleDefinition(role)
      if (!roleDefinition) return false

      return roleDefinition.permissions.includes(permission)
    } catch {
      return false
    }
  }

  /**
   * Check multiple permissions
   */
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const results = await Promise.all(permissions.map((p) => this.hasPermission(userId, p)))
    return results.every((r) => r)
  }

  /**
   * Check if user has any of the permissions
   */
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const results = await Promise.all(permissions.map((p) => this.hasPermission(userId, p)))
    return results.some((r) => r)
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const role = await this.getUserRole(userId)
      if (!role) return []

      const roleDefinition = await this.getRoleDefinition(role)
      if (!roleDefinition) return []

      return roleDefinition.permissions
    } catch {
      return []
    }
  }

  /**
   * Create custom role
   */
  async createRole(
    roleId: string,
    name: string,
    permissions: Permission[],
    description: string
  ): Promise<RoleDefinition> {
    const response = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: roleId, name, permissions, description }),
    })

    if (!response.ok) throw new Error('Failed to create role')
    const role = await response.json()
    this.roleCache.set(roleId as Role, role)
    return role
  }

  /**
   * Update role
   */
  async updateRole(role: Role, updates: Partial<RoleDefinition>): Promise<RoleDefinition> {
    const response = await fetch(`/api/roles/${role}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update role')
    const updated = await response.json()
    this.roleCache.set(role, updated)
    return updated
  }

  /**
   * Delete role
   */
  async deleteRole(role: Role): Promise<void> {
    const response = await fetch(`/api/roles/${role}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete role')
    this.roleCache.delete(role)
  }

  /**
   * Grant specific permission to user
   */
  async grantPermission(userId: string, permission: Permission): Promise<void> {
    const response = await fetch(`/api/users/${userId}/permissions/${permission}`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to grant permission')
  }

  /**
   * Revoke specific permission from user
   */
  async revokePermission(userId: string, permission: Permission): Promise<void> {
    const response = await fetch(`/api/users/${userId}/permissions/${permission}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to revoke permission')
  }
}

export const permissionService = new PermissionService()
