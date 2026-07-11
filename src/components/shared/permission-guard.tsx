"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { AlertCircle, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PermissionGuardProps {
    permission?: string | string[];
    module?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
    mode?: 'page' | 'inline' | 'silent';
}

export function PermissionGuard({ 
    permission, 
    module, 
    fallback, 
    children,
    mode = 'page'
}: PermissionGuardProps) {
    const { hasPermission, hasModuleAccess } = usePermissions();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
        if (!isMounted) {
            if (mode === 'page') {
                return (
                    <div className="h-[400px] flex flex-col items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-50" />
                    </div>
                );
            }
            return null;
        }

        if (fallback) return <>{fallback}</>;

        // Handle different modes
        if (mode === 'silent') {
            return null;
        }

        if (mode === 'inline') {
            return (
                <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/5 text-destructive text-xs font-medium border border-destructive/10 animate-in fade-in duration-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Access Restricted</span>
                </div>
            );
        }

        // Default "page" mode - "Access Denied" view
        return (
            <div className="h-[400px] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6 pointer-events-none select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/Logo.png" alt="Logo" className="h-20 w-auto opacity-70 drop-shadow-sm" />
                </div>
                <div className="bg-destructive/10 p-4 rounded-full mb-4 ring-2 ring-destructive/5">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground max-w-md text-sm">
                    You do not have the required permissions to view this content. 
                    Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
