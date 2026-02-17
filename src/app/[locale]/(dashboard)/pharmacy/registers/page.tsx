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
import { useCashRegisters } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { ChevronLeft, ChevronRight, Loader2, RefreshCcw } from "lucide-react"
import { useState } from "react"

export default function CashRegisterHistoryPage() {
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const { activeStoreId } = useStoreContext()

  const { data: response, isLoading: loading, refetch, isPlaceholderData } = useCashRegisters({
    page,
    limit: 10,
    branchId: activeStoreId || undefined,
    status: status === "all" ? undefined : status
  })

  const sessions = response?.data || []
  const meta = response?.meta || null
  const totalPages = meta?.totalPages || 1

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
            <Select value={status} onValueChange={(val: string) => {
                setStatus(val)
                setPage(1)
            }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={() => refetch()} variant="outline" size="icon" disabled={loading}>
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b mb-4">
          <CardTitle className="text-lg">All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !isPlaceholderData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground font-medium animate-pulse">Synchronizing history...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 border rounded-xl border-dashed bg-muted/20">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <RefreshCcw className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No sessions found</h3>
                <p className="text-muted-foreground">Adjust your filters or branch selection.</p>
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
                    <TableRow key={session.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        {session.user?.name || session.userId.split('-')[0]}
                      </TableCell>
                      <TableCell>{session.branch?.name || 'Main Branch'}</TableCell>
                      <TableCell>{new Date(session.openedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                            className="capitalize"
                            variant={session.status === 'open' ? 'default' : 'secondary'}
                        >
                          {session.status}
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
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!meta.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium bg-muted px-3 py-1 rounded-md">
                Page {meta.page} of {meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
