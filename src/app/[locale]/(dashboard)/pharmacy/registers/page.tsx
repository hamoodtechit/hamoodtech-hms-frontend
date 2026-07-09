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
import { Input } from "@/components/ui/input"
import { useCashRegisters, useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { ChevronLeft, ChevronRight, Loader2, RefreshCcw, Search, Store, User } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { RegisterDetailsDialog } from "@/components/pharmacy/registers/register-details-dialog"
import { FilterPopover } from "@/components/shared/filter-popover"
import { useEmployees } from "@/hooks/hr-queries"
import { Label } from "@/components/ui/label"

export default function CashRegisterHistoryPage() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [status, setStatus] = useState<string>("all")
  const [branchId, setBranchId] = useState<string>("all")
  const [userId, setUserId] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Sync with global store context initially or when it changes
  useEffect(() => {
    if (activeStoreId) {
        setBranchId(activeStoreId)
    }
  }, [activeStoreId])

  const { data: response, isLoading: loading, refetch, isPlaceholderData } = useCashRegisters({
    page,
    limit: 10,
    branchId: branchId === "all" ? undefined : branchId,
    userId: userId === "all" ? undefined : userId,
    status: status === "all" ? undefined : status,
    search: debouncedSearch || undefined
  })

  const { data: branchesRes } = useBranches({ limit: 100 })
  const branches = branchesRes?.data || []

  const { data: employeesRes } = useEmployees({ limit: 1000 })
  const employees = employeesRes?.data || []

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (branchId !== "all") count++
    if (status !== "all") count++
    if (userId !== "all") count++
    return count
  }, [branchId, status, userId])

  const handleReset = () => {
    setBranchId("all")
    setStatus("all")
    setUserId("all")
    setPage(1)
  }

  const sessions = response?.data || []
  const meta = response?.meta || null

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Register History
          </h2>
          <p className="text-muted-foreground mt-1">
            Track and audit all cash register sessions across branches.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search sessions..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="pl-9 h-10 rounded-xl bg-background/50 focus:border-primary transition-all shadow-sm"
                />
            </div>

            <FilterPopover 
                activeFilterCount={activeFilterCount}
                onReset={handleReset}
                title="Advanced Register Filters"
            >
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Branch Location</Label>
                        <Select value={branchId} onValueChange={(val: string) => {
                            setBranchId(val)
                            setPage(1)
                        }}>
                            <SelectTrigger className="w-full h-10 rounded-xl bg-background/50 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-primary/70" />
                                    <SelectValue placeholder="All Branches" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing By</Label>
                        <Select value={userId} onValueChange={(val: string) => {
                            setUserId(val)
                            setPage(1)
                        }}>
                            <SelectTrigger className="w-full h-10 rounded-xl bg-background/50 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary/70" />
                                    <SelectValue placeholder="All Cashiers" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cashiers</SelectItem>
                                {employees.map((e: any) => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Status</Label>
                        <Select value={status} onValueChange={(val: string) => {
                            setStatus(val)
                            setPage(1)
                        }}>
                            <SelectTrigger className="w-full h-10 rounded-xl bg-background/50 shadow-sm">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FilterPopover>

            <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="icon" 
                disabled={loading}
                className="h-10 w-10 rounded-xl shadow-sm hover:bg-primary/10 transition-colors"
            >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-primary/10 mb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Cash Register Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !isPlaceholderData ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground font-medium animate-pulse">Fetching history records...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20 border-primary/10">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <RefreshCcw className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No sessions found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2">Try adjusting your filters, branch selection, or search term.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Billing By</TableHead>
                    <TableHead className="font-bold">Branch Location</TableHead>
                    <TableHead className="font-bold">Opened At</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Opening Bal.</TableHead>
                    <TableHead className="text-right font-bold">Total Sales</TableHead>
                    <TableHead className="text-right font-bold">Final Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session: any) => (
                    <TableRow 
                        key={session.id} 
                        className="hover:bg-primary/5 transition-colors group cursor-pointer"
                        onClick={() => {
                            setSelectedId(session.id)
                            setDetailsOpen(true)
                        }}
                    >
                      <TableCell className="font-bold text-foreground/80">
                        <div className="flex flex-col">
                            <span>{session.user?.name || "System User"}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{session.userId.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background/50 border-primary/20">
                            {session.branch?.name || 'PATWARY GENERAL HOSPITAL'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {format(new Date(session.openedAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                            className="capitalize px-3"
                            variant={session.status === 'open' ? 'success' : 'warning'}
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatCurrency(Number(session.openingBalance))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-bold font-mono">
                        +{formatCurrency(Number(session.salesAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-primary">
                        {formatCurrency(Number(session.status === 'open' ? (Number(session.openingBalance) + Number(session.salesAmount || 0)) : session.actualBalance || 0))}
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

      <RegisterDetailsDialog 
        id={selectedId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
