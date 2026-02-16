"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { CashRegister } from "@/types/pharmacy"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function CashRegisterHistoryPage() {
  const [sessions, setSessions] = useState<CashRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { activeStoreId } = useStoreContext()

  useEffect(() => {
    fetchSessions()
  }, [activeStoreId, status, page])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await pharmacyService.getCashRegisters({
        page,
        limit: 10,
        branchId: activeStoreId || undefined,
        status: status === "all" ? undefined : status
      })
      setSessions(response.data)
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch register sessions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Register History
          </h2>
          <p className="text-muted-foreground mt-1">
            Track and audit all cash register sessions across branches.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={fetchSessions} variant="outline" size="icon">
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Loading session history...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 border rounded-xl border-dashed">
                <p className="text-muted-foreground font-medium">No sessions found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Opened At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Closing/Current</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        {session.user?.name || session.userId.split('-')[0]}
                      </TableCell>
                      <TableCell>{session.branch?.name || 'Main Branch'}</TableCell>
                      <TableCell>{new Date(session.openedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === 'open' ? 'default' : 'secondary'}>
                          {session.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">${Number(session.openingBalance).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium font-mono">
                        +${Number(session.salesAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        ${Number(session.status === 'open' ? (Number(session.openingBalance) + Number(session.salesAmount || 0)) : session.actualBalance || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
