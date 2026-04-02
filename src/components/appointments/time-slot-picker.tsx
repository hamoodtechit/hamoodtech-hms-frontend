"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Clock, Moon, Sun, Sunrise } from "lucide-react"
import { useMemo } from "react"

interface TimeSlotPickerProps {
    value: string
    onChange: (time: string) => void
    startTime?: string // "08:00"
    endTime?: string   // "20:00"
    duration?: number  // 30
}

export function TimeSlotPicker({ 
    value, 
    onChange, 
    startTime = "08:00", 
    endTime = "21:00", 
    duration = 30 
}: TimeSlotPickerProps) {
    
    const slots = useMemo(() => {
        const result = {
            morning: [] as string[],
            afternoon: [] as string[],
            evening: [] as string[]
        }

        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)

        let currH = startH
        let currM = startM

        while (currH < endH || (currH === endH && currM < endM)) {
            const ampm = currH >= 12 ? 'PM' : 'AM'
            const h12 = currH > 12 ? currH - 12 : (currH === 0 ? 12 : currH)
            const timeStr = `${h12}:${currM === 0 ? '00' : currM.toString().padStart(2, '0')} ${ampm}`
            
            if (currH < 12) {
                result.morning.push(timeStr)
            } else if (currH < 17) {
                result.afternoon.push(timeStr)
            } else {
                result.evening.push(timeStr)
            }

            currM += duration
            if (currM >= 60) {
                currH += Math.floor(currM / 60)
                currM = currM % 60
            }
        }

        return result
    }, [startTime, endTime, duration])

    const activeTab = useMemo(() => {
        if (!value) return "morning"
        if (slots.morning.includes(value)) return "morning"
        if (slots.afternoon.includes(value)) return "afternoon"
        if (slots.evening.includes(value)) return "evening"
        return "morning"
    }, [value, slots])

    const SlotGrid = ({ times }: { times: string[] }) => (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-4">
            {times.map((time) => (
                <Button
                    key={time}
                    variant={value === time ? "default" : "outline"}
                    className={cn(
                        "h-10 text-xs font-medium transition-all",
                        value === time ? "ring-2 ring-primary ring-offset-2" : "hover:border-primary/50"
                    )}
                    onClick={() => onChange(time)}
                >
                    {time}
                </Button>
            ))}
            {times.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                    No slots available for this period.
                </div>
            )}
        </div>
    )

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Select Time Slot</span>
                {value && (
                    <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Selected: {value}
                    </span>
                )}
            </div>

            <Tabs defaultValue={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-11 bg-background/50 p-1">
                    <TabsTrigger value="morning" className="gap-2">
                        <Sunrise className="h-4 w-4" />
                        <span className="hidden sm:inline">Morning</span>
                    </TabsTrigger>
                    <TabsTrigger value="afternoon" className="gap-2">
                        <Sun className="h-4 w-4" />
                        <span className="hidden sm:inline">Afternoon</span>
                    </TabsTrigger>
                    <TabsTrigger value="evening" className="gap-2">
                        <Moon className="h-4 w-4" />
                        <span className="hidden sm:inline">Evening</span>
                    </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[200px] mt-2 rounded-lg border bg-background/50">
                    <div className="px-4">
                        <TabsContent value="morning">
                            <SlotGrid times={slots.morning} />
                        </TabsContent>
                        <TabsContent value="afternoon">
                            <SlotGrid times={slots.afternoon} />
                        </TabsContent>
                        <TabsContent value="evening">
                            <SlotGrid times={slots.evening} />
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    )
}
