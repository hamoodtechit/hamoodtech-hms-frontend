"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/navigation"
import { authService } from "@/services/auth-service"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function SetupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    hospitalName: "",
    hospitalAddress: "",
    hospitalPhone: "",
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "" // For UI confirm only, not sent to API if API doesn't require it
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.adminPassword !== formData.confirmPassword) {
        toast.error("Passwords do not match!")
        return
    }

    setIsLoading(true)

    try {
      // API expects nested structure: hospital, settings, admin
      await authService.setupSystem({
          hospital: {
            name: formData.hospitalName,
            address: formData.hospitalAddress,
            phone: formData.hospitalPhone,
            email: formData.adminEmail, // Using admin email as hospital email
          },
          settings: {
            currency: 'BDT',
            currencySymbol: '৳',
            timezone: 'Asia/Dhaka',
            vatPercentage: 5,
            lowStockThreshold: 10,
          },
          admin: {
            username: formData.adminUsername,
            email: formData.adminEmail,
            password: formData.adminPassword,
            fullName: "Super Admin",
          }
      })

      toast.success("System setup complete! Please login.")
      router.push("/auth/login")
    } catch (error: any) {
      console.error(error)
      const msg = error.response?.data?.message || "Setup failed. Please try again."
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Initial Setup</CardTitle>
        <CardDescription className="text-center">
          Configure your hospital details and create the Super Admin account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Hospital Details</h3>
            <div className="grid gap-2">
                <Label htmlFor="hospitalName">Hospital Name</Label>
                <Input 
                    id="hospitalName" 
                    name="hospitalName" 
                    placeholder="e.g. City General Hospital" 
                    required 
                    value={formData.hospitalName}
                    onChange={handleChange}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="hospitalAddress">Address</Label>
                <Input 
                    id="hospitalAddress" 
                    name="hospitalAddress" 
                    placeholder="123 Health St, City" 
                    required 
                    value={formData.hospitalAddress}
                    onChange={handleChange}
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="hospitalPhone">Phone</Label>
                <Input 
                    id="hospitalPhone" 
                    name="hospitalPhone" 
                    placeholder="+1 234 567 890" 
                    required 
                    value={formData.hospitalPhone}
                    onChange={handleChange}
                />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider pt-2 border-t">Admin Account</h3>
             <div className="grid gap-2">
                <Label htmlFor="adminUsername">Username</Label>
                <Input 
                    id="adminUsername" 
                    name="adminUsername" 
                    placeholder="admin" 
                    required 
                    value={formData.adminUsername}
                    onChange={handleChange}
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input 
                    id="adminEmail" 
                    name="adminEmail" 
                    type="email" 
                    placeholder="admin@example.com" 
                    required 
                    value={formData.adminEmail}
                    onChange={handleChange}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 pb-6">
                <div className="grid gap-2">
                    <Label htmlFor="adminPassword">Password</Label>
                    <Input 
                        id="adminPassword" 
                        name="adminPassword" 
                        type="password" 
                        required 
                        value={formData.adminPassword}
                        onChange={handleChange}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        type="password" 
                        required 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
                Back to Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
