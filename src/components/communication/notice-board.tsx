"use client"

import { useEffect, useState } from "react";
import { communicationService } from "@/services/communication-service";
import { Notice } from "@/types/communication";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Calendar, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { useNoticeStore } from "@/store/use-notice-store";
import { communicationService } from "@/services/communication-service";
import { Notice } from "@/types/communication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Calendar, ArrowRight, BellRing } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NoticeBoard() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { openNotice } = useNoticeStore();

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const response = await communicationService.getNotices({ limit: 10 });
                if (response.success) {
                    setNotices(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch notices:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotices();
    }, []);

    return (
        <Card className="h-full border-none shadow-2xl bg-[#0F172A]/40 backdrop-blur-xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="pb-4 relative overflow-hidden bg-primary/5">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Megaphone className="h-24 w-24 rotate-12" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                            <Megaphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Notice Board</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Global Broadcast Channel</span>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="h-6 px-3 font-black border-primary/30 text-primary uppercase text-[9px] tracking-widest bg-primary/5">
                        Live updates
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="p-0">
                <ScrollArea className="h-[450px] px-6 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                <BellRing className="h-5 w-5 text-primary/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse italic">Synchronizing Feed...</span>
                        </div>
                    ) : notices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6 opacity-20 group">
                            <Megaphone className="h-16 w-16 text-muted-foreground transition-transform group-hover:scale-110 duration-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Silence in the corridor</span>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {notices.map((notice, index) => (
                                <div 
                                    key={notice.id} 
                                    onClick={() => openNotice(notice.id)}
                                    className={cn(
                                        "group relative p-5 rounded-3xl cursor-pointer transition-all duration-300",
                                        "bg-white/[0.02] border border-white/5 hover:border-primary/30",
                                        "hover:bg-primary/5 hover:shadow-2xl hover:shadow-primary/10",
                                        "active:scale-[0.98]",
                                        index === 0 && "ring-1 ring-primary/20 bg-primary/[0.03]"
                                    )}
                                >
                                    {index === 0 && (
                                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white uppercase rounded-full shadow-lg z-20 animate-bounce">
                                            Latest
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start justify-between gap-6 mb-3">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-red-500 group-hover:text-red-400 transition-colors leading-snug uppercase tracking-tight">
                                                {notice.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(notice.createdAt), "MMMM dd, yyyy")}
                                            </div>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className="h-4 w-4 text-primary" />
                                        </div>
                                    </div>
                                    
                                    <p className="text-[13px] font-black text-muted-foreground/90 leading-relaxed line-clamp-3 italic border-l-2 border-primary/20 pl-4 bg-primary/5 py-2 rounded-r-xl">
                                        {notice.content}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.03]">
                                        <Badge variant="secondary" className="text-[7px] h-4 font-black uppercase tracking-widest bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {notice.departmentId ? "Dept Alert" : "Global Bulletin"}
                                        </Badge>
                                        <span className="text-[9px] font-black text-primary/0 group-hover:text-primary/60 transition-all uppercase tracking-tighter">
                                            View Details
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
