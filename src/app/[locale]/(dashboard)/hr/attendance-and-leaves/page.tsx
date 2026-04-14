"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, FileText, ClipboardList, BedDouble } from "lucide-react"

// Import the view components
import { AttendanceView } from "@/components/hr/views/attendance-view"
import { LeavesView } from "@/components/hr/views/leaves-view"
import { LeaveTypesView } from "@/components/hr/views/leave-types-view"
import { AnnualCalendarView } from "@/components/hr/views/annual-calendar-view"

export default function AttendanceAndLeavesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time & Attendance</h1>
        <p className="text-muted-foreground">
          Manage employee attendance, leave requests, leave types, and annual calendar.
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <div className="flex justify-center sm:justify-start mb-8">
            <TabsList className="h-11 bg-muted/40 p-1.5 rounded-[0.9rem] border border-white/20 inline-flex w-auto shadow-sm">
              <TabsTrigger 
                value="attendance" 
                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden md:inline">Attendance</span>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Leave Requests</span>
              </TabsTrigger>
              <TabsTrigger 
                value="types" 
                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden md:inline">Leave Types</span>
              </TabsTrigger>
              <TabsTrigger 
                value="holidays" 
                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden md:inline">Annual Calendar</span>
              </TabsTrigger>
            </TabsList>
        </div>
        
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
          <AnnualCalendarView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
