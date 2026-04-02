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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useImportAttendance } from "@/hooks/hr-queries"
import { FileUp, Loader2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ImportAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branchId: string
    onSuccess?: () => void
}

export function ImportAttendanceDialog({ open, onOpenChange, branchId, onSuccess }: ImportAttendanceDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const importMutation = useImportAttendance()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            const fileType = selectedFile.name.split('.').pop()?.toLowerCase()
            
            if (fileType !== 'csv' && fileType !== 'xlsx' && fileType !== 'xls') {
                toast.error("Please select a CSV or Excel file")
                return
            }
            
            setFile(selectedFile)
        }
    }

    const handleImport = async () => {
        if (!file) {
            toast.error("Please select a file to import")
            return
        }

        if (!branchId) {
            toast.error("No branch selected. Please select a branch first.")
            return
        }

        setUploading(true)
        try {
            await importMutation.mutateAsync({ branchId, file })
            toast.success("Attendance records imported successfully")
            onSuccess?.()
            onOpenChange(false)
            setFile(null)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to import attendance")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileUp className="h-5 w-5" />
                        Import Attendance
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file to bulk import attendance records.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="file" className="text-sm font-medium">
                            Attendance File (CSV, XLSX)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="file"
                                type="file"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                        </div>
                        {file && (
                            <div className="flex items-center justify-between bg-muted p-2 rounded text-xs">
                                <span className="truncate max-w-[250px]">{file.name}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={() => setFile(null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground italic">
                            Maximum file size: 5MB. Ensure the columns match the expected format.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!file || uploading}>
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {uploading ? "Importing..." : "Start Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
