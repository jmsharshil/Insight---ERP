import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Send, Loader2, UserCircle, CheckCircle2, ArrowLeft, Forward } from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [forwardOpen, setForwardOpen] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [forwarding, setForwarding] = useState(false);

  const fetchTicket = async () => {
    if (!id) return;
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
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (forwardOpen && staffUsers.length === 0) {
      const fetchStaff = async () => {
        try {
          const raw = localStorage.getItem("Insight_Login_Data");
          const token = raw ? JSON.parse(raw)?.access : "";
          const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
          // Fetch non-student users as potential assignees
          const res = await axiosRequest({
            method: "GET",
            url: `${baseUrl}/api/auth/users/`,
            headers: { Authorization: `Bearer ${token}` },
          });
          const allUsers = res.data?.data || res.data || [];
          setStaffUsers(allUsers.filter((u: any) => u.role !== 'student' && u.role !== 'parents'));
        } catch (err) {
          console.error("Failed to load users", err);
        }
      };
      fetchStaff();
    }
  }, [forwardOpen]);

  const handleForward = async () => {
    if (!id || !selectedStaffId) return;

    setForwarding(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      await axiosRequest({
        method: "POST",
        url: `${baseUrl}/api/v1/support/queries/${id}/forward/`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { user_id: selectedStaffId },
      });

      toast.success("Ticket forwarded successfully!");
      setForwardOpen(false);
      setSelectedStaffId("");
      fetchTicket();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to forward ticket");
    } finally {
      setForwarding(false);
    }
  };

  const handleSubmit = async (action: 'reply' | 'resolve') => {
    if (!id || !message.trim()) return;

    setSubmitting(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const formData = new FormData();
      formData.append("message", message);
      if (file) {
        formData.append("attachment", file);
      }

      await axiosRequest({
        method: "POST",
        url: `${baseUrl}/api/v1/support/queries/${id}/${action}/`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: formData,
      });

      toast.success(`Ticket ${action === 'resolve' ? 'resolved' : 'replied to'} successfully!`);
      fetchTicket();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || `Failed to ${action} ticket`);
    } finally {
      setSubmitting(false);
      setMessage("");
      setFile(null);
    }
  };

  const safeFormat = (dateString: string) => {
    if (!dateString) return "-";
    // Fix for strict ISO parsers that fail on "YYYY-MM-DD HH:mm:ss"
    const safeStr = dateString.includes("T") ? dateString : dateString.replace(" ", "T");
    const d = new Date(safeStr);
    return isNaN(d.getTime()) ? "-" : format(d, "MMM d, yyyy h:mm a");
  };

  const isIssuer = data ? (typeof data.user === 'string' ? data.user === user?.id : data.user?.id === user?.id) : false;
  const isAssigned = data ? (typeof data.assigned_to === 'string' ? data.assigned_to === user?.id : data.assigned_to?.id === user?.id) : false;
  
  const canReply = user?.role === 'super_admin' || isIssuer || isAssigned;
  const canResolve = data && data.status !== 'resolved' && (user?.role === 'super_admin' || isAssigned);
  const canAssign = user?.role === 'super_admin' || isAssigned;

  if (loading || !data) {
    return (
      <DashboardLayout pageTitle="Support Ticket" stats={[]}>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading ticket details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={`Ticket: ${data.title}`} stats={[]}>
      <div className="mx-auto space-y-6 mt-6">
        <div className="flex justify-between items-center mb-2 -ml-4">
          <Button variant="ghost" onClick={() => navigate("/support")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets
          </Button>
          {canAssign && (
            <Button variant="outline" size="sm" onClick={() => setForwardOpen(true)} className="gap-2">
              <Forward className="w-4 h-4" /> Forward Ticket
            </Button>
          )}
        </div>
        
        <SectionCard title="Query Details">
          <div className="p-4 bg-muted/20 border-b border-border">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <Badge variant="outline" className={`w-fit mb-2 ${data.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'} uppercase tracking-wider`}>
                  {data.status || 'open'}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>Opened by <span className="font-semibold">{data.requested_by_name || (typeof data.user === 'string' ? 'User' : (data.user?.full_name || data.user?.name || 'User'))}</span></span>
                  <span>•</span>
                  <span>{safeFormat(data.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {data.description}
              </div>
              {data.attachment && (
                <div className="mt-5 pt-4 border-t border-border">
                  <a href={data.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 w-fit px-3 py-1.5 rounded-md">
                    <Paperclip className="w-4 h-4" /> View Attached File
                  </a>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {data.messages && data.messages.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">Conversation Thread</h3>
            {data.messages.map((msg: any) => {
              let senderName = "Support Team";
              if (msg.sender === data.user || msg.user === data.user) {
                senderName = data.requested_by_name || "Author";
              } else if (msg.sender === data.assigned_to || msg.user === data.assigned_to) {
                senderName = data.assigned_to_name || "Assigned Staff";
              }

              return (
              <div key={msg.id} className={`bg-card border border-border rounded-lg p-5 shadow-sm ${msg.is_resolution ? 'ring-2 ring-green-500/50' : ''}`}>
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-6 h-6 text-muted-foreground" />
                    <span className="font-semibold">{senderName}</span>
                    {msg.is_resolution && (
                      <Badge className="bg-green-500 hover:bg-green-600 uppercase gap-1 ml-2">
                        <CheckCircle2 className="w-3 h-3" /> Resolution
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {safeFormat(msg.created_at)}
                  </span>
                </div>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </div>
                {msg.attachment && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <a href={msg.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 w-fit px-3 py-1.5 rounded-md">
                      <Paperclip className="w-4 h-4" /> View Attachment
                    </a>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}

        {canReply && (
          <SectionCard title={data.status === 'resolved' ? "Reopen Ticket" : "Send Reply"}>
            <div className="space-y-4 p-4">
              <Textarea 
                placeholder={data.status === 'resolved' ? "Provide a message to reopen this ticket..." : "Type your reply here..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={submitting}
                required
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                    className={file ? 'bg-primary/10 text-primary border-primary/30' : ''}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {file ? 'File Attached' : 'Attach File'}
                  </Button>
                  {file && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {file.name}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={canResolve ? "outline" : "default"}
                    disabled={submitting || !message.trim()} 
                    onClick={() => handleSubmit('reply')}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {data.status === 'resolved' ? 'Reopen Ticket' : 'Send Reply'}
                  </Button>
                  {canResolve && (
                    <Button 
                      type="button" 
                      variant="default"
                      disabled={submitting || !message.trim()} 
                      onClick={() => handleSubmit('resolve')}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Ticket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {staffUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name || u.name || "Unknown"} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardOpen(false)}>Cancel</Button>
            <Button onClick={handleForward} disabled={forwarding || !selectedStaffId}>
              {forwarding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Forward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
