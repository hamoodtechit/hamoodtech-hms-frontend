"use client"

import { useEffect, useState } from "react";
import { communicationService } from "@/services/communication-service";
import { Notice } from "@/types/communication";
import { Megaphone, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNoticeStore } from "@/store/use-notice-store";

export function NotificationTicker() {
    const { openNotice } = useNoticeStore();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecentNotices = async () => {
            try {
                // Fetch notices (global announcements) for the marquee
                const response = await communicationService.getNotices({ limit: 10 });
                if (response.success) {
                    setNotices(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch ticker notices:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentNotices();
        
        // Refresh every 5 minutes
        const interval = setInterval(fetchRecentNotices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // If no notices, show a default welcome message
    const displayNotices = notices.length > 0 
        ? notices 
        : [{ 
            id: 'welcome', 
            title: 'Announcement', 
            content: 'Stay updated with live hospital announcements and alerts here.',
            createdAt: new Date().toISOString()
        } as any];

    if (isLoading) return null;

    return (
        <div className="w-full bg-background/60 backdrop-blur-md border-b border-border/50 overflow-hidden py-2 flex items-center h-10 shadow-sm relative z-30">
            {/* Premium "Updates" Label with Pulsing Dot */}
            <div className="flex items-center px-4 md:px-6 bg-background z-40 shrink-0 border-r border-border h-full relative">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-[0.15em] gap-2 py-1 px-3 h-6 flex items-center border-none shadow-lg shadow-primary/20">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-foreground"></span>
                    </span>
                    Updates
                </Badge>
            </div>
            
            <div className="relative flex-1 overflow-hidden h-full flex items-center">
                {/* Subtle gradient overlays for fade effect */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />

                <div className="flex animate-marquee whitespace-nowrap items-center hover:[animation-play-state:paused]">
                    {[...displayNotices, ...displayNotices].map((notice, idx) => (
                        <button 
                            key={`${notice.id}-${idx}`} 
                            onClick={() => notice.id !== 'welcome' && openNotice(notice.id)}
                            className="flex items-center mx-10 hover:opacity-100 transition-all cursor-pointer group opacity-80"
                        >
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                                <Megaphone className="h-2.5 w-2.5 text-primary" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-primary/80 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10 group-hover:border-primary/30 transition-colors">
                                    {notice.title}
                                </span>
                                <span className="text-[11px] font-semibold text-foreground/90 tracking-tight group-hover:text-primary transition-colors">
                                    {notice.content}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
