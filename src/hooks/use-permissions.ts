
import { useAuthStore } from "@/store/use-auth-store";

export function usePermissions() {
  const { user } = useAuthStore();

  const hasPermission = (permission: string) => {
    if (!user) return false;

    // Check for super admin wildcard
    if (user.permissions && user.permissions.includes('*')) {
      return true;
    }

    // Emergency Fallback: Allow 'Super Admin' or 'Admin' full access
    // This fixes the issue where legacy admins don't have granular permissions yet
    if (user.role && (user.role.name === 'Super Admin' || user.role.name === 'Admin' || user.role.name === 'PRO ADMIN')) {
        return true;
    }

    // Check role-based permissions
    if (user.role && user.role.permissions) {
      return user.role.permissions.some(p => p.key === permission);
    }

    return false;
  };

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    user
  };
}
