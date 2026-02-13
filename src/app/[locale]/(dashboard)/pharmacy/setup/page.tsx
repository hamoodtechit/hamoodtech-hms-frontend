"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, Database, Layers, Pill, Tag } from "lucide-react"
import { MasterDataTable } from "./components/master-data-table"

export default function PharmacySetupPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pharmacy">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pharmacy Setup</h1>
            <p className="text-muted-foreground">Manage Master Data for your pharmacy inventory.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Data Management</CardTitle>
          <CardDescription>
            Configure brands, categories, groups, and units used across the pharmacy system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="brands" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto p-1 bg-muted/50">
              <TabsTrigger value="brands" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Tag className="mr-2 h-4 w-4" /> Brands
              </TabsTrigger>
              <TabsTrigger value="categories" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Layers className="mr-2 h-4 w-4" /> Categories
              </TabsTrigger>
              <TabsTrigger value="groups" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Database className="mr-2 h-4 w-4" /> Groups
              </TabsTrigger>
              <TabsTrigger value="units" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Pill className="mr-2 h-4 w-4" /> Units
              </TabsTrigger>
            </TabsList>

            <TabsContent value="brands" className="mt-0 animate-in fade-in-50">
              <MasterDataTable type="brands" title="Brand" />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0 animate-in fade-in-50">
              <MasterDataTable type="categories" title="Category" />
            </TabsContent>
            
            <TabsContent value="groups" className="mt-0 animate-in fade-in-50">
              <MasterDataTable type="groups" title="Group" />
            </TabsContent>
            
            <TabsContent value="units" className="mt-0 animate-in fade-in-50">
              <MasterDataTable type="units" title="Unit" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
