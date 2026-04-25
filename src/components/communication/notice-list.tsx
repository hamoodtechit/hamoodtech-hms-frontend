"use client"

import { useEffect, useState } from "react";
import { communicationService } from "@/services/communication-service";
import { Notice } from "@/types/communication";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
    Eye, 
    Trash2, 
    Loader2, 
    Calendar, 
    Search,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export function NoticeList() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

    const fetchNotices = async () => {
        try {
            setIsLoading(true);
            const response = await communicationService.getNotices({ limit: 100 });
            if (response.success) {
                setNotices(response.data);
            }
        } catch (error) {
            toast.error("Failed to fetch notices");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await communicationService.deleteNotice(id);
            toast.success("Notice deleted successfully");
            setNotices(notices.filter(n => n.id !== id));
        } catch (error) {
            toast.error("Failed to delete notice");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Archive...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Title</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Audience</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {notices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                        <AlertCircle className="h-8 w-8" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No notices found</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            notices.map((notice) => (
                                <TableRow key={notice.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                                        {format(new Date(notice.createdAt), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell className="font-bold text-sm max-w-[200px] truncate">
                                        {notice.title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[8px] font-black uppercase">
                                            {notice.departmentId ? "Department" : "Global"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                                    onClick={() => setSelectedNotice(notice)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className="text-[8px] font-black uppercase tracking-widest">
                                                            Notice Details
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                            {format(new Date(notice.createdAt), "PPP p")}
                                                        </span>
                                                    </div>
                                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
                                                        {notice.title}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                                                        Broadcast Target: {notice.departmentId || "Global (Entire Hospital)"}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-6 space-y-6">
                                                    <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 text-sm font-medium leading-relaxed">
                                                        {notice.content}
                                                    </div>
                                                    {notice.attachmentUrl && (
                                                        <div className="space-y-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Attachment</span>
                                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                                                                <img 
                                                                    src={notice.attachmentUrl} 
                                                                    alt="Attachment" 
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-black uppercase tracking-tight">Delete Notice?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-sm font-medium">
                                                        This action cannot be undone. This notice will be permanently removed from the system and all user tickers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="font-bold uppercase text-[10px]">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => handleDelete(notice.id)}
                                                        className="bg-destructive hover:bg-destructive/90 font-bold uppercase text-[10px]"
                                                    >
                                                        Confirm Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
