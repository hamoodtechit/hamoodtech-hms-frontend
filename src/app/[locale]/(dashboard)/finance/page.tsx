"use client"

import { AccountDialog } from "@/components/finance/account-dialog"
import { ExpenseCategoryList } from "@/components/finance/expense-category-list"
import { ExpenseList } from "@/components/finance/expense-list"
import { FundTransferDialog } from "@/components/finance/fund-transfer-dialog"
import { TransactionList } from "@/components/finance/transaction-list"
import { WithdrawDialog } from "@/components/finance/withdraw-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useDeleteFinanceAccount, useFinanceAccounts } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { usePermissions } from "@/hooks/use-permissions"
import { Link } from "@/i18n/navigation"
import { AccountGroup, FinanceAccount } from "@/types/finance"
import { Activity, ArrowLeftRight, ArrowUpRight, Ban, CheckCircle, CreditCard, DollarSign, Edit, Eye, Loader2, Plus, Trash2, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function FinancePage() {
    const { hasPermission } = usePermissions()
    const { formatCurrency } = useCurrency()
    const [mounted, setMounted] = useState(false)
    const [withdrawAccount, setWithdrawAccount] = useState<FinanceAccount | null>(null)
    const [accountDialogOpen, setAccountDialogOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null)
    const [transferDialogOpen, setTransferDialogOpen] = useState(false)
    const [groupFilter, setGroupFilter] = useState<AccountGroup | 'all'>('all')

    const { data, isLoading, refetch } = useFinanceAccounts({ limit: 100 })
    const deleteAccountMutation = useDeleteFinanceAccount()

    useEffect(() => {
        setMounted(true)
    }, [])

    const accounts = data?.data || []
    const filteredAccounts = groupFilter === 'all' ? accounts : accounts.filter(a => a.group === groupFilter)

    if (!mounted) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            </div>
        )
    }

    return (
        <PermissionGuard permission="account:read">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
                    <p className="text-muted-foreground">Manage accounts, balances, and hospital expenses.</p>
                </div>

                <Tabs defaultValue="accounts" className="w-full">
                    <div className="flex justify-center sm:justify-start mb-8">
                        <TabsList className="h-11 bg-muted/40 p-1.5 rounded-[0.9rem] border border-white/20 inline-flex w-auto shadow-sm">
                            <TabsTrigger 
                                value="accounts" 
                                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
                            >
                                <Wallet className="h-4 w-4" />
                                Accounts
                            </TabsTrigger>
                            {hasPermission('transaction:read') && (
                                <TabsTrigger 
                                    value="transactions" 
                                    className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
                                >
                                    <Activity className="h-4 w-4" />
                                    Transactions
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="accounts" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            formatCurrency(
                                                accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0)
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Financial Accounts</CardTitle>
                                    <CardDescription>
                                        List of all financial accounts and their current status.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Group Filter */}
                                    <Select value={groupFilter} onValueChange={(v: any) => setGroupFilter(v)}>
                                        <SelectTrigger className="w-[160px] h-9">
                                            <SelectValue placeholder="All Groups" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Groups</SelectItem>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                            <SelectItem value="hospital">Hospital</SelectItem>
                                            <SelectItem value="ambulance">Ambulance</SelectItem>
                                            <SelectItem value="administration">Administration</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {hasPermission('transaction:transfer') && (
                                        <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
                                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                                            Fund Transfer
                                        </Button>
                                    )}
                                    {hasPermission('account:create') && (
                                        <Button onClick={() => {
                                            setSelectedAccount(null)
                                            setAccountDialogOpen(true)
                                        }}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Account
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredAccounts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    No accounts found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAccounts.map((account) => (
                                                <TableRow key={account.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-primary/10 rounded-full">
                                                                {account.type === 'cash' ? <Wallet className="h-4 w-4 text-primary" /> : <CreditCard className="h-4 w-4 text-primary" />}
                                                            </div>
                                                            <div>
                                                                <div>{account.name}</div>
                                                                <div className="text-xs text-muted-foreground">{account.description}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="capitalize">{account.type}</TableCell>
                                                    <TableCell>
                                                        {account.group ? (
                                                            <Badge variant="outline" className="capitalize text-xs">
                                                                {account.group}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {account.isActive ? (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                                                <Ban className="w-3 h-3 mr-1" /> Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {formatCurrency(Number(account.currentBalance))}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={`/finance/accounts/${account.id}`}>
                                                                <Button variant="outline" size="sm">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            {hasPermission('transaction:withdraw') && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => setWithdrawAccount(account)}
                                                                >
                                                                    <ArrowUpRight className="mr-2 h-4 w-4" />
                                                                    Withdraw
                                                                </Button>
                                                            )}
                                                            {hasPermission('account:update') && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedAccount(account)
                                                                        setAccountDialogOpen(true)
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4 text-primary" />
                                                                </Button>
                                                            )}
                                                            {hasPermission('account:delete') && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    disabled={deleteAccountMutation.isPending}
                                                                    onClick={async () => {
                                                                        if (confirm("Are you sure you want to delete this account?")) {
                                                                            try {
                                                                                await deleteAccountMutation.mutateAsync(account.id)
                                                                                toast.success("Account deleted successfully")
                                                                            } catch (error) {
                                                                                toast.error("Failed to delete account")
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transactions">
                        <PermissionGuard permission="transaction:read" mode="silent">
                            <TransactionList />
                        </PermissionGuard>
                    </TabsContent>

                </Tabs>

                 <WithdrawDialog 
                    open={!!withdrawAccount} 
                    onOpenChange={(open) => !open && setWithdrawAccount(null)}
                    account={withdrawAccount}
                    onSuccess={() => {
                        refetch()
                        setWithdrawAccount(null)
                    }}
                />

                <FundTransferDialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                    accounts={accounts}
                    onSuccess={() => {
                        refetch()
                    }}
                />

                <AccountDialog 
                    open={accountDialogOpen}
                    onOpenChange={setAccountDialogOpen}
                    account={selectedAccount}
                    onSuccess={() => {
                        refetch()
                        setSelectedAccount(null)
                    }}
                />
            </div>
        </PermissionGuard>
    )
}
