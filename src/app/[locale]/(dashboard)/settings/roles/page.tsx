"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { roleService } from "@/services/role-service"
import { Role } from "@/types/role"
import { Edit, Loader2, MoreHorizontal, Plus, Shield, Trash2, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { RoleDialog } from "./components/role-dialog"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await roleService.getRoles()
      setRoles(response.data)
    } catch (error) {
      toast.error("Failed to load roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const handleCreate = () => {
    setEditingRole(null)
    setDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setDialogOpen(true)
  }

  const handleDeleteClick = (role: Role) => {
    if (role.isSystem) {
        toast.error("System roles cannot be deleted")
        return
    }
    setDeletingRole(role)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingRole) return
    try {
      await roleService.deleteRole(deletingRole.id)
      toast.success("Role deleted successfully")
      loadRoles()
    } catch (error) {
      toast.error("Failed to delete role")
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingRole(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage system roles and their descriptive access levels.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            A list of all roles currently defined in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading roles dynamically...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Permissions</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No roles found.
                        </TableCell>
                    </TableRow>
                ) : (
                    roles.map((role) => (
                    <TableRow key={role.id}>
                        <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            {role.name}
                        </div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate" title={role.description}>
                        {role.description}
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="secondary">{role.permissionCount || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                {role.userCount}
                            </div>
                        </TableCell>
                        <TableCell>
                        {role.isSystem ? (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize">
                                <Shield className="mr-1 h-3 w-3" /> System
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="capitalize">Custom</Badge>
                        )}
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(role)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Role
                            </DropdownMenuItem>
                            {!role.isSystem && (
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteClick(role)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                                </DropdownMenuItem>
                            )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RoleDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={loadRoles}
        roleToEdit={editingRole}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the <strong>{deletingRole?.name}</strong> role. 
                    This action cannot be undone. Users currently assigned this role may lose access.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
