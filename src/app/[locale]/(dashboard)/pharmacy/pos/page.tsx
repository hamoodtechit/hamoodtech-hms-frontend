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
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrugInteraction } from "@/hooks/use-drug-interaction"
import { usePosStore } from "@/store/use-pos-store"
import { ChevronLeft, ChevronRight, FileText, Search, ShoppingCart } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Mock Data (Products)
const categories = ["All", "Tablets", "Syrups", "Injections", "Equipment", "Antibiotics"]
const products = [
  { id: 1, name: "Paracetamol 500mg", category: "Tablets", price: 5.00, stock: 150 },
  { id: 2, name: "Amoxicillin 250mg", category: "Antibiotics", price: 12.50, stock: 80 },
  { id: 3, name: "Cough Syrup", category: "Syrups", price: 8.00, stock: 45 },
  { id: 4, name: "Insulin Injection", category: "Injections", price: 45.00, stock: 20 },
  { id: 5, name: "Face Mask (N95)", category: "Equipment", price: 1.50, stock: 500 },
  { id: 6, name: "Vitamin C", category: "Tablets", price: 6.00, stock: 100 },
  { id: 7, name: "Bandage", category: "Equipment", price: 2.00, stock: 200 },
  { id: 8, name: "Ibuprofen 400mg", category: "Tablets", price: 7.50, stock: 120 },
  { id: 9, name: "Azithromycin 500mg", category: "Antibiotics", price: 15.00, stock: 60 },
  { id: 10, name: "Syringe 5ml", category: "Equipment", price: 0.50, stock: 1000 },
]

export default function POSPage() {
  const { cart, addToCart, clearCart, addTransaction } = usePosStore()
  
  // Hydration check
  const [isMounted, setIsMounted] = useState(false)
  
  const tabsListRef = useRef<HTMLDivElement>(null)

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
        const scrollAmount = 200
        tabsListRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }
  }
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [discount, setDiscount] = useState(0)
  
  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  // Receipt State
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

  // Prescription Dialog State
  const [linkPrescriptionOpen, setLinkPrescriptionOpen] = useState(false)

  // Cart Sheet State (Controlled)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1 
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal + tax - discountAmount
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  const { checkInteractions } = useDrugInteraction()
  const [showInteractionAlert, setShowInteractionAlert] = useState(false)
  const [currentInteractions, setCurrentInteractions] = useState<any[]>([])

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

  const processTransaction = () => {
      const transaction = {
          id: `TRX-${Date.now()}`,
          customerName: selectedCustomer ? selectedCustomer.name : "Walk-in Customer",
          items: [...cart],
          total,
          subtotal,
          tax,
          discount,
          date: new Date().toLocaleString(),
          status: "Completed" as const,
          paymentMethod: "Cash" as const
      }
      
      addTransaction(transaction)
      setLastTransaction(transaction)

      toast.success("Payment Processed Successfully!")
      setReceiptOpen(true)
      clearCart()
      setDiscount(0)
      setSelectedCustomer(null)
      setCartOpen(false) 
  }

  const handleLinkPrescription = (id: string) => {
      // In a real app, you'd fetch prescription details here
      console.log("Linked prescription:", id)
  }

  if (!isMounted) return null

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-8rem)] md:h-[calc(100dvh-8rem)] -mx-2 -my-2 p-2 gap-4 relative overflow-hidden bg-background rounded-lg">
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

            {/* Mobile Cart Sheet (Controlled) */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetContent side="right" className="p-0 w-full sm:w-[400px]">
                    <CartContents 
                        onCheckout={handleCheckout}
                        customerDialogOpen={customerDialogOpen}
                        setCustomerDialogOpen={setCustomerDialogOpen}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        discount={discount}
                        setDiscount={setDiscount}
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
                    <TransactionHistory />
                    
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
                {filteredProducts.map((product) => (
                    <Card 
                        key={product.id} 
                        className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group overflow-hidden"
                        onClick={() => addToCart(product)}
                    >
                        <CardHeader className="p-3 sm:p-4 bg-secondary/10 group-hover:bg-primary/5 transition-colors">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-background/80 backdrop-blur-sm">{product.category}</Badge>
                                {product.stock < 30 && <Badge variant="destructive" className="text-[10px] animate-pulse">Low</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                             <h3 className="font-semibold text-sm sm:text-base truncate" title={product.name}>{product.name}</h3>
                             <div className="mt-2 flex items-end justify-between">
                                <span className="text-base sm:text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground">{product.stock} left</span>
                             </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
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
              <span className="font-bold text-xl">${total.toFixed(2)}</span>
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
        />
      </div>
    </div>
  )
}
