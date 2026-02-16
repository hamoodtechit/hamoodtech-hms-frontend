"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, Lock, Mail } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(formData)
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid credentials. Please try again."
      toast.error("Login Failed", {
        description: msg
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6")}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="usernameOrEmail">Username or Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="usernameOrEmail" 
                    name="usernameOrEmail" 
                    placeholder="name@example.com" 
                    className="pl-9"
                    required 
                    value={formData.usernameOrEmail}
                    onChange={handleChange}
                    autoComplete="username"
                    disabled={isLoading}
                />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:underline" onClick={(e) => {
                    e.preventDefault();
                    toast.info("Please contact your administrator to reset your password.")
                }}>
                    Forgot password?
                </a>
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    className="pl-9"
                    required 
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={isLoading}
                />
            </div>
          </div>
          <Button className="w-full mt-2" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Secure System
          </span>
        </div>
      </div>
      <div className="text-center text-sm text-muted-foreground mt-4">
        Need to initialize?{" "}
        <Link href="/setup" className="underline underline-offset-4 hover:text-primary">
          Setup New Organization
        </Link>
      </div>
    </div>
  )
}
