import { describe, it, expect, vi, beforeEach } from 'vitest'
import { permissionService } from './permissionService'

describe('PermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserRole', () => {
    it('should get user role', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'admin' }),
      })

      const role = await permissionService.getUserRole('user1')
      expect(role).toBe('admin')
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const role = await permissionService.getUserRole('user1')
      expect(role).toBeNull()
    })
  })

  describe('getUserRoles', () => {
    it('should get all user roles', async () => {
      const roles = [
        { userId: 'user1', role: 'admin', assignedAt: 1000, assignedBy: 'system' },
        { userId: 'user1', role: 'moderator', assignedAt: 2000, assignedBy: 'admin' },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => roles,
      })

      const result = await permissionService.getUserRoles('user1')
      expect(result).toHaveLength(2)
      expect(result[0].role).toBe('admin')
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await permissionService.getUserRoles('user1')
      expect(result).toEqual([])
    })
  })

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userId: 'user1', role: 'moderator', assignedAt: 1000 }),
      })

      const result = await permissionService.assignRole('user1', 'moderator')
      expect(result.role).toBe('moderator')
    })

    it('should throw on assignment failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      await expect(permissionService.assignRole('user1', 'admin')).rejects.toThrow('Failed to assign role')
    })
  })

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

      await expect(permissionService.removeRole('user1')).resolves.not.toThrow()
    })
  })

  describe('getRoleDefinition', () => {
    it('should get role definition', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'admin',
          name: 'Administrator',
          permissions: ['admin:system', 'manage:users'],
          description: 'Full system access',
          priority: 100,
        }),
      })

      const role = await permissionService.getRoleDefinition('admin')
      expect(role?.name).toBe('Administrator')
      expect(role?.permissions).toContain('admin:system')
    })

    it('should cache role definition', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user',
          name: 'User',
          permissions: ['read:articles'],
          description: 'Basic user',
          priority: 10,
        }),
      })

      await permissionService.getRoleDefinition('user')

      global.fetch.mockClear()

      await permissionService.getRoleDefinition('user')
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('hasPermission', () => {
    it('should check if user has permission', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ role: 'admin' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'admin',
            permissions: ['admin:system', 'manage:users'],
          }),
        })

      const has = await permissionService.hasPermission('user1', 'admin:system')
      expect(has).toBe(true)
    })
  })

  describe('hasAllPermissions', () => {
    it('should check if user has all permissions', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ role: 'admin' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'admin',
            permissions: ['admin:system', 'manage:users', 'manage:roles'],
          }),
        })

      const has = await permissionService.hasAllPermissions('user1', ['admin:system', 'manage:users'])
      expect(has).toBe(true)
    })
  })

  describe('getUserPermissions', () => {
    it('should get all user permissions', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ role: 'editor' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'editor',
            permissions: ['create:articles', 'edit:articles', 'read:comments'],
          }),
        })

      const perms = await permissionService.getUserPermissions('user1')
      expect(perms).toContain('create:articles')
      expect(perms).toHaveLength(3)
    })

    it('should return empty array for invalid user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const perms = await permissionService.getUserPermissions('invalid')
      expect(perms).toEqual([])
    })
  })

  describe('createRole', () => {
    it('should create custom role', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'custom',
          name: 'Custom Role',
          permissions: ['read:articles'],
          description: 'Custom role',
          priority: 50,
        }),
      })

      const role = await permissionService.createRole('custom', 'Custom Role', ['read:articles'], 'Custom role')
      expect(role.id).toBe('custom')
      expect(role.permissions).toContain('read:articles')
    })
  })

  describe('updateRole', () => {
    it('should update role', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user',
          permissions: ['read:articles', 'create:comments'],
        }),
      })

      const role = await permissionService.updateRole('user', {
        permissions: ['read:articles', 'create:comments'],
      })
      expect(role.permissions).toContain('create:comments')
    })
  })

  describe('grantPermission', () => {
    it('should grant permission to user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

      await expect(permissionService.grantPermission('user1', 'create:articles')).resolves.not.toThrow()
    })
  })

  describe('revokePermission', () => {
    it('should revoke permission from user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

      await expect(permissionService.revokePermission('user1', 'delete:articles')).resolves.not.toThrow()
    })
  })
})
