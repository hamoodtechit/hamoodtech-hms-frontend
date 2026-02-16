"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { roleService } from "@/services/role-service"
import { Permission, PermissionModule, Role } from "@/types/role"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface RoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  roleToEdit?: Role | null
}

export function RoleDialog({
  open,
  onOpenChange,
  onSuccess,
  roleToEdit
}: RoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissions, setPermissions] = useState<PermissionModule>({})
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch permissions on mount (or when dialog opens)
  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  // Populate form if editing
  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name)
      setDescription(roleToEdit.description)
      // If editing, we might need to fetch role details to get permissions if they aren't in the list view
      // But typically list view might not have full permission list. 
      // Let's assume we need to fetch details if permissionsByModule is missing
      if (roleToEdit.permissionsByModule) {
        const ids: string[] = []
        Object.values(roleToEdit.permissionsByModule).forEach(modulePerms => {
          modulePerms.forEach(p => ids.push(p.id))
        })
        setSelectedPermissions(ids)
      } else {
        // Fetch details
        roleService.getRole(roleToEdit.id).then(response => {
           const ids: string[] = []
            if (response.data.permissionsByModule) {
                Object.values(response.data.permissionsByModule).forEach(modulePerms => {
                modulePerms.forEach(p => ids.push(p.id))
                })
            }
           setSelectedPermissions(ids)
        })
      }
    } else {
      setName("")
      setDescription("")
      setSelectedPermissions([])
    }
  }, [roleToEdit, open])

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true)
      const response = await roleService.getPermissions()
      setPermissions(response.data)
    } catch (error) {
      toast.error("Failed to load permissions")
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
        toast.error("Role name is required")
        return
    }

    try {
      setSaving(true)
      const payload = {
        name,
        description,
        permissionIds: selectedPermissions
      }

      if (roleToEdit) {
        await roleService.updateRole(roleToEdit.id, payload)
        toast.success("Role updated successfully")
      } else {
        await roleService.createRole(payload)
        toast.success("Role created successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to save role")
    } finally {
      setSaving(false)
    }
  }

  const [expandedModules, setExpandedModules] = useState<string[]>([])

  const toggleModuleAccordion = (moduleName: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleName) ? prev.filter(m => m !== moduleName) : [...prev, moduleName]
    )
  }

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleModulePermissions = (moduleName: string, modulePerms: Permission[]) => {
    const allSelected = modulePerms.every(p => selectedPermissions.includes(p.id))
    if (allSelected) {
      // Deselect all
      const idsToRemove = modulePerms.map(p => p.id)
      setSelectedPermissions(prev => prev.filter(p => !idsToRemove.includes(p)))
    } else {
      // Select all
      const idsToAdd = modulePerms.map(p => p.id)
      setSelectedPermissions(prev => [...new Set([...prev, ...idsToAdd])])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{roleToEdit ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            Configure role details and assign permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pharmacy Manager"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role's responsibilities..."
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="border rounded-md overflow-hidden">
                {loadingPermissions ? (
                    <div className="p-8 flex justify-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading permissions...
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                            {Object.entries(permissions).map(([moduleName, modulePerms]) => {
                                const selectedCount = modulePerms.filter(p => selectedPermissions.includes(p.id)).length
                                const totalCount = modulePerms.length
                                const isAllSelected = selectedCount === totalCount
                                const isExpanded = expandedModules.includes(moduleName)

                                return (
                                    <div key={moduleName} className="flex flex-col">
                                        <button 
                                            type="button"
                                            className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors w-full text-left"
                                            onClick={() => toggleModuleAccordion(moduleName)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                <span className="capitalize font-medium">{moduleName}</span>
                                            </div>
                                            <Badge variant={selectedCount > 0 ? "secondary" : "outline"} className="text-xs">
                                                {selectedCount}/{totalCount}
                                            </Badge>
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-2 bg-muted/5 border-t">
                                                <div className="flex items-center justify-end mb-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 text-xs"
                                                        onClick={() => toggleModulePermissions(moduleName, modulePerms)}
                                                    >
                                                        {isAllSelected ? "Deselect All" : "Select All"}
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {modulePerms.map(perm => (
                                                        <div key={perm.id} className="flex items-start space-x-2 border p-2 rounded bg-background hover:bg-accent/50 transition-colors">
                                                            <Checkbox 
                                                                id={perm.id} 
                                                                checked={selectedPermissions.includes(perm.id)}
                                                                onCheckedChange={() => togglePermission(perm.id)}
                                                            />
                                                            <div className="grid gap-0.5 leading-none">
                                                                <label
                                                                    htmlFor={perm.id}
                                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                >
                                                                    {perm.description || perm.key}
                                                                </label>
                                                                <span className="text-xs text-muted-foreground font-mono">{perm.key}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {roleToEdit ? "Update Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
