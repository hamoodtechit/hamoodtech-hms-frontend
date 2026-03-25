"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { AlertCircle } from "lucide-react";
import React from "react";

interface PermissionGuardProps {
    permission?: string | string[];
    module?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function PermissionGuard({ 
    permission, 
    module, 
    fallback, 
    children 
}: PermissionGuardProps) {
    const { hasPermission, hasModuleAccess } = usePermissions();

    let hasAccess = true;

    // Check module access if defined
    if (module) {
        hasAccess = hasModuleAccess(module);
    }

    // Check specific permission if defined (and not already granted by module)
    if (permission) {
        if (Array.isArray(permission)) {
            hasAccess = hasAccess && permission.some(p => hasPermission(p));
        } else {
            hasAccess = hasAccess && hasPermission(permission);
        }
    }

    if (!hasAccess) {
        if (fallback) return <>{fallback}</>;

        // Default "Access Denied" view
        return (
            <div className="h-[400px] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-destructive/10 p-4 rounded-full mb-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground max-w-md">
                    You do not have the required permissions to view this content. 
                    Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
