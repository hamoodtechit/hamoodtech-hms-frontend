"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBranches } from "@/hooks/pharmacy-queries"
import { roleService } from "@/services/role-service"
import { userService } from "@/services/user-service"
import { Role } from "@/types/role"
import { User } from "@/types/user"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { RoleDialog } from "../../roles/components/role-dialog"

const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
    fullNameBangla: z.string().optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
    roleId: z.string().min(1, "Role is required"),
    branchId: z.string().optional(),
    employeeId: z.string().optional(),
    password: z.string().optional()
        .refine(val => !val || val.length >= 8, 'Password must be at least 8 characters')
        .refine(val => !val || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val), 'Password must contain uppercase, lowercase, and number'),
})

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    userToEdit: User | null
    defaultValues?: Partial<z.infer<typeof userSchema>>
}

export function UserDialog({ open, onOpenChange, onSuccess, userToEdit, defaultValues }: UserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])
    const [showPassword, setShowPassword] = useState(false)
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)

    const fetchRoles = async () => {
        try {
            const response = await roleService.getRoles()
            setRoles(response.data)
        } catch (error) {
            console.error("Failed to fetch roles", error)
        }
    }

    const { data: branchesRes } = useBranches({ limit: 100 })
    const branches = branchesRes?.data || []

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: "",
            email: "",
            fullName: "",
            fullNameBangla: "",
            phone: "",
            roleId: "",
            branchId: "",
            employeeId: "",
            designation: "",
            password: "",
        },
    })

    useEffect(() => {
        if (open) {
            fetchRoles()
        }
    }, [open])

    useEffect(() => {
        if (userToEdit) {
            form.reset({
                username: userToEdit.username,
                email: userToEdit.email,
                fullName: userToEdit.fullName,
                fullNameBangla: userToEdit.fullNameBangla || "",
                phone: userToEdit.phone || "",
                roleId: userToEdit.roleId,
                branchId: userToEdit.branchId || "",
                employeeId: userToEdit.employeeId || "",
                designation: userToEdit.designation || "",
                password: "",
            })
        } else if (defaultValues) {
            form.reset({
                ...form.getValues(),
                ...defaultValues,
            })
        } else {
            form.reset({
                username: "",
                email: "",
                fullName: "",
                fullNameBangla: "",
                phone: "",
                roleId: "",
                branchId: "",
                employeeId: "",
                designation: "",
                password: "",
            })
        }
    }, [userToEdit, defaultValues, form, open])

    const onSubmit = async (values: z.infer<typeof userSchema>) => {
        try {
            setLoading(true)
            if (userToEdit) {
                await userService.updateUser(userToEdit.id, values)
                toast.success("User updated successfully")
            } else {
                if (!values.password) {
                     toast.error("Password is required for new users")
                     return
                }
                await userService.createUser(values as any)
                toast.success("User created successfully")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error(userToEdit ? "Failed to update user" : "Failed to create user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{userToEdit ? "Edit User" : "Create New User"}</DialogTitle>
                    <DialogDescription>
                        {userToEdit
                            ? "Update user details and role assignment."
                            : "Add a new user to the system. They will receive an email with login details."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fullNameBangla"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name (Bangla) - Optional</FormLabel>
                                    <FormControl>
                                        <Input placeholder="জন ডো" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="johndoe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="017xxxxxxxx" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="designation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Designation / Professional Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Senior Consultant Pathologist" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="roleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Role</FormLabel>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-5 px-1 text-primary hover:bg-primary/10"
                                                onClick={() => setRoleDialogOpen(true)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                New
                                            </Button>
                                        </div>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="branchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Branches" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="null">None (Super Admin)</SelectItem>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {!userToEdit && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder="******" 
                                                    {...field} 
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            Minimum 8 characters with uppercase, lowercase, and numbers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {userToEdit ? "Save Changes" : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>

                <RoleDialog 
                    open={roleDialogOpen}
                    onOpenChange={setRoleDialogOpen}
                    onSuccess={(newRole) => {
                        fetchRoles()
                        if (newRole?.id) {
                            form.setValue("roleId", newRole.id)
                        }
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
