"use client"

import { MediaLibrary } from "@/components/media/media-library"
import { MediaUpload } from "@/components/media/media-upload"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Media } from "@/types/media"
import { Search } from "lucide-react"
import { useState } from "react"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function MediaLibraryPage() {
    const [activeTab, setActiveTab] = useState("library")
    const [search, setSearch] = useState("")

    const handleSelect = (media: Media) => {
        // Show file details or copy URL
        window.open(media.url, '_blank')
    }

    return (
        <PermissionGuard permission="media:read">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
                        <p className="text-muted-foreground">Manage your hospital's digital assets, reports, and imagery.</p>
                    </div>
                </div>

                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden flex flex-col min-h-[600px]">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
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
                        
                        <div className="flex-1 overflow-hidden">
                            <TabsContent value="library" className="h-full m-0 p-0 border-none outline-none overflow-hidden">
                                <MediaLibrary onSelect={handleSelect} search={search} />
                            </TabsContent>
                            
                            <TabsContent value="upload" className="h-full m-0 p-0 border-none outline-none overflow-hidden">
                                <MediaUpload onUploadComplete={() => setActiveTab("library")} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>
            </div>
        </PermissionGuard>
    )
}
