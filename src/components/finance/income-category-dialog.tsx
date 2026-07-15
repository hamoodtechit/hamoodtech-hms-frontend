"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCreateIncomeCategory, useUpdateIncomeCategory, useIncomeCategories } from "@/hooks/income-queries"
import { IncomeCategory, IncomeCategoryPayload } from "@/types/income"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    nameBangla: z.string().optional(),
    description: z.string().optional(),
    parentId: z.string().optional(),
})

interface IncomeCategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: IncomeCategory | null
}

export function IncomeCategoryDialog({
    open,
    onOpenChange,
    category,
}: IncomeCategoryDialogProps) {
    const createMutation = useCreateIncomeCategory()
    const updateMutation = useUpdateIncomeCategory()
    const { data: categoriesRes, isLoading: categoriesLoading } = useIncomeCategories({ limit: 100 })
    const parentCategories = categoriesRes?.categories?.filter(c => c.id !== category?.id) || []

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            nameBangla: "",
            description: "",
            parentId: " ",
        },
    })

    useEffect(() => {
        if (category && open) {
            form.reset({
                name: category.name,
                nameBangla: category.nameBangla || "",
                description: category.description || "",
                parentId: category.parentId || " ",
            })
        } else if (open) {
            form.reset({
                name: "",
                nameBangla: "",
                description: "",
                parentId: " ",
            })
        }
    }, [category, open, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                ...values,
                parentId: values.parentId === " " ? null : values.parentId
            };
            if (category) {
                await updateMutation.mutateAsync({
                    id: category.id,
                    payload: payload,
                })
                toast.success("Category updated successfully")
            } else {
                await createMutation.mutateAsync(payload as IncomeCategoryPayload)
                toast.success("Category created successfully")
            }
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save category")
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={(open) => !isPending && onOpenChange(open)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit' : 'Create'} Income Category</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Consultation Fees" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="parentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parent Category (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger disabled={categoriesLoading}>
                                                <SelectValue placeholder="Select a parent category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value=" ">None (Main Category)</SelectItem>
                                            {parentCategories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
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
                            name="nameBangla"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bangla Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. পরামর্শ ফি" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Add details about this category..." 
                                            className="resize-none"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {category ? 'Update' : 'Create'} Category
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
