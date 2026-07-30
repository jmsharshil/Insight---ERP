import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, X } from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { toast } from "sonner";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTicketDialog({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (file) {
        formData.append("attachment", file);
      }

      await axiosRequest({
        method: "POST",
        url: `${baseUrl}/api/v1/support/queries/`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: formData,
      });

      toast.success("Support ticket created successfully.");
      setTitle("");
      setDescription("");
      setFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue in detail. Our support team will get back to you soon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input 
              id="title" 
              placeholder="e.g., Cannot access specific course" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea 
              id="description" 
              placeholder="Provide a detailed explanation..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Attachment (Optional)</Label>
            {file ? (
              <div className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/30">
                <span className="text-sm truncate text-muted-foreground">{file.name}</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setFile(null)}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-md hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload a screenshot or document</span>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  disabled={loading}
                />
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !description}>
              {loading ? "Submitting..." : "Submit Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
