
"use client";

import { useAuthStore } from "@/store/use-auth-store";

import { useCallback } from "react";

export function usePermissions() {
  const { user } = useAuthStore();

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;

    // 1. Check for super admin wildcard in direct permissions
    if (user.permissions && user.permissions.includes('*')) {
      return true;
    }

    // 2. Check Role name as a reliable fallback for Super Admin access
    const rawRoleName = user.role?.name?.toLowerCase() || '';
    const normalizedRoleName = rawRoleName.replace(/[\s\-_]+/g, '');
    
    if (
      normalizedRoleName === 'superadmin' || 
      normalizedRoleName === 'admin'
    ) {
      return true;
    }

    // 3. Check specific permissions in the role
    if (user.role && user.role.permissions) {
      // Check for wildcard inside role permissions array
      const hasWildcard = user.role.permissions.some(p => p.key === '*');
      if (hasWildcard) return true;

      // Check for specific key
      return user.role.permissions.some(p => p.key === permission);
    }

    return false;
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const isAdmin = useCallback(() => {
    if (!user) return false;

    // 1. Direct super admin wildcard
    if (user.permissions && user.permissions.includes('*')) return true;

    // 2. Role name matching (Exact match for Super Admin or Admin)
    const rawRoleName = user.role?.name?.toLowerCase() || '';
    const normalizedRoleName = rawRoleName.replace(/[\s\-_]+/g, '');
    
    return (
      normalizedRoleName === 'superadmin' || 
      normalizedRoleName === 'admin' || 
      (user.role?.permissions && user.role.permissions.some(p => p.key === '*'))
    );
  }, [user]);

  const hasModuleAccess = useCallback((moduleName: string) => {
    if (!user) return false;
    
    // 1. Admin bypass
    if (isAdmin()) return true;

    // 2. Check if any permission in the role matches this module
    if (user.role && user.role.permissions) {
        // If they have a wildcard permission, they have access to all modules
        if (user.role.permissions.some(p => p.key === '*')) return true;
        
        return user.role.permissions.some(p => p.module === moduleName);
    }
    return false;
  }, [user]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    isAdmin,
    user
  };
}
