"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useSaleReturns, useUpdateSaleReturnStatus } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { format } from "date-fns"
import {
    CheckCircle2,
    Eye,
    Loader2,
    RefreshCcw,
    Search,
    XCircle
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function SalesReturnsPage() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data: returnsRes, isLoading } = useSaleReturns({
    page,
    limit: 10,
    search,
    branchId: activeStoreId || undefined
  })

  const updateStatus = useUpdateSaleReturnStatus()

  const returns = returnsRes?.data?.data || returnsRes?.data?.returns || []
  const pagination = returnsRes?.data?.pagination

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Return status updated to ${status}`)
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            Sales Returns
          </h2>
          <p className="text-muted-foreground">
            Manage product returns and customer refunds.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-orange-500" />
              Return Requests
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-primary/20 focus:border-primary transition-all rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-primary/5 transition-colors">
                      <TableCell className="font-medium">{item.invoiceNumber}</TableCell>
                      <TableCell>
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{item.patient?.name || "N/A"}</TableCell>
                      <TableCell className="font-bold text-orange-600">
                        {formatCurrency(Number(item.totalPrice))}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'destructive'}
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-all">
                              <Eye className="h-4 w-4" />
                           </Button>
                           {item.status === 'pending' && (
                             <>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/20"
                                 onClick={() => handleStatusUpdate(item.id, 'completed')}
                               >
                                  <CheckCircle2 className="h-4 w-4" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-red-500 hover:bg-red-500/20"
                                 onClick={() => handleStatusUpdate(item.id, 'rejected')}
                               >
                                  <XCircle className="h-4 w-4" />
                               </Button>
                             </>
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg"
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
