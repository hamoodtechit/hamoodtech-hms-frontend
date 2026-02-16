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
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { userService } from "@/services/user-service"
import { User } from "@/types/user"
import { Edit, Eye, Loader2, MoreHorizontal, Plus, Search, Trash2, User as UserIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UserDetailsDialog } from "./components/user-details-dialog"
import { UserDialog } from "./components/user-dialog"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch] = useDebounce(searchTerm, 500)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewUser, setViewUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const loadUsers = async () => {

    try {
      setLoading(true)
      const response = await userService.getUsers({ search: debouncedSearch })
      
      // Handle different possible response structures
      const userList = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.users 
        ? (response.data as any).users 
        : [];
        
      setUsers(userList)
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  // Effect to load users when search changes
  useEffect(() => {
    loadUsers()
  }, [debouncedSearch])

  const handleCreate = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingUser) return
    try {
      await userService.deleteUser(deletingUser.id)
      toast.success("User deleted successfully")
      loadUsers()
    } catch (error) {
      toast.error("Failed to delete user")
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingUser(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users, employees, and their access roles.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                    A list of all registered users in the system.
                </CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!users || users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                    users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{user.fullName} {user.fullNameBangla && `(${user.fullNameBangla})`}</span>
                                <span className="text-xs text-muted-foreground">{user.email || user.username}</span>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                             <Badge variant="secondary">{user.role?.name || 'No Role'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            {user.isActive ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                            ) : (
                                <Badge variant="destructive">Inactive</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => setViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(user)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
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

      <UserDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={loadUsers}
        userToEdit={editingUser}
      />
      
      <UserDetailsDialog 
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
        user={viewUser}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the user <strong>{deletingUser?.fullName}</strong>. 
                    This action cannot be undone.
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
