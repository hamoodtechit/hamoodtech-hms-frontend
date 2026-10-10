"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { backupService, BackupOverview, BackupHistoryItem, BackupConfig } from "@/services/backup-service"
import {
    Cloud,
    CloudOff,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
    Play,
    RefreshCw,
    Trash2,
    Clock,
    HardDrive,
    Shield,
    Wifi,
    WifiOff,
    FileArchive,
    AlertTriangle,
    Zap,
    ExternalLink,
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"

export function BackupSettings() {
    // --- State ---
    const [overview, setOverview] = useState<BackupOverview | null>(null)
    const [history, setHistory] = useState<BackupHistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [triggering, setTriggering] = useState(false)
    const [testing, setTesting] = useState(false)
    const [disconnecting, setDisconnecting] = useState(false)
    const [connectingServiceAccount, setConnectingServiceAccount] = useState(false)
    const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

    // Config form
    const [configForm, setConfigForm] = useState<BackupConfig>({
        autoBackupEnabled: false,
        cronExpression: "0 2 * * *",
        timezone: "Asia/Dhaka",
        retentionCount: 5,
        googleDriveRetentionCount: 30,
    })

    // Service Account connection form
    const [showServiceAccountForm, setShowServiceAccountForm] = useState(false)
    const [saFolderId, setSaFolderId] = useState("")
    const [saEmail, setSaEmail] = useState("")
    const [saPrivateKey, setSaPrivateKey] = useState("")

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [overviewRes, historyRes] = await Promise.all([
                backupService.getOverview(),
                backupService.getHistory(),
            ])
            setOverview(overviewRes.data)
            setHistory(Array.isArray(historyRes.data) ? historyRes.data : [])

            // Populate config form from overview
            if (overviewRes.data) {
                setConfigForm({
                    autoBackupEnabled: overviewRes.data.autoBackupEnabled ?? false,
                    cronExpression: overviewRes.data.cronExpression || "0 2 * * *",
                    timezone: overviewRes.data.timezone || "Asia/Dhaka",
                    retentionCount: overviewRes.data.retentionCount ?? 5,
                    googleDriveRetentionCount: overviewRes.data.googleDriveRetentionCount ?? 30,
                })
            }
        } catch (error) {
            console.error("Failed to fetch backup data:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // --- Handlers ---
    const handleSaveConfig = async () => {
        try {
            setSaving(true)
            await backupService.updateConfig(configForm)
            toast.success("Backup configuration saved")
            fetchData()
        } catch (error) {
            toast.error("Failed to save configuration")
        } finally {
            setSaving(false)
        }
    }

    const handleTriggerBackup = async () => {
        try {
            setTriggering(true)
            await backupService.triggerBackup()
            toast.success("Backup triggered. Check the history for progress.")
            // Poll after a short delay
            setTimeout(() => fetchData(), 2000)
        } catch (error) {
            toast.error("Failed to trigger backup")
        } finally {
            setTriggering(false)
        }
    }

    const handleTestConnection = async () => {
        try {
            setTesting(true)
            await backupService.testDriveConnection()
            toast.success("Google Drive connection is working!")
        } catch (error) {
            toast.error("Connection test failed")
        } finally {
            setTesting(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            setDisconnecting(true)
            await backupService.disconnectDrive()
            toast.success("Google Drive disconnected")
            setDisconnectDialogOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to disconnect")
        } finally {
            setDisconnecting(false)
        }
    }

    const handleConnectServiceAccount = async () => {
        if (!saFolderId.trim() || !saEmail.trim() || !saPrivateKey.trim()) {
            toast.error("Please fill all service account fields")
            return
        }
        try {
            setConnectingServiceAccount(true)
            await backupService.connectServiceAccount(saFolderId.trim(), {
                client_email: saEmail.trim(),
                private_key: saPrivateKey.trim(),
            })
            toast.success("Service Account connected successfully!")
            setShowServiceAccountForm(false)
            setSaFolderId("")
            setSaEmail("")
            setSaPrivateKey("")
            fetchData()
        } catch (error) {
            toast.error("Failed to connect Service Account")
        } finally {
            setConnectingServiceAccount(false)
        }
    }

    const handleStartOAuth = async () => {
        try {
            const res = await backupService.startOAuth()
            if (res.data?.authorizationUrl) {
                window.open(res.data.authorizationUrl, "_blank")
            }
        } catch (error) {
            toast.error("Failed to start OAuth flow")
        }
    }

    // --- Helpers ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"><CheckCircle2 className="h-3 w-3" /> Success</Badge>
            case "FAILED":
                return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>
            case "RUNNING":
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Running</Badge>
            case "QUEUED":
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1"><Clock className="h-3 w-3" /> Queued</Badge>
            case "INTERRUPTED":
                return <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1"><AlertTriangle className="h-3 w-3" /> Interrupted</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A"
        return new Date(dateStr).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "N/A"
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1048576).toFixed(1)} MB`
    }

    // --- Render ---
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const isConnected = overview?.connected ?? false
    const hasRunningJob = overview?.currentJob?.status === "RUNNING" || overview?.currentJob?.status === "QUEUED"

    return (
        <div className="space-y-6">
            {/* Connection Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Cloud className="h-5 w-5" />
                                Google Drive Connection
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Connect your Google Drive to store backups securely in the cloud.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1.5">
                                    <Wifi className="h-3.5 w-3.5" />
                                    Connected
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-muted-foreground">
                                    <WifiOff className="h-3.5 w-3.5" />
                                    Not Connected
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isConnected ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">Google Drive is connected</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Provider: <span className="font-medium">{overview?.provider || "Google Drive"}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestConnection}
                                        disabled={testing}
                                        className="gap-1.5"
                                    >
                                        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                                        Test
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDisconnectDialogOpen(true)}
                                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                                    >
                                        <CloudOff className="h-3.5 w-3.5" />
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <CloudOff className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">No cloud storage connected</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Connect Google Drive to enable automatic cloud backups.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* OAuth Option */}
                                <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <ExternalLink className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">OAuth Sign-In</p>
                                            <p className="text-[11px] text-muted-foreground">Sign in with your Google account</p>
                                        </div>
                                    </div>
                                    <Button onClick={handleStartOAuth} className="w-full gap-2" size="sm">
                                        <Cloud className="h-4 w-4" />
                                        Connect with Google
                                    </Button>
                                </div>

                                {/* Service Account Option */}
                                <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            <Shield className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Service Account</p>
                                            <p className="text-[11px] text-muted-foreground">Use a service account key file</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowServiceAccountForm(!showServiceAccountForm)}
                                        className="w-full gap-2"
                                        size="sm"
                                    >
                                        <Shield className="h-4 w-4" />
                                        {showServiceAccountForm ? "Hide Form" : "Configure"}
                                    </Button>
                                </div>
                            </div>

                            {/* Service Account Form */}
                            {showServiceAccountForm && (
                                <div className="p-4 rounded-xl border bg-muted/30 space-y-4 mt-2">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Share the target Drive folder with the service account email as <strong>Editor</strong> before connecting.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium">Google Drive Folder ID</Label>
                                            <Input
                                                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2w..."
                                                value={saFolderId}
                                                onChange={(e) => setSaFolderId(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium">Service Account Email</Label>
                                            <Input
                                                placeholder="backup@project.iam.gserviceaccount.com"
                                                value={saEmail}
                                                onChange={(e) => setSaEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium">Private Key</Label>
                                            <Textarea
                                                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                                                value={saPrivateKey}
                                                onChange={(e) => setSaPrivateKey(e.target.value)}
                                                rows={4}
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleConnectServiceAccount}
                                        disabled={connectingServiceAccount}
                                        className="gap-2"
                                        size="sm"
                                    >
                                        {connectingServiceAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                        Connect Service Account
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Backup Configuration Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Backup Schedule & Retention
                    </CardTitle>
                    <CardDescription>
                        Configure automatic backups, scheduling, and retention policies.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${configForm.autoBackupEnabled ? "bg-emerald-500/10" : "bg-muted"}`}>
                                <RefreshCw className={`h-5 w-5 ${configForm.autoBackupEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Automatic Backups</p>
                                <p className="text-xs text-muted-foreground">
                                    {configForm.autoBackupEnabled ? "Backups will run on the configured schedule" : "Enable to schedule automatic backups"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={configForm.autoBackupEnabled}
                            onCheckedChange={(checked) => setConfigForm({ ...configForm, autoBackupEnabled: checked })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Cron Expression</Label>
                            <Input
                                value={configForm.cronExpression}
                                onChange={(e) => setConfigForm({ ...configForm, cronExpression: e.target.value })}
                                placeholder="0 2 * * *"
                                className="font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">Standard 5-field cron (e.g. &quot;0 2 * * *&quot; = daily at 2:00 AM)</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Timezone</Label>
                            <Select
                                value={configForm.timezone}
                                onValueChange={(value) => setConfigForm({ ...configForm, timezone: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Asia/Dhaka">Asia/Dhaka (UTC+6)</SelectItem>
                                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
                                    <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Local Retention (backups to keep)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={configForm.retentionCount}
                                onChange={(e) => setConfigForm({ ...configForm, retentionCount: Number(e.target.value) || 5 })}
                            />
                            <p className="text-[11px] text-muted-foreground">Older local backups are automatically removed</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Google Drive Retention (backups to keep)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={365}
                                value={configForm.googleDriveRetentionCount}
                                onChange={(e) => setConfigForm({ ...configForm, googleDriveRetentionCount: Number(e.target.value) || 30 })}
                            />
                            <p className="text-[11px] text-muted-foreground">Older cloud backups are automatically removed</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleTriggerBackup}
                        disabled={triggering || hasRunningJob}
                        className="gap-2"
                    >
                        {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        {hasRunningJob ? "Backup In Progress..." : "Backup Now"}
                    </Button>
                    <Button onClick={handleSaveConfig} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Configuration
                    </Button>
                </CardFooter>
            </Card>

            {/* Last Backup Summary Card */}
            {overview && (overview.lastSuccessfulBackup || overview.lastFailedBackup) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileArchive className="h-5 w-5" />
                            Last Backup Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {overview.lastSuccessfulBackup && (
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Last Successful</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(overview.lastSuccessfulBackup.completedAt || overview.lastSuccessfulBackup.createdAt)}
                                    </p>
                                    {overview.lastSuccessfulBackup.fileSize && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Size: {formatFileSize(overview.lastSuccessfulBackup.fileSize)}
                                        </p>
                                    )}
                                </div>
                            )}
                            {overview.lastFailedBackup && (
                                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        <span className="text-sm font-semibold text-destructive">Last Failed</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(overview.lastFailedBackup.completedAt || overview.lastFailedBackup.createdAt)}
                                    </p>
                                    {overview.lastFailedBackup.error && (
                                        <p className="text-xs text-destructive/80 mt-1 truncate">
                                            Error: {overview.lastFailedBackup.error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Running Job Card */}
            {hasRunningJob && overview?.currentJob && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Backup in progress</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Status: {overview.currentJob.status} • Started: {formatDate(overview.currentJob.startedAt || overview.currentJob.createdAt)}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Backup History Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5" />
                                Backup History
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Recent backup executions and their results.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <FileArchive className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No backup history yet</p>
                            <p className="text-xs mt-1">Trigger a manual backup or enable the automatic schedule to get started.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">Started</th>
                                            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">Completed</th>
                                            <th className="px-4 py-3 text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider">Size</th>
                                            <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground uppercase tracking-wider">Cloud</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {history.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                                                <td className="px-4 py-3 text-xs font-medium">{formatDate(item.startedAt || item.createdAt)}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(item.completedAt)}</td>
                                                <td className="px-4 py-3 text-xs text-right font-medium">{formatFileSize(item.fileSize)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.googleDriveFileId ? (
                                                        <Cloud className="h-4 w-4 text-blue-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Disconnect Confirmation Dialog */}
            <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Google Drive?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the stored credentials. Existing backups on Google Drive will not be deleted,
                            but automatic cloud uploads will stop until you reconnect.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {disconnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
