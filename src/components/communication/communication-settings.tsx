"use client"

import { useState } from "react";
import { communicationService } from "@/services/communication-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Send, Bell, Loader2, Info, Users, User as UserIcon, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useDepartments } from "@/hooks/hr-queries";
import { useStoreContext } from "@/store/use-store-context";
import { MediaPicker } from "../media/media-picker";

import { NoticeList } from "./notice-list";

export function CommunicationSettings() {
    const { activeStoreId } = useStoreContext();
    const [loading, setLoading] = useState(false);
    
    // Fetch actual data
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId || "" });
    const departments = departmentsRes?.data || [];

    // Notification State
    const [form, setForm] = useState({
        title: "",
        content: "",
        departmentId: "global",
        priority: "medium",
        attachmentUrl: ""
    });

    const handleCreateNotification = async () => {
        if (!form.title || !form.content) {
            return toast.error("Title and message are required");
        }
        try {
            setLoading(true);
            
            // Build payload dynamically to avoid sending nulls
            const payload: any = {
                title: form.title,
                content: form.content,
                branchId: activeStoreId
            };
            
            if (form.departmentId && form.departmentId !== "global") {
                payload.departmentId = form.departmentId;
            }
            
            if (form.attachmentUrl) {
                payload.attachmentUrl = form.attachmentUrl;
            }

            await communicationService.createNotice(payload);
            toast.success("Notification sent successfully");
            setForm({ title: "", content: "", departmentId: "global", priority: "medium", attachmentUrl: "" });
            
            // Reload the list if needed by triggering a refresh or just letting the user switch
        } catch (error) {
            toast.error("Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-1 mb-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-primary">Communication Hub</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Manage hospital-wide broadcasts and announcements</p>
            </div>

            <Tabs defaultValue="broadcast" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl mb-6">
                    <TabsTrigger value="broadcast" className="rounded-lg font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2">
                        <Send className="h-3.5 w-3.5" />
                        New Broadcast
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="rounded-lg font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2">
                        <Megaphone className="h-3.5 w-3.5" />
                        Manage Archive
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="broadcast">
                    <Card className="border-none shadow-xl bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Bell className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Create & Send Notification</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Broadcast alerts to departments or the entire hospital.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                                        <Users className="h-3 w-3" />
                                        Target Audience
                                    </Label>
                                    <Select 
                                        value={form.departmentId} 
                                        onValueChange={(val) => setForm({...form, departmentId: val})}
                                    >
                                        <SelectTrigger className="font-bold h-12 rounded-xl bg-muted/30 border-none">
                                            <SelectValue placeholder="Select Target" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="global" className="font-bold">Public (Entire Hospital)</SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id} className="font-bold">
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                                        <Info className="h-3 w-3" />
                                        Alert Priority
                                    </Label>
                                    <Select 
                                        value={form.priority} 
                                        onValueChange={(val) => setForm({...form, priority: val})}
                                    >
                                        <SelectTrigger className="font-bold h-12 rounded-xl bg-muted/30 border-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low" className="font-bold">Low</SelectItem>
                                            <SelectItem value="medium" className="font-bold">Medium</SelectItem>
                                            <SelectItem value="high" className="font-bold text-amber-600">High</SelectItem>
                                            <SelectItem value="urgent" className="font-bold text-red-600">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Notification Subject</Label>
                                <Input 
                                    placeholder="e.g. Urgent Meeting or System Update" 
                                    value={form.title}
                                    onChange={(e) => setForm({...form, title: e.target.value})}
                                    className="font-bold h-12 rounded-xl bg-muted/30 border-none px-4"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Notification Message</Label>
                                <Textarea 
                                    placeholder="Type the message details here..."
                                    className="min-h-[150px] font-medium leading-relaxed resize-none rounded-xl bg-muted/30 border-none p-4"
                                    value={form.content}
                                    onChange={(e) => setForm({...form, content: e.target.value})}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Attachment (Optional)</Label>
                                </div>
                                <MediaPicker 
                                    value={form.attachmentUrl} 
                                    onChange={(url) => setForm({...form, attachmentUrl: url})} 
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                <div className="bg-blue-500/10 p-2 rounded-full">
                                    <Info className="h-4 w-4 text-blue-500" />
                                </div>
                                <p className="text-[11px] font-bold text-blue-600/80 italic leading-snug">
                                    This notification will be published to the notification board and pushed in real-time to all online users in the selected target.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-8 border-t border-border/50">
                            <Button 
                                onClick={handleCreateNotification} 
                                disabled={loading} 
                                className="w-full h-14 gap-2 font-black uppercase tracking-widest bg-primary hover:shadow-2xl hover:shadow-primary/30 transition-all rounded-xl"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Broadcast Notification Now
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="manage">
                    <NoticeList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
