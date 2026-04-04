"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, FileText, ClipboardList, BedDouble } from "lucide-react"

// Import the view components
import { AttendanceView } from "@/components/hr/views/attendance-view"
import { LeavesView } from "@/components/hr/views/leaves-view"
import { LeaveTypesView } from "@/components/hr/views/leave-types-view"
import { HolidaysView } from "@/components/hr/views/holidays-view"

export default function AttendanceAndLeavesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time & Attendance</h1>
        <p className="text-muted-foreground">
          Manage employee attendance, leave requests, leave types, and holidays.
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full xl:w-3/4 grid-cols-4 mb-6">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Leave Requests</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Leave Types</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            <span className="hidden sm:inline">Holidays</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="mt-0 border-0 p-0">
          <AttendanceView />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-0 border-0 p-0">
          <LeavesView />
        </TabsContent>
        
        <TabsContent value="types" className="mt-0 border-0 p-0">
          <LeaveTypesView />
        </TabsContent>

        <TabsContent value="holidays" className="mt-0 border-0 p-0">
          <HolidaysView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
