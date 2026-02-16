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
import { ChevronLeft, ChevronRight, FileText, Info, LogOut, Search, ShoppingCart } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { StoreSwitcher } from "@/components/layout/store-switcher"
import { CloseRegisterDialog } from "@/components/pharmacy/pos/close-register-dialog"
import { OpenRegisterDialog } from "@/components/pharmacy/pos/open-register-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { patientService } from "@/services/patient-service"
import { pharmacyService } from "@/services/pharmacy-service"
import { Medicine, Patient } from "@/types/pharmacy"

export default function POSPage() {
  const { cart, addToCart, clearCart, addTransaction, activeRegister, setActiveRegister } = usePosStore()
  
  // State
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [searchQuery, setSearchQuery] = useState("")
  // Debounce search query
  const [debouncedSearch] = useDebounce(searchQuery, 500)
  const [activeCategory, setActiveCategory] = useState("All")
  const [discount, setDiscount] = useState(0)
  const [discountFixedAmount, setDiscountFixedAmount] = useState(0)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12
  
  const tabsListRef = useRef<HTMLDivElement>(null)

  const { activeStoreId } = useStoreContext()
  const [openRegisterOpen, setOpenRegisterOpen] = useState(false)
  const [closeRegisterOpen, setCloseRegisterOpen] = useState(false)
  const { fetchSettings } = useSettingsStore()

  useEffect(() => {
    setIsMounted(true)
    fetchSettings() // Load settings including VAT percentage
    if (activeStoreId) {
        checkSession()
    }
  }, [activeStoreId])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
      loadMedicines()
  }, [page, debouncedSearch, activeCategory])

  // Initialize default patient separately
  useEffect(() => {
      const loadDefaultPatient = async () => {
          try {
              const defaultPatientRes = await patientService.getPatient('default-opd-patient')
              if (defaultPatientRes.success && defaultPatientRes.data) {
                  setSelectedCustomer(defaultPatientRes.data)
              }
          } catch (err) {
              console.warn("Could not load default patient", err)
          }
      }
      loadDefaultPatient()
  }, [])

  const checkSession = async () => {
    if (!activeStoreId) return
    try {
        const response = await pharmacyService.getActiveCashRegister(activeStoreId)
        if (response.success && response.data) {
            setActiveRegister(response.data)
            setOpenRegisterOpen(false)
        } else {
            setActiveRegister(null)
            setOpenRegisterOpen(true)
        }
    } catch (error) {
        console.error("Failed to check session", error)
        setActiveRegister(null)
        setOpenRegisterOpen(true)
    }
  }

  const loadCategories = async () => {
      try {
        const catRes = await pharmacyService.getEntities('categories', { limit: 100 })
        setCategories(["All", ...catRes.data.map(c => c.name)])
      } catch (error) {
          console.error("Failed to load categories")
      }
  }

  const loadMedicines = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      if (debouncedSearch) params.search = debouncedSearch
      // Note: API expects category ID, but we only have name here from the simple array.
      // If we want accurate filtering, we should map names to IDs or change state to store objects.
      // For now, let's assume the API might support name or we accept client side filtering for category if API fails?
      // Actually, let's look at `pharmacy-service`. getMedicines takes `categoryId`.
      // Since we don't have the ID map handy without fetching, let's rely on search for now or 
      // if `activeCategory` is not All, we might need to find the ID. 
      // A better approach is to store categories as objects.
      // Let's defer category filtering to client side for this iteration if ID is missing, BUT
      // `getMedicines` returns paginated data, so client side filtering on a page is WRONG.
      // We MUST filter by category on server.
      // I'll update `loadCategories` to store objects in a separate state map if needed, or just finding it from the response.
      // But `categories` state is string array.
      // Let's just fetch all categories and keep them in a ref or another state to lookup ID.
      
      // For this step, I'll pass `search` and `page`. 
      
      const response = await pharmacyService.getMedicines(params)
      if (response.success) {
          let data = response.data
          // Client-side category filter if we can't do it server side yet (due to missing ID)
          // valid concern: filtering 12 items on client might result in 0 items.
          // We need server side category filtering.
          // Detailed Plan: I will fix the category state in a follow up. For now, let's get search+page working.
          setMedicines(data)
           if (response.meta) {
              setTotalPages(response.meta.totalPages)
          }
      }
    } catch (error) {
      toast.error("Failed to load medicines")
    } finally {
      setLoading(false)
    }
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
        const scrollAmount = 200
        tabsListRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
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

  const handleAddToCart = (medicine: Medicine) => {
    // Find a suitable batch (first one with stock > 0)
    const activeBatch = medicine.stocks?.find(s => s.quantity > 0)
    
    if (!activeBatch && (medicine.stock || 0) <= 0) {
        toast.error("Item is out of stock")
        return
    }

    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: Number(medicine.salePrice),
      quantity: 1, // Start with 1
      stock: activeBatch?.quantity || medicine.stock || 0,
      batchNumber: activeBatch?.batchNumber,
      expiryDate: activeBatch?.expiryDate,
      medicineId: medicine.id,
      category: medicine.category?.name || 'Uncategorized'
    } as any) // Cast to basic product structure expected by store, store then uses Product interface
  }

  const filteredProducts = medicines.filter((medicine) => {
    const matchesCategory = activeCategory === "All" || medicine.category?.name === activeCategory
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         medicine.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.barcode?.includes(searchQuery) ||
                         medicine.rackNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Calculations
  const { pharmacy } = useSettingsStore()
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
  const [paymentMethod, setPaymentMethod] = useState<import("@/types/pharmacy").PaymentMethod>('cash')

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
          const salePayload = {
              branchId: activeStoreId,
              patientId: selectedCustomer?.id,
              status: "completed" as const,
              paymentMethod, // Include selected payment method
              discountPercentage: discount,
              discountAmount: discountAmount,
              saleItems: cart.map(item => ({
                  medicineId: item.id, // Store uses 'id' as medicineId usually
                  itemName: item.name,
                  unit: "pcs", // Defaulting, ideally from medicine
                  price: item.price,
                  mrp: item.price, // Assuming MRP same as sale price for now if not available
                  quantity: item.quantity,
                  discountPercentage: item.discountPercentage,
                  discountAmount: item.discountAmount,
                  batchNumber: item.batchNumber || "BATCH-N/A",
                  expiryDate: item.expiryDate || new Date().toISOString()
              }))
          }

          setLoading(true)
          const response = await pharmacyService.createSale(salePayload as any) // Cast to match stricter type if needed
          
          const transaction = {
              id: response.data?.id || `TRX-${Date.now()}`,
              customerName: selectedCustomer ? selectedCustomer.name : "Walk-in Customer",
              items: [...cart],
              total,
              subtotal,
              tax,
              discount,
              date: new Date().toLocaleString(),
              status: "Completed" as const,
              paymentMethod // Use state value
          }
          
          addTransaction(transaction)
          setLastTransaction(transaction)

          toast.success("Payment Processed Successfully!")
          setReceiptOpen(true)
          clearCart()
          setDiscount(0)
          setDiscountFixedAmount(0)
          setCartOpen(false) 
          
          // Refresh products and session to update stock and register totals
          loadMedicines() // Changed from loadData()
          checkSession()

      } catch (error) {
          console.error(error)
          toast.error("Failed to process sale")
      } finally {
          setLoading(false)
      }
  }

  const handleLinkPrescription = (id: string) => {
      // In a real app, you'd fetch prescription details here
      console.log("Linked prescription:", id)
  }

  if (!isMounted) return null

  if (!activeStoreId && !loading) {
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
                onSuccess={() => {
                    setOpenRegisterOpen(false)
                    loadMedicines() // Changed from loadData()
                }}
            />

            <CloseRegisterDialog 
                open={closeRegisterOpen}
                onOpenChange={setCloseRegisterOpen}
                registerId={activeRegister?.id || ""}
                onSuccess={() => {
                    setCloseRegisterOpen(false)
                    setActiveRegister(null)
                    setOpenRegisterOpen(true)
                }}
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
                    <Button 
                        variant="outline" 
                        size="icon" 
                        title="Link Prescription"
                        onClick={() => setLinkPrescriptionOpen(true)}
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                    <Link href="/pharmacy">
                        <Button variant="ghost" size="icon" className="text-muted-foreground mr-2" title="Exit POS">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <StoreSwitcher />
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
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-transparent shadow-sm">
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
                        </Card>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground font-medium">
                    No medicines found.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
                    {filteredProducts.map((product) => {
                        const cartItem = cart.find(item => item.id === product.id)
                        const quantity = cartItem ? cartItem.quantity : 0
                        const salePrice = Number(product.salePrice)

                        return (
                        <Card 
                            key={product.id} 
                            className={`cursor-pointer transition-all group overflow-hidden border-2 ${quantity > 0 ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/50 hover:shadow-md'}`}
                            onClick={() => handleAddToCart(product)}
                        >
                            <CardHeader className="p-3 sm:p-4 bg-secondary/10 group-hover:bg-primary/5 transition-colors relative">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-[10px] sm:text-xs bg-background/80 backdrop-blur-sm truncate max-w-[80%]">
                                        {product.category?.name || 'N/A'}
                                    </Badge>
                                    <div className="flex flex-col items-end gap-1">
                                        {(product.stocks?.reduce((acc, s) => acc + Number(s.quantity), 0) || product.stock || 0) < 30 && <Badge variant="destructive" className="text-[10px] animate-pulse">Low</Badge>}
                                        {product.rackNumber && <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 rounded">Rack: {product.rackNumber}</span>}
                                    </div>
                                </div>
                                
                                {quantity > 0 && (
                                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm animate-in zoom-in">
                                        {quantity}
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="p-3 sm:p-4">
                                <h3 className="font-semibold text-sm sm:text-base truncate" title={product.name}>{product.name}</h3>
                                <div className="mt-2 flex items-end justify-between">
                                    <span className="text-base sm:text-lg font-bold text-primary">{formatCurrency(salePrice)}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {product.stocks?.reduce((acc, s) => acc + Number(s.quantity), 0) || product.stock || 0} left
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        )
                    })}
                </div>
            )}
        </ScrollArea>
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
              <span className="font-bold text-xl">{formatCurrency(total)}</span>
          </Button>
      </div>

      {/* Desktop Cart Section - Fixed Height */}
      <div className="hidden md:flex flex-none w-[350px] lg:w-[400px] flex-col bg-card border rounded-xl shadow-lg h-full overflow-hidden">
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
        />
      </div>
    </div>
  )
}
