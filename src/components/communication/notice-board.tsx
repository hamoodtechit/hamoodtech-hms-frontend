"use client"

import { useEffect, useState } from "react";
import { communicationService } from "@/services/communication-service";
import { Notice } from "@/types/communication";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Calendar, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function NoticeBoard() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        <Card className="h-full border-none shadow-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/5 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Notice Board</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Global & Department Updates</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="font-black border-primary/20 text-primary uppercase text-[8px] tracking-tight">Live</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Fetching Announcements...</span>
                        </div>
                    ) : notices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                            <Megaphone className="h-12 w-12 text-muted-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No active notices</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notices.map((notice) => (
                                <div 
                                    key={notice.id} 
                                    className="p-4 rounded-2xl bg-background border border-white/5 shadow-sm hover:border-primary/20 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h4 className="text-sm font-black text-primary leading-tight group-hover:underline cursor-pointer">
                                            {notice.title}
                                        </h4>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase bg-muted/50 px-1.5 py-0.5 rounded leading-none">
                                                {format(new Date(notice.createdAt), "dd MMM yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed mb-3 line-clamp-3">
                                        {notice.content}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-muted/30">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase">
                                            <Calendar className="h-3 w-3" />
                                            Live Update
                                        </div>
                                        {notice.departmentId && (
                                            <Badge variant="secondary" className="text-[7px] h-3.5 font-black uppercase tracking-tighter">
                                                Dept Specific
                                            </Badge>
                                        )}
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
