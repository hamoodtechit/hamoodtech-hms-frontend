import { Check, ChevronsUpDown, Edit, PlusCircle, Store, Trash2 } from "lucide-react"
import * as React from "react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { Branch } from "@/types/pharmacy"
import { toast } from "sonner"
import { BranchDialog } from "./branch-dialog"

export function StoreSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const [branchDialogOpen, setBranchDialogOpen] = React.useState(false)
  const [branchToEdit, setBranchToEdit] = React.useState<Branch | null>(null)
  const [branchToDelete, setBranchToDelete] = React.useState<Branch | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  
  const { stores, activeStoreId, setActiveStore, fetchStores, loading } = useStoreContext()
  
  React.useEffect(() => {
    fetchStores()
  }, [])

  const selectedStore = stores.find((store) => store.id === activeStoreId)

  const handleEdit = (e: React.MouseEvent, store: Branch) => {
    e.stopPropagation()
    setBranchToEdit(store)
    setBranchDialogOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, store: Branch) => {
    e.stopPropagation()
    setBranchToDelete(store)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!branchToDelete) return
    try {
      await pharmacyService.deleteBranch(branchToDelete.id)
      toast.success("Branch deleted successfully")
      fetchStores()
    } catch (error) {
      toast.error("Failed to delete branch")
    } finally {
      setDeleteConfirmOpen(false)
      setBranchToDelete(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[250px] justify-between", className)}
        >
          <Store className="mr-2 h-4 w-4" />
          {selectedStore ? selectedStore.name : "Select store..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search store..." />
          <CommandList>
            <CommandEmpty>No store found.</CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.name}
                  onSelect={() => {
                    setActiveStore(store.id)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        activeStoreId === store.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {store.name}
                  </div>
                  <div className="flex items-center space-x-1 ml-auto shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={(e) => handleEdit(e, store)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteClick(e, store)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <DropdownMenuSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setBranchToEdit(null)
                  setBranchDialogOpen(true)
                }}
                className="cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Branch
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>

      <BranchDialog 
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        onSuccess={fetchStores}
        branchToEdit={branchToEdit}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the branch <strong>{branchToDelete?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
  )
}
