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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { roleService } from "@/services/role-service"
import { userService } from "@/services/user-service"
import { Role } from "@/types/role"
import { CreateUserPayload, User } from "@/types/user"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
    roleId: z.string().min(1, "Role is required"),
    password: z.string().optional(),
})

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    userToEdit: User | null
}

export function UserDialog({ open, onOpenChange, onSuccess, userToEdit }: UserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: "",
            email: "",
            fullName: "",
            roleId: "",
            password: "",
        },
    })

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await roleService.getRoles()
                setRoles(response.data)
            } catch (error) {
                console.error("Failed to fetch roles", error)
            }
        }
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
                roleId: userToEdit.roleId,
                password: "", // Password not editable directly or hidden
            })
        } else {
            form.reset({
                username: "",
                email: "",
                fullName: "",
                roleId: "",
                password: "",
            })
        }
    }, [userToEdit, form, open])

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
                await userService.createUser(values as CreateUserPayload)
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
                            name="roleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        {!userToEdit && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
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
            </DialogContent>
        </Dialog>
    )
}
