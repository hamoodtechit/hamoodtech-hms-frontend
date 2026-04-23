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
                content: form.content
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
        } catch (error) {
            toast.error("Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <Card className="border-none shadow-xl bg-card">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Create & Send Notification</CardTitle>
                            <CardDescription className="text-xs font-medium">Broadcast alerts to departments or the entire hospital.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Target Audience</Label>
                            <Select 
                                value={form.departmentId} 
                                onValueChange={(val) => setForm({...form, departmentId: val})}
                            >
                                <SelectTrigger className="font-bold h-11">
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
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Alert Priority</Label>
                            <Select 
                                value={form.priority} 
                                onValueChange={(val) => setForm({...form, priority: val})}
                            >
                                <SelectTrigger className="font-bold h-11">
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

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Notification Subject</Label>
                        <Input 
                            placeholder="e.g. Urgent Meeting or System Update" 
                            value={form.title}
                            onChange={(e) => setForm({...form, title: e.target.value})}
                            className="font-bold h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Notification Message</Label>
                        <Textarea 
                            placeholder="Type the message details here..."
                            className="min-h-[150px] font-medium leading-relaxed resize-none"
                            value={form.content}
                            onChange={(e) => setForm({...form, content: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Attachment (Optional)</Label>
                        </div>
                        <MediaPicker 
                            value={form.attachmentUrl} 
                            onChange={(url) => setForm({...form, attachmentUrl: url})} 
                        />
                    </div>

                    <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="bg-blue-500/10 p-1.5 rounded-full">
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-[11px] font-medium text-blue-600/80 italic">
                            This notification will be published to the notification board and pushed in real-time to all online users in the selected target.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-6">
                    <Button 
                        onClick={handleCreateNotification} 
                        disabled={loading} 
                        className="w-full h-12 gap-2 font-black uppercase tracking-widest bg-primary hover:shadow-lg hover:shadow-primary/20 transition-all"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Broadcast Notification Now
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
