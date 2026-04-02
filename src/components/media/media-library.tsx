"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mediaService } from "@/services/media-service"
import { Media } from "@/types/media"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileIcon, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function MediaLibrary({ onSelect, search }: { onSelect: (media: Media) => void, search: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ['media', { search }],
        queryFn: () => mediaService.getMedia({ search, limit: 50 })
    })

    const deleteMutation = useMutation({
        mutationFn: mediaService.deleteMedia,
        onSuccess: () => {
            toast.success("File deleted")
            queryClient.invalidateQueries({ queryKey: ['media'] })
        }
    })
    const queryClient = useQueryClient()

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    const files = data?.data || []

    return (
        <ScrollArea className="h-full">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
                {files.map((file) => (
                    <div 
                        key={file.id} 
                        className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary hover:shadow-md transition-all aspect-square"
                        onClick={() => onSelect(file)}
                    >
                        <div className="absolute inset-0 bg-secondary/10" />
                        
                        {file.mimeType?.startsWith('image/') ? (
                            <img src={file.url} alt={file.fileName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                <FileIcon className="h-12 w-12 mb-2" />
                                <span className="text-xs truncate max-w-[90%] px-2">{file.fileName}</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <Button size="sm" variant="secondary">Select</Button>
                        </div>
                    </div>
                ))}
                
                {files.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                        <p>No media found</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
