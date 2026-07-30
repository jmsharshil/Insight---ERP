import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, Loader2, FileIcon, UserCircle, CheckCircle2 } from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { ReportsSkeleton } from "@/components/common/Skeletons";

interface TicketDetailDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onResolved: () => void;
}

export function TicketDetailDrawer({ ticketId, onClose, onResolved }: TicketDetailDrawerProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolveFile, setResolveFile] = useState<File | null>(null);
  const [resolving, setResolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicket = async (id: string) => {
    setLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const res = await axiosRequest({
        method: "GET",
        url: `${baseUrl}/api/v1/support/queries/${id}/`,
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.data || res.data);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    } else {
      setData(null);
      setResolveMessage("");
      setResolveFile(null);
    }
  }, [ticketId]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !resolveMessage.trim()) return;

    setResolving(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const formData = new FormData();
      formData.append("message", resolveMessage);
      if (resolveFile) {
        formData.append("attachment", resolveFile);
      }

      await axiosRequest({
        method: "POST",
        url: `${baseUrl}/api/v1/support/queries/${ticketId}/resolve/`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        data: formData,
      });

      toast.success("Ticket resolved successfully!");
      onResolved();
      fetchTicket(ticketId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to resolve ticket");
    } finally {
      setResolving(false);
      setResolveMessage("");
      setResolveFile(null);
    }
  };

  const isOpen = !!ticketId;

  const canResolve = data && data.status !== 'resolved' && (user?.role === 'super_admin' || (typeof data.assigned_to === 'string' ? data.assigned_to === user?.id : data?.assigned_to?.id === user?.id));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col bg-background">
        {loading || !data ? (
          <div className="p-6 h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-border bg-card shrink-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <Badge variant="outline" className={`mb-3 ${data.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'} uppercase tracking-wider`}>
                    {data.status || 'open'}
                  </Badge>
                  <SheetTitle className="text-xl font-bold">{data.title}</SheetTitle>
                  <SheetDescription className="mt-1 flex items-center gap-2">
                    <span>Opened by <span className="font-semibold text-foreground">{typeof data.user === 'string' ? 'User' : (data.user?.full_name || data.user?.name || 'User')}</span></span>
                    <span>
                      {data.created_at && !isNaN(new Date(data.created_at).getTime()) 
                        ? format(new Date(data.created_at), "MMM d, yyyy h:mm a") 
                        : "-"}
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-muted/20">
              <div className="space-y-6">
                {/* Initial Query */}
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 border-b border-border pb-3">
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold text-sm">{typeof data.user === 'string' ? 'User' : (data.user?.full_name || data.user?.name || 'User')}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase">Author</Badge>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {data.description}
                  </div>
                  {data.attachment && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <a href={data.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Paperclip className="w-4 h-4" /> View Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* Messages Thread */}
                {data.messages?.length > 0 && data.messages.map((msg: any) => (
                  <div key={msg.id} className={`bg-card border border-border rounded-lg p-4 shadow-sm ${msg.is_resolution ? 'ring-2 ring-green-500/50' : ''}`}>
                    <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold text-sm">{typeof msg.user === 'string' ? 'Support Team' : (msg.user?.full_name || msg.user?.name || 'Support Team')}</span>
                        {msg.is_resolution && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-[10px] uppercase gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolution
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {msg.created_at && !isNaN(new Date(msg.created_at).getTime()) 
                          ? format(new Date(msg.created_at), "MMM d, h:mm a") 
                          : "-"}
                      </span>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {msg.message}
                    </div>
                    {msg.attachment && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <a href={msg.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Paperclip className="w-4 h-4" /> View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Resolve Form */}
            {canResolve && (
              <div className="p-4 border-t border-border bg-card shrink-0">
                <form onSubmit={handleResolve} className="space-y-3">
                  <Label className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Resolve Ticket
                  </Label>
                  <Textarea 
                    placeholder="Provide the resolution message..."
                    value={resolveMessage}
                    onChange={(e) => setResolveMessage(e.target.value)}
                    className="min-h-[80px] resize-none"
                    disabled={resolving}
                    required
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => e.target.files && setResolveFile(e.target.files[0])}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={resolving}
                        className={resolveFile ? 'bg-primary/10 text-primary border-primary/30' : ''}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        {resolveFile ? 'Attachment Added' : 'Attach File'}
                      </Button>
                      {resolveFile && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {resolveFile.name}
                        </span>
                      )}
                    </div>
                    <Button type="submit" disabled={resolving || !resolveMessage.trim()}>
                      {resolving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Mark Resolved
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
