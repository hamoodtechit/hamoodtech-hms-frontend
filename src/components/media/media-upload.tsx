"use client"

import { mediaService } from "@/services/media-service"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CloudUpload, Loader2 } from "lucide-react"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

export function MediaUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
    const queryClient = useQueryClient()
    const uploadMutation = useMutation({
        mutationFn: mediaService.uploadMultipleMedia,
        onSuccess: () => {
            toast.success("Files uploaded successfully")
            queryClient.invalidateQueries({ queryKey: ['media'] })
            onUploadComplete()
        },
        onError: () => {
            toast.error("Failed to upload files")
        }
    })

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            uploadMutation.mutate(acceptedFiles)
        }
    }, [uploadMutation])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div 
                {...getRootProps()} 
                className={`
                    w-full max-w-xl h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}
                `}
            >
                <input {...getInputProps()} />
                {uploadMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading files...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="p-4 rounded-full bg-primary/10">
                            <CloudUpload className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 10MB)</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
