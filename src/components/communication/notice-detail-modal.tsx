"use client"

import { useNoticeStore } from "@/store/use-notice-store";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { Loader2, Calendar, Megaphone, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NoticeDetailModal() {
    const { isOpen, closeNotice, selectedNotice, isLoading } = useNoticeStore();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeNotice()}>
            <DialogContent className="max-w-2xl bg-card border-none shadow-2xl p-0 overflow-hidden">
                <DialogTitle className="sr-only">Notice Details</DialogTitle>
                
                {isLoading ? (
                    <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Fetching Details...</span>
                    </div>
                ) : selectedNotice ? (
                    <div className="flex flex-col">
                        <div className="p-8 bg-primary/5 border-b border-primary/10">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 h-5 flex items-center border-none">
                                    <Megaphone className="h-2.5 w-2.5 mr-1" />
                                    Notice Details
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                    {format(new Date(selectedNotice.createdAt), "PPP p")}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-primary leading-tight">
                                {selectedNotice.title}
                            </h2>
                        </div>
                        
                        <ScrollArea className="max-h-[60vh]">
                            <div className="p-8 space-y-8">
                                <div className="text-sm font-medium leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                    {selectedNotice.content}
                                </div>

                                {selectedNotice.attachmentUrl && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                                            <Paperclip className="h-3 w-3" />
                                            Attachment
                                        </div>
                                        <div className="relative group rounded-2xl overflow-hidden border border-border/50 shadow-lg">
                                            <img 
                                                src={selectedNotice.attachmentUrl} 
                                                alt="Notice Attachment" 
                                                className="w-full object-contain max-h-[400px] bg-muted/20 transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        
                        <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-tight leading-none mb-0.5">Live Broadcast</span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Verified Official Notice</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase">ID: {selectedNotice.id.slice(0, 8)}</span>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
