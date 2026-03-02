"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Media } from "@/types/media"
import { Search } from "lucide-react"
import { useState } from "react"
import { MediaLibrary } from "./media-library"
import { MediaUpload } from "./media-upload"

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
