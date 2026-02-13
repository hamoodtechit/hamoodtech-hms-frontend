"use client"

import { CartContents } from "@/components/pharmacy/pos/cart-contents"
import { InteractionAlert } from "@/components/pharmacy/pos/interaction-alert"
import { ReceiptDialog } from "@/components/pharmacy/receipt-dialog"
import { TransactionHistory } from "@/components/pharmacy/transaction-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrugInteraction } from "@/hooks/use-drug-interaction"
import { usePosStore } from "@/store/use-pos-store"
import { FileText, Search, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
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
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [discount, setDiscount] = useState(0)
  
  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  // Receipt State
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

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
  }

  if (!isMounted) return null

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] gap-4 p-2 relative">
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
      
      {/* Product Section */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm sticky top-0 z-10">
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
                 <Tabs defaultValue="All" value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto md:hidden">
                    <TabsList className="w-full">
                         <TabsTrigger value="All" className="flex-1">All</TabsTrigger>
                         <TabsTrigger value="Tablets" className="flex-1">Pills</TabsTrigger>
                    </TabsList>
                 </Tabs>

                <div className="flex gap-2">
                    <Button variant="outline" size="icon" title="Link Prescription">
                        <FileText className="h-4 w-4" />
                    </Button>
                    <TransactionHistory />
                    
                    {/* Mobile Cart Trigger */}
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button className="md:hidden relative">
                                <ShoppingCart className="h-4 w-4" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-background" />
                                )}
                            </Button>
                        </SheetTrigger>
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
                </div>
            </div>
        </div>

        <Tabs defaultValue="All" className="w-full space-y-4 hidden md:block" onValueChange={setActiveCategory} value={activeCategory}>
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

        <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
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

      {/* Desktop Cart Section */}
      <div className="hidden md:flex w-[350px] lg:w-[400px] flex-col bg-card border rounded-xl shadow-lg h-full overflow-hidden">
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
