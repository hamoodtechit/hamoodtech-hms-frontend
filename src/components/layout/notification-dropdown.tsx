"use client"

import { Bell, Check, Loader2, Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/store/use-notification-store";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNoticeStore } from "@/store/use-notice-store";

export function NotificationDropdown() {
    const { openNotice } = useNoticeStore();
    const { 
        notifications, 
        unreadCount, 
        isLoading, 
        markAsRead, 
        markAllAsRead 
    } = useNotificationStore();

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Connect the dot: Extract notice ID from link and open modal
        if (notification.type === 'notice' && notification.link) {
            const noticeId = notification.link.split('/').pop();
            if (noticeId) {
                openNotice(noticeId);
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-background animate-in zoom-in">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96 p-0" align="end">
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black uppercase tracking-widest">Notifications</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                            You have {unreadCount} unread messages
                        </span>
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-[10px] font-black uppercase tracking-tight text-primary hover:text-primary hover:bg-primary/5 transition-all"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllAsRead();
                            }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <ScrollArea className="h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                                <Bell className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">All caught up!</span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <DropdownMenuItem 
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted/50 border-b border-muted/30 last:border-0",
                                        !notification.isRead && "bg-primary/5"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex w-full items-start justify-between gap-2">
                                        <span className={cn(
                                            "text-xs font-black leading-tight",
                                            !notification.isRead ? "text-primary" : "text-foreground/70"
                                        )}>
                                            {notification.title}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">
                                            {notification.type}
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-0">
                    <Button 
                        variant="ghost" 
                        className="w-full rounded-none h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5"
                    >
                        View all notification center
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
