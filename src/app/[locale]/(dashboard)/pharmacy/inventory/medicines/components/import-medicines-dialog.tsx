import { Button } from "@/components/ui/button"
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
import { useImportMedicines } from "@/hooks/pharmacy-queries"
import { Upload, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ImportMedicinesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ImportMedicinesDialog({ open, onOpenChange }: ImportMedicinesDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const importMutation = useImportMedicines()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload")
            return
        }

        try {
            const response = await importMutation.mutateAsync(file)
            
            if (response.success) {
                toast.success(response.message || "Medicines imported successfully")
                handleClose()
            } else {
                toast.error(response.message || "Failed to import medicines")
            }
        } catch (error: any) {
            console.error("Import error:", error)
            toast.error(error.response?.data?.message || "An error occurred during import")
        }
    }

    const handleClose = () => {
        setFile(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Medicines</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file to import medicines in bulk. 
                        The file should contain the necessary columns like Name, Generic Name, etc.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="file" className="text-right">
                            Select Excel File
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="file"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                                 disabled={importMutation.isPending}
                            />
                        </div>
                    </div>
                     {file && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            <Upload className="h-4 w-4" />
                            <span className="truncate flex-1">{file.name}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => setFile(null)}
                                disabled={importMutation.isPending}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={importMutation.isPending}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleUpload} disabled={!file || importMutation.isPending}>
                        {importMutation.isPending ? "Importing..." : "Import"}
                        {!importMutation.isPending && <Upload className="ml-2 h-4 w-4" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
