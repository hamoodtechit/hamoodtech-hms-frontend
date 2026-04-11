"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { DiagnosticTest, DiagnosticBlock } from "@/types/diagnostic"
import { 
    Activity, 
    Beaker, 
    Clock, 
    Columns, 
    FileText, 
    Microscope, 
    Tag, 
    User,
    ClipboardList,
    DollarSign,
    Calendar,
    ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"

interface ServiceDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    service: DiagnosticTest | null
}

function DetailRow({ label, value, icon: Icon, colorClass }: { label: string; value?: string | number | null; icon: any; colorClass?: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 group">
            <div className="flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110", colorClass || "bg-muted/50 border-border/50")}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-black text-foreground">{value || "—"}</span>
        </div>
    )
}

export function ServiceDetailSheet({ open, onOpenChange, service }: ServiceDetailSheetProps) {
    const { formatCurrency } = useCurrency()

    if (!service) return null

    const template = Array.isArray(service.testResultTemplate) ? service.testResultTemplate : []

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto p-0 flex flex-col gap-0 border-l-0 shadow-2xl bg-background/95 backdrop-blur-xl">
                <SheetHeader className="p-8 pb-6 border-b bg-primary/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-[2rem] bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                            <Microscope className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-black tracking-tight text-foreground leading-none">
                                {service.name}
                            </SheetTitle>
                            {service.nameBangla && (
                                <p className="text-sm font-bold text-muted-foreground italic">{service.nameBangla}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black px-3 py-1 text-[10px] uppercase">
                            {service.type?.toUpperCase() || 'PATHOLOGY'}
                        </Badge>
                        {service.isDiagnosticTest && (
                            <Badge variant="outline" className="rounded-lg bg-blue-500/10 text-blue-600 border-blue-500/20 font-black px-3 py-1 text-[10px] uppercase">
                                Advanced Lab Template
                            </Badge>
                        )}
                    </div>
                </SheetHeader>

                <div className="p-8 space-y-10">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-primary" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Service Information</h3>
                        </div>
                        <div className="bg-card border rounded-3xl p-6 shadow-sm">
                            <DetailRow 
                                label="Standard Price" 
                                value={formatCurrency(service.price)} 
                                icon={DollarSign} 
                                colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            />
                            <DetailRow 
                                label="Delivery Time" 
                                value={`${service.reportDays || 0} Days`} 
                                icon={Calendar} 
                                colorClass="bg-blue-500/10 border-blue-500/20 text-blue-600"
                            />
                            <DetailRow 
                                label="Department" 
                                value={service.department?.name} 
                                icon={Activity} 
                            />
                            <DetailRow 
                                label="Test Group" 
                                value={service.testGroup?.name} 
                                icon={ClipboardList} 
                            />
                        </div>
                    </div>

                    {/* Template Section */}
                    {service.isDiagnosticTest && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Beaker className="w-4 h-4 text-primary" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Clinical Template</h3>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                                    {service.templateType === 'narrative' ? <FileText className="w-3 h-3 text-indigo-500" /> : <Columns className="w-3 h-3 text-blue-500" />}
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">
                                        {service.templateType || 'Table'} Mode
                                    </span>
                                </div>
                            </div>

                            {service.templateType === 'narrative' ? (
                                <div className="bg-card border rounded-3xl p-6 shadow-sm space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">Default Findings Narrative</p>
                                    <div 
                                        className="text-sm font-medium leading-[1.8] prose prose-sm max-w-none text-foreground dark:prose-invert"
                                        dangerouslySetInnerHTML={{ 
                                            __html: service.templateDescription?.includes('&lt;') 
                                                ? service.templateDescription.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                                                : service.templateDescription || "" 
                                        }}
                                    />
                                    {!service.templateDescription && <p className="text-xs text-muted-foreground italic">No default narrative defined.</p>}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {template.map((param: any, idx: number) => (
                                        <div key={param.id || idx} className="bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-all group/item">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-foreground truncate">{param.name}</span>
                                                        {param.fieldType === 'dropdown' && (
                                                            <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-bold bg-indigo-50 text-indigo-600 uppercase border-indigo-100">Dropdown</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                                                        <span className="flex items-center gap-1"><ArrowRight className="w-2.5 h-2.5 opacity-40" /> Unit: {param.unit || "N/A"}</span>
                                                        <span className="flex items-center gap-1"><ArrowRight className="w-2.5 h-2.5 opacity-40" /> Ref: {param.refRange || "N/A"}</span>
                                                    </div>
                                                </div>
                                                {param.fieldType === 'dropdown' && param.options && (
                                                    <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                                                        {param.options.slice(0, 3).map((opt: string) => (
                                                            <span key={opt} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-md font-bold border border-border/50">{opt}</span>
                                                        ))}
                                                        {param.options.length > 3 && <span className="text-[9px] text-muted-foreground font-black">+{param.options.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {template.length === 0 && (
                                        <div className="text-center py-10 bg-muted/20 border-2 border-dashed rounded-3xl">
                                            <p className="text-xs font-bold text-muted-foreground italic">No parameters defined for this template.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-8 border-t bg-muted/20 mt-auto">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest hover:bg-background transition-all active:scale-95"
                    >
                        Close Details
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
