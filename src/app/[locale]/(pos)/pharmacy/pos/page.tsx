"use client"

import { CartContents } from "@/components/pharmacy/pos/cart-contents"
import { InteractionAlert } from "@/components/pharmacy/pos/interaction-alert"
import { PrescriptionLinkDialog } from "@/components/pharmacy/pos/prescription-link-dialog"
import { ReceiptDialog } from "@/components/pharmacy/receipt-dialog"
import { TransactionHistory } from "@/components/pharmacy/transaction-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { useDrugInteraction } from "@/hooks/use-drug-interaction"
import { Link } from "@/i18n/navigation"
import { usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { ChevronLeft, ChevronRight, Info, LayoutGrid, List, Loader2, LogOut, Pill, Search, ShoppingCart } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { StoreSwitcher } from "@/components/layout/store-switcher"
import { CloseRegisterDialog } from "@/components/pharmacy/pos/close-register-dialog"
import { OpenRegisterDialog } from "@/components/pharmacy/pos/open-register-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useActiveCashRegister, useCreateSale, useInfiniteMedicines, usePharmacyEntities } from "@/hooks/pharmacy-queries"
import { patientService } from "@/services/patient-service"
import { Medicine, Patient } from "@/types/pharmacy"

const getGenericColor = (name: string) => {
    const colors = [
        'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 hover:border-red-200 dark:hover:border-red-900/40',
        'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20 hover:border-orange-200 dark:hover:border-orange-900/40',
        'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 hover:border-amber-200 dark:hover:border-amber-900/40',
        'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-900/40',
        'bg-lime-50/50 dark:bg-lime-900/10 border-lime-100 dark:border-lime-900/20 hover:border-lime-200 dark:hover:border-lime-900/40',
        'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 hover:border-green-200 dark:hover:border-green-900/40',
        'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-900/40',
        'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/20 hover:border-teal-200 dark:hover:border-teal-900/40',
        'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-900/20 hover:border-cyan-200 dark:hover:border-cyan-900/40',
        'bg-sky-50/50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-900/20 hover:border-sky-200 dark:hover:border-sky-900/40',
        'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 hover:border-blue-200 dark:hover:border-blue-900/40',
        'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-900/40',
        'bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/20 hover:border-violet-200 dark:hover:border-violet-900/40',
        'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20 hover:border-purple-200 dark:hover:border-purple-900/40',
        'bg-fuchsia-50/50 dark:bg-fuchsia-900/10 border-fuchsia-100 dark:border-fuchsia-900/20 hover:border-fuchsia-200 dark:hover:border-fuchsia-900/40',
        'bg-pink-50/50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/20 hover:border-pink-200 dark:hover:border-pink-900/40',
        'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 hover:border-rose-200 dark:hover:border-rose-900/40',
    ];
    if (!name) return 'bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800'; // Default
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export default function POSPage() {
  const { cart, addToCart, clearCart, addTransaction, activeRegister: storeActiveRegister, setActiveRegister } = usePosStore()
  
  // State
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch] = useDebounce(searchQuery, 500)
  const [activeCategory, setActiveCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [discount, setDiscount] = useState(5) // Default 5% discount
  const [discountFixedAmount, setDiscountFixedAmount] = useState(0)
  
  const tabsListRef = useRef<HTMLDivElement>(null)

  const { activeStoreId } = useStoreContext()
  const [openRegisterOpen, setOpenRegisterOpen] = useState(false)
  const [closeRegisterOpen, setCloseRegisterOpen] = useState(false)
  const { fetchSettings, pharmacy, finance } = useSettingsStore()
  const pharmacyFinance = finance // Alias for clarity if needed, or just use finance directly

  // React Query Hooks
  const { data: categoriesRes } = usePharmacyEntities('categories', { limit: 100 })
  const categories = ["All", ...(categoriesRes?.data?.map(c => c.name) || [])]

  const { data: sessionRes, isLoading: loadingSession } = useActiveCashRegister(activeStoreId)
  const activeRegister = sessionRes?.data || null

  // Determine active category ID
  const activeCategoryId = activeCategory === "All" 
    ? undefined 
    : categoriesRes?.data?.find(c => c.name === activeCategory)?.id

  const { 
    data: productsRes, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loadingProducts,
  } = useInfiniteMedicines({ 
    search: debouncedSearch, 
    limit: 12,
    categoryId: activeCategoryId,
  })

  const medicines = productsRes?.pages.flatMap(page => page.data) || []
  const createSaleMutation = useCreateSale()

  // Effects
  useEffect(() => {
    setIsMounted(true)
    fetchSettings()
  }, [])

  useEffect(() => {
    const loadDefaultPatient = async () => {
        try {
            // Try by ID first
            let patientData = null
            try {
                const defaultPatientRes = await patientService.getPatient('default-opd-patient')
                if (defaultPatientRes.success && defaultPatientRes.data) {
                    patientData = defaultPatientRes.data
                }
            } catch (e) {
                // Ignore if ID fetch fails
            }

            // If not found by ID, try searching by name
            if (!patientData) {
                const searchRes = await patientService.getPatients({ name: 'OPD Patient', limit: 1 })
                if (searchRes?.data && searchRes.data.length > 0) {
                    patientData = searchRes.data[0]
                }
            }

            if (patientData) {
                setSelectedCustomer(patientData)
            } else {
                console.warn("Default OPD Patient not found")
            }
        } catch (err) {
            console.warn("Could not load default patient", err)
        }
    }
    loadDefaultPatient()
  }, [])

  useEffect(() => {
    if (sessionRes && !sessionRes.data) {
        setOpenRegisterOpen(true)
    } else {
        setOpenRegisterOpen(false)
    }
    if (sessionRes?.data) {
        setActiveRegister(sessionRes.data)
    }
  }, [sessionRes])


  // Helpers
  const handleAddToCart = (medicine: Medicine) => {
    const activeBatch = medicine.stocks?.find(s => s.quantity > 0)
    
    if (!activeBatch && (medicine.stock || 0) <= 0) {
        toast.error("Item is out of stock")
        return
    }

    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: Number(medicine.salePrice),
      quantity: 1,
      stock: activeBatch?.quantity || medicine.stock || 0,
      batchNumber: activeBatch?.batchNumber,
      expiryDate: activeBatch?.expiryDate,
      medicineId: medicine.id,
      category: medicine.category?.name || 'Uncategorized'
    } as any)
  }

  // Filtered products are now handled by the backend query
  const filteredProducts = medicines

  // Calculations
  const { formatCurrency } = useCurrency()
  const vatPercentage = pharmacy?.vatPercentage || 0
  const subtotal = cart.reduce((sum, item) => {
    const itemSubtotal = item.price * item.quantity
    const itemDiscountAmount = item.discountAmount || 
      (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0)
    return sum + (itemSubtotal - itemDiscountAmount)
  }, 0)
  const tax = subtotal * (vatPercentage / 100) 
  const discountAmount = discountFixedAmount || (subtotal * discount) / 100
  const total = subtotal + tax - discountAmount
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  const { checkInteractions } = useDrugInteraction()
  const [showInteractionAlert, setShowInteractionAlert] = useState(false)
  const [currentInteractions, setCurrentInteractions] = useState<any[]>([])

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<any>('cash')
  const [paidAmount, setPaidAmount] = useState(0)

  // Sync paidAmount with total when total changes
  useEffect(() => {
    setPaidAmount(total)
  }, [total])

  const handleCheckout = () => {
      if (cart.length === 0) return

      const drugNames = cart.map(c => c.name.split(' ')[0])
      const interactions = checkInteractions(drugNames)

      if (interactions.length > 0) {
          setCurrentInteractions(interactions)
          setShowInteractionAlert(true)
          return
      }

      processTransaction()
  }

  const processTransaction = async () => {
      if (!activeStoreId) {
          toast.error("No active branch selected. Please select a store.")
          return
      }

      try {
          const dueAmount = Math.max(0, total - paidAmount)
          let paymentStatus: 'paid' | 'due' | 'partial' = 'paid'
          
          if (dueAmount >= total) {
              paymentStatus = 'due'
          } else if (dueAmount > 0) {
              paymentStatus = 'partial'
          }

          const salePayload = {
              branchId: activeStoreId,
              patientId: selectedCustomer?.id,
              status: "completed" as const,
              paymentStatus,
              paymentMethod,
              paidAmount,
              dueAmount,
              discountPercentage: discount,
              discountAmount: discountAmount,
              saleItems: cart.map(item => ({
                  medicineId: item.id,
                  itemName: item.name,
                  unit: "pcs",
                  price: item.price,
                  mrp: item.price,
                  quantity: item.quantity,
                  discountPercentage: item.discountPercentage,
                  discountAmount: item.discountAmount,
                  batchNumber: item.batchNumber || "BATCH-N/A",
                  expiryDate: item.expiryDate || new Date().toISOString()
              })),
              payments: [{
                  accountId: pharmacyFinance?.paymentMethodAccounts?.[paymentMethod]?.id || "",
                  amount: paidAmount,
                  paymentMethod: paymentMethod,
                  note: ""
              }],

          }

          const response = await createSaleMutation.mutateAsync(salePayload)
          
          const transaction = {
              id: response.data?.id || `TRX-${Date.now()}`,
              customerName: selectedCustomer ? selectedCustomer.name : "Walk-in Customer",
              items: [...cart],
              total,
              subtotal,
              tax,
              taxPercentage: pharmacy?.vatPercentage || 0,
              discount,
              paidAmount,
              dueAmount,
              date: new Date().toLocaleString(),
              status: "Completed" as const,
              paymentMethod
          }
          
          addTransaction(transaction)
          setLastTransaction(transaction)

          toast.success("Payment Processed Successfully!")
          setReceiptOpen(true)
          clearCart()
          setDiscount(0)
          setDiscountFixedAmount(0)
          setCartOpen(false) 
          
      } catch (error) {
          console.error(error)
          toast.error("Failed to process sale")
      }
  }

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  // Receipt State
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

  // Prescription Dialog State
  const [linkPrescriptionOpen, setLinkPrescriptionOpen] = useState(false)

  // Cart Sheet State (Controlled)
  const [cartOpen, setCartOpen] = useState(false)

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
        const scrollAmount = 200
        tabsListRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }
  }
  
  const handleLinkPrescription = (id: string) => {
      // In a real app, you'd fetch prescription details here
      console.log("Linked prescription:", id)
  }

  if (!isMounted) return null


  if (!activeStoreId && !loadingProducts) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
            <h2 className="text-2xl font-bold">No Branch Selected</h2>
            <p className="text-muted-foreground">Please select a branch to access the POS system.</p>
            <div className="flex gap-4">
                <StoreSwitcher />
                <Link href="/pharmacy">
                    <Button variant="outline">Exit POS</Button>
                </Link>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen p-2 gap-4 relative overflow-hidden bg-background">
            <ReceiptDialog 
                open={receiptOpen} 
                onOpenChange={setReceiptOpen} 
                transaction={lastTransaction} 
            />
            
            <InteractionAlert 
                open={showInteractionAlert} 
                onOpenChange={setShowInteractionAlert}
                interactions={currentInteractions}
                onProceed={() => {
                    setShowInteractionAlert(false)
                    processTransaction()
                }}
            />

            <PrescriptionLinkDialog 
                open={linkPrescriptionOpen}
                onOpenChange={setLinkPrescriptionOpen}
                onLink={handleLinkPrescription}
            />

            <OpenRegisterDialog 
                open={openRegisterOpen}
                onOpenChange={setOpenRegisterOpen}
                branchId={activeStoreId || ""}
            />

            <CloseRegisterDialog 
                open={closeRegisterOpen}
                onOpenChange={setCloseRegisterOpen}
                registerId={activeRegister?.id || ""}
            />

            {/* Mobile Cart Sheet (Controlled) */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetContent side="right" className="p-0 w-full sm:w-[400px]">
                    <SheetTitle className="sr-only">Cart</SheetTitle>
                    <CartContents 
                        onCheckout={handleCheckout}
                        customerDialogOpen={customerDialogOpen}
                        setCustomerDialogOpen={setCustomerDialogOpen}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        discount={discount}
                        setDiscount={setDiscount}
                        discountFixedAmount={discountFixedAmount}
                        setDiscountFixedAmount={setDiscountFixedAmount}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        paidAmount={paidAmount}
                        setPaidAmount={setPaidAmount}
                    />
                </SheetContent>
            </Sheet>
      
      {/* Product Section */}
      <div className="flex-1 flex flex-col h-full min-h-0 gap-4 pb-16 md:pb-0"> {/* Start pb-16 for mobile footer space */}
        {/* Header - Fixed Height */}
        <div className="flex-none flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm z-10">
            <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search medicines..."
                className="pl-9 bg-background/50 border-secondary-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                 <div className="flex-1 w-auto min-w-0 md:hidden relative flex items-center group">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 z-10 h-full w-8 bg-background/80 backdrop-blur-sm border-r rounded-r-none hover:bg-background"
                        onClick={() => scrollTabs('left')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                     <Tabs defaultValue="All" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                        <div 
                            ref={tabsListRef}
                            className="w-full overflow-x-auto no-scrollbar scroll-smooth px-8" // Add padding for buttons
                        >
                            <TabsList className="w-max justify-start">
                                {categories.map(cat => (
                                    <TabsTrigger key={cat} value={cat} className="flex-1 px-4">
                                        {cat}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                     </Tabs>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 z-10 h-full w-8 bg-background/80 backdrop-blur-sm border-l rounded-l-none hover:bg-background"
                        onClick={() => scrollTabs('right')}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>

                <div className="flex gap-2 flex-none">
                     {/* View Toggle */}
                    <div className="flex items-center bg-secondary/20 p-1 rounded-lg border">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("list")}
                            title="List View"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Link Prescription Button - Commented out for future use
                    <Button 
                        variant="outline" 
                        size="icon" 
                        title="Link Prescription"
                        onClick={() => setLinkPrescriptionOpen(true)}
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                    */}
                    <Link href="/pharmacy">
                        <Button variant="ghost" size="icon" className="text-muted-foreground mr-2" title="Exit POS">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    {/* StoreSwitcher removed as per user request */}
                    <TransactionHistory />
                    
                    {activeRegister && (
                        <>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" title="Session Info">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Session Summary</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your active register shift.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Opened At:</span>
                                            <span>{new Date(activeRegister.openedAt).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Opening Balance:</span>
                                            <span className="font-mono">{formatCurrency(activeRegister.openingBalance)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Sales Total ({activeRegister.salesCount}):</span>
                                            <span className="font-mono text-emerald-600">{formatCurrency(activeRegister.salesAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center font-bold">
                                            <span>Expected Cash:</span>
                                            <span className="font-mono">
                                                {formatCurrency(Number(activeRegister.openingBalance) + Number(activeRegister.salesAmount) - Number(activeRegister.expensesAmount || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    {activeRegister.sales && activeRegister.sales.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Transactions</h5>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {activeRegister.sales.slice(0, 5).map((sale) => (
                                                    <div key={sale.id} className="flex justify-between text-xs">
                                                        <span className="font-mono">{sale.invoiceNumber}</span>
                                                        <span className="font-medium">{formatCurrency(sale.totalPrice)}</span>
                                                    </div>
                                                ))}
                                                {activeRegister.sales.length > 5 && (
                                                    <p className="text-[10px] text-center text-muted-foreground italic">Showing last 5 sales</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeRegister.purchases && activeRegister.purchases.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Purchases</h5>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {activeRegister.purchases.slice(0, 5).map((purchase) => (
                                                    <div key={purchase.id} className="flex justify-between text-xs">
                                                        <span className="font-mono">{purchase.poNumber || 'N/A'}</span>
                                                        <span className="font-medium">{formatCurrency(purchase.totalPrice)}</span>
                                                    </div>
                                                ))}
                                                {activeRegister.purchases.length > 5 && (
                                                    <p className="text-[10px] text-center text-muted-foreground italic">Showing last 5 purchases</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Close Register"
                            onClick={() => setCloseRegisterOpen(true)}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                        </>
                    )}

                    {/* Mobile Cart Trigger (Header) */}
                    <Button 
                        className="md:hidden relative"
                        onClick={() => setCartOpen(true)}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-background" />
                        )}
                    </Button>
                </div>
            </div>
        </div>

        {/* Categories - Fixed Height */}
        <div className="flex-none">
            <Tabs defaultValue="All" className="w-full hidden md:block" onValueChange={setActiveCategory} value={activeCategory}>
                <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                    {categories.map(cat => (
                        <TabsTrigger 
                            key={cat} 
                            value={cat}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2"
                        >
                            {cat}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>

        {/* Scrollable Product Grid */}
        <ScrollArea className="flex-1 -mx-2 px-2 overflow-y-auto">
            {loadingProducts && medicines.length === 0 ? (
                <div className={`grid gap-4 pb-2 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-transparent shadow-sm">
                            {viewMode === 'grid' ? (
                                <>
                                    <CardHeader className="p-3 sm:p-4 bg-secondary/10">
                                        <div className="flex justify-between items-start">
                                            <Skeleton className="h-5 w-16" />
                                            <Skeleton className="h-4 w-10" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 sm:p-4 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <div className="flex items-end justify-between pt-2">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-3 w-10" />
                                        </div>
                                    </CardContent>
                                </>
                            ) : (
                                <div className="p-3 flex justify-between items-center">
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground font-medium">
                    No medicines found.
                </div>
            ) : (
                <>
                <div className={`pb-2 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col space-y-1'}`}>
                    {filteredProducts.map((product) => {
                        const cartItem = cart.find(item => item.id === product.id)
                        const quantity = cartItem ? cartItem.quantity : 0
                        const salePrice = Number(product.salePrice)
                        const colorClass = getGenericColor(product.genericName || '')
                        const showHeader = product.category?.name || quantity > 0

                        return (
                        <Card 
                            key={product.id} 
                            className={`cursor-pointer transition-all group overflow-hidden border shadow-sm ${
                                quantity > 0 ? 'border-primary ring-1 ring-primary/20' : colorClass
                            }`}
                            onClick={() => handleAddToCart(product)}
                        >
                            {viewMode === 'grid' ? (
                                // GRID VIEW RENDER
                                <>
                                    {showHeader && (
                                    <CardHeader className="p-2.5 bg-transparent relative border-b border-black/5 dark:border-white/5">
                                        <div className="flex justify-between items-start h-5">
                                            {product.category?.name && (
                                                <Badge variant="secondary" className="text-[10px] items-center gap-1 font-medium bg-background/80 backdrop-blur-sm px-1.5 h-5">
                                                    <Info className="h-3 w-3 text-primary" />
                                                    {product.category.name}
                                                </Badge>
                                            )}
                                            {quantity > 0 && (
                                                <Badge className="bg-primary text-primary-foreground text-[10px] shadow-sm animate-in zoom-in px-1.5 h-5 ml-auto">
                                                    {quantity}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    )}
                                    <CardContent className={`p-2.5 ${!showHeader ? 'pt-3' : ''}`}>
                                        <div className="space-y-0.5 mb-2">
                                            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors leading-tight" title={product.name}>
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center text-[10px] text-muted-foreground">
                                                <span className="truncate">{product.genericName}</span>
                                                <span className="mx-1">•</span>
                                                <span className="font-medium">{product.strength}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-end justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-muted-foreground leading-none mb-0.5">Price</span>
                                                <span className="font-bold text-base text-primary leading-none">{formatCurrency(salePrice)}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-muted-foreground mb-0.5">{(product.stock || 0)} left</span>
                                                <Button size="sm" className="h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ShoppingCart className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </>
                            ) : (
                                // LIST VIEW RENDER
                                <div className={`p-1.5 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${quantity > 0 ? 'bg-primary/5' : ''}`}>
                                    <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 border shadow-sm ${colorClass}`}>
                                        <Pill className="h-4 w-4 text-muted-foreground/70" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors leading-none">{product.name}</h3>
                                            <Badge variant="outline" className="text-[10px] h-3.5 px-1 py-0 border-muted bg-background/50">
                                                {product.strength}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                            <span className="truncate max-w-[200px] font-bold text-zinc-600 dark:text-zinc-400">{product.genericName}</span>
                                            {(product.stock || 0) <= 10 && (
                                                <span className="ml-2 text-amber-600 font-bold text-[9px] uppercase">{product.stock || 0} left</span>
                                            )}
                                        </div>
                                    </div>
    
                                    <div className="text-right shrink-0 flex flex-col items-end">
                                        <div className="font-bold text-primary text-sm leading-none">{formatCurrency(salePrice)}</div>
                                        <div className="text-[9px] text-muted-foreground mt-0.5">{(product.stock || 0)} in stock</div>
                                    </div>

                                    {quantity > 0 && (
                                        <Badge className="bg-primary text-primary-foreground text-[10px] shadow-sm h-5 px-1.5 min-w-[20px] justify-center ml-1">
                                            {quantity}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </Card>
                        )
                    })}
                </div>
                {/* Load More Button */}
                {hasNextPage && (
                     <div className="py-4 flex justify-center w-full">
                        <Button 
                            variant="outline" 
                            onClick={() => fetchNextPage()} 
                            disabled={isFetchingNextPage}
                            className="min-w-[150px]"
                        >
                            {isFetchingNextPage ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load More Medicines"
                            )}
                        </Button>
                     </div>
                )}
                </>
            )}
        </ScrollArea>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden md:flex flex-col w-[350px] lg:w-[400px] border-l bg-card rounded-xl shadow-sm overflow-hidden h-full"> 

         <CartContents 
            onCheckout={handleCheckout}
            customerDialogOpen={customerDialogOpen}
            setCustomerDialogOpen={setCustomerDialogOpen}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            discount={discount}
            setDiscount={setDiscount}
            discountFixedAmount={discountFixedAmount}
            setDiscountFixedAmount={setDiscountFixedAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
         />
      </div>

      {/* Fixed Mobile Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50">
          <Button 
            className="w-full h-14 text-lg shadow-lg flex justify-between items-center px-6" 
            onClick={() => setCartOpen(true)}
          >
              <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{itemCount} Items</span>
              </div>
              <span className="font-bold bg-white/20 px-3 py-1 rounded-md">
                {formatCurrency(total)}
              </span>
          </Button>
      </div>
    </div>
  )
}
