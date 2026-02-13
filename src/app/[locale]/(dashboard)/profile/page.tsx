"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/use-auth-store"
import { useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    
    setIsLoading(true)
    try {
      // Assuming authService is available via import, relying on existing imports or adding them if needed. 
      // check imports first. imports are missing for authService.
      // I will add authService import in a separate step or assume it is available if I replace the whole file.
      // Current file imports: Button, Card..., Input, Label, useAuthStore, useState, toast.
      // I need to import authService.
      const { authService } = await import("@/services/auth-service") // Dynamic import or just add to top
      const res = await authService.changePassword({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword
      })
      
      if(res.success) {
          toast.success("Password updated successfully")
          setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" })
      } else {
          toast.error(res.message || "Failed to update password")
      }
    } catch (error: any) {
        toast.error(error.response?.data?.message || "An error occurred")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              View and manage your profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={user?.fullName || ''} disabled />
             </div>
             <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username || ''} disabled />
             </div>
             <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
             </div>
             <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role?.name || ''} disabled />
             </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                    Update your account password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="oldPassword">Current Password</Label>
                        <Input 
                            id="oldPassword" 
                            name="oldPassword" 
                            type="password" 
                            value={passwords.oldPassword} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                            id="newPassword" 
                            name="newPassword" 
                            type="password" 
                            value={passwords.newPassword} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            type="password" 
                            value={passwords.confirmPassword} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
