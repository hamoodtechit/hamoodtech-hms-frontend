"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mediaService } from "@/services/media-service"
import { Media } from "@/types/media"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CloudUpload, FileIcon, Image as ImageIcon, Loader2, Search } from "lucide-react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

interface MediaManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: Media) => void
}

export function MediaManagerModal({ open, onOpenChange, onSelect }: MediaManagerModalProps) {
  const [activeTab, setActiveTab] = useState("library")
  const [search, setSearch] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Media Manager</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b bg-muted/30 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            
            {activeTab === 'library' && (
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search files..." 
                        className="pl-9 h-9" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}
          </div>
          
          <TabsContent value="library" className="flex-1 p-0 m-0 overflow-hidden">
            <MediaLibrary onSelect={onSelect} search={search} />
          </TabsContent>
          
          <TabsContent value="upload" className="flex-1 p-0 m-0 overflow-hidden">
            <MediaUpload onUploadComplete={() => setActiveTab("library")} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function MediaLibrary({ onSelect, search }: { onSelect: (media: Media) => void, search: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ['media', { search }],
        queryFn: () => mediaService.getMedia({ search, limit: 50 })
    })

    const deleteMutation = useMutation({
        mutationFn: mediaService.deleteMedia,
        onSuccess: () => {
            toast.success("File deleted")
            // Invalidate query
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

function MediaUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
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
