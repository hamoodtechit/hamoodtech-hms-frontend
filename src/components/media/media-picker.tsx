"use client"

import { Button } from "@/components/ui/button"
import { Media } from "@/types/media"
import { ImagePlus, X } from "lucide-react"
import { useState } from "react"
import { MediaManagerModal } from "./media-manager-modal"

interface MediaPickerProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  compact?: boolean
}

export function MediaPicker({ value, onChange, disabled, compact = false }: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  const onSelect = (media: Media) => {
    onChange(media.url)
    setOpen(false)
  }

  return (
    <div className="space-y-4">
        <MediaManagerModal 
            open={open} 
            onOpenChange={setOpen} 
            onSelect={onSelect} 
        />
        
        {value ? (
            <div className={`relative border rounded-lg overflow-hidden group ${compact ? "h-28 w-full" : "w-40 h-40"}`}>
                <div className="absolute top-2 right-2 z-10">
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onChange("")}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <img 
                    src={value} 
                    alt="Selected media" 
                    className="w-full h-full object-cover"
                />
            </div>
        ) : (
            <Button 
                type="button" 
                variant="outline" 
                className={compact
                    ? "h-24 w-full flex-row gap-2 border-dashed text-muted-foreground hover:text-foreground"
                    : "w-40 h-40 flex flex-col gap-2 border-dashed"
                }
                onClick={() => setOpen(true)}
                disabled={disabled}
            >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{compact ? "Choose attachment" : "Select Image"}</span>
            </Button>
        )}
    </div>
  )
}
