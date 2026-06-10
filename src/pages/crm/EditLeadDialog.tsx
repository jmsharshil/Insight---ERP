import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropdown } from "@/hooks/useDropdown";
import { API } from "@/service/api";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
import { Loader2 } from "lucide-react";

interface EditLeadDialogProps {
  lead: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditLeadDialog({ lead, open, onOpenChange, onSuccess }: EditLeadDialogProps) {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Dropdowns
  const { options: branches, loading: branchesLoading, fetchOptions: fetchBranches } = useDropdown("branches", false);

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open, fetchBranches]);

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (lead && open) {
      setFormData({
        branch: lead.branch || "",
        first_name: lead.first_name || "",
        surname: lead.surname || "",
        email: lead.email || "",
        phone_student: lead.phone_student || "",
        course: lead.course || "cseet",
        group_module: lead.group_module || "full",
        batch_attempt: lead.batch_attempt || "june",
        location: lead.location || "",
        consent: lead.consent ?? true,
        note: lead.note || "",
        father_name: lead.father_name || "",
        street: lead.street || "",
        apartment: lead.apartment || "",
        city: lead.city || "",
        state: lead.state || "",
        country: lead.country || "",
        phone_father: lead.phone_father || "",
        qualification: lead.qualification || "appearing_12",
        reference: lead.reference || "google",
        inquiry_date: lead.inquiry_date ? lead.inquiry_date.split("T")[0] : new Date().toISOString().split("T")[0],
        tenth_medium: lead.tenth_medium || "",
        tenth_school: lead.tenth_school || "",
        tenth_coaching: lead.tenth_coaching || "",
        tenth_percentage: lead.tenth_percentage || "",
        tenth_percentile: lead.tenth_percentile || "",
        twelfth_medium: lead.twelfth_medium || "",
        twelfth_school: lead.twelfth_school || "",
        twelfth_coaching: lead.twelfth_coaching || "",
        twelfth_percentage: lead.twelfth_percentage || "",
        twelfth_percentile: lead.twelfth_percentile || "",
        grad_university: lead.grad_university || "",
        grad_college: lead.grad_college || "",
        grad_last_sem: lead.grad_last_sem || "",
        followup_date: lead.followup_date || "",
        visit_date: lead.visit_date || "",
      });
    }
  }, [lead, open]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);

    const payload = { ...formData };
    // Format dates correctly if they exist
    if (payload.followup_date && payload.followup_date.includes("T")) {
      payload.followup_date = payload.followup_date.replace("T", " ");
      if (payload.followup_date.length === 16) payload.followup_date += ":00"; // ensure seconds
    }
    if (payload.visit_date && payload.visit_date.includes("T")) {
      payload.visit_date = payload.visit_date.replace("T", " ");
      if (payload.visit_date.length === 16) payload.visit_date += ":00";
    }

    dispatch({
      type: "UPDATE_LEAD",
      method: "PUT",
      endPoint: `/api/v1/leads/${lead.id}/`,
      auth: true,
      body: payload,
      getResponse: () => {
        toast.success("Lead updated successfully");
        setLoading(false);
        onSuccess();
        onOpenChange(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update lead");
        setLoading(false);
      },
    } as any);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead: {lead.first_name} {lead.surname}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Section: Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-1">Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Branch</Label>
                <Select value={formData.branch} onValueChange={(v) => handleChange("branch", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent>
                    {branchesLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                      branches.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input className="mt-1" required value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
              </div>
              <div>
                <Label>Surname <span className="text-destructive">*</span></Label>
                <Input className="mt-1" required value={formData.surname} onChange={(e) => handleChange("surname", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="mt-1" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div>
                <Label>Student Phone <span className="text-destructive">*</span></Label>
                <Input className="mt-1" required value={formData.phone_student} onChange={(e) => handleChange("phone_student", e.target.value)} />
              </div>
              <div>
                <Label>Father's Phone</Label>
                <Input className="mt-1" value={formData.phone_father} onChange={(e) => handleChange("phone_father", e.target.value)} />
              </div>
              <div>
                <Label>Father's Name</Label>
                <Input className="mt-1" value={formData.father_name} onChange={(e) => handleChange("father_name", e.target.value)} />
              </div>
              <div>
                <Label>Inquiry Date</Label>
                <Input type="date" className="mt-1" value={formData.inquiry_date} onChange={(e) => handleChange("inquiry_date", e.target.value)} />
              </div>
              <div>
                <Label>Reference</Label>
                <Select value={formData.reference} onValueChange={(v) => handleChange("reference", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Reference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook / Social Media</SelectItem>
                    <SelectItem value="friend">Friend / Relative</SelectItem>
                    <SelectItem value="seminar">Seminar / Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Course & Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-1">Course & Inquiry specifics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Course</Label>
                <Select value={formData.course} onValueChange={(v) => handleChange("course", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cseet">CSEET</SelectItem>
                    <SelectItem value="cs_executive">CS Executive</SelectItem>
                    <SelectItem value="cs_professional">CS Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Group / Module</Label>
                <Select value={formData.group_module} onValueChange={(v) => handleChange("group_module", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="module_1">Module 1</SelectItem>
                    <SelectItem value="module_2">Module 2</SelectItem>
                    <SelectItem value="full">Both Modules</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Batch / Attempt</Label>
                <Select value={formData.batch_attempt} onValueChange={(v) => handleChange("batch_attempt", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Attempt" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="june">June</SelectItem>
                    <SelectItem value="december">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location / Branch Inquiry</Label>
                <Input className="mt-1" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section: Academic History */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-1">Academic History</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Current Qualification</Label>
                <Select value={formData.qualification} onValueChange={(v) => handleChange("qualification", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Qualification" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appearing_12">Appearing 12th</SelectItem>
                    <SelectItem value="passed_12">Passed 12th</SelectItem>
                    <SelectItem value="graduating">Graduating</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* 10th */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border/50">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">10th Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Medium</Label>
                    <Select value={formData.tenth_medium} onValueChange={(v) => handleChange("tenth_medium", v)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gseb">GSEB</SelectItem>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">School Name</Label>
                    <Input className="mt-1 h-8" value={formData.tenth_school} onChange={(e) => handleChange("tenth_school", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Percentage</Label>
                    <Input className="mt-1 h-8" value={formData.tenth_percentage} onChange={(e) => handleChange("tenth_percentage", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Percentile</Label>
                    <Input className="mt-1 h-8" value={formData.tenth_percentile} onChange={(e) => handleChange("tenth_percentile", e.target.value)} />
                  </div>
                </div>
              </div>
              
              {/* 12th */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border/50">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">12th Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Medium</Label>
                    <Select value={formData.twelfth_medium} onValueChange={(v) => handleChange("twelfth_medium", v)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gseb">GSEB</SelectItem>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">School Name</Label>
                    <Input className="mt-1 h-8" value={formData.twelfth_school} onChange={(e) => handleChange("twelfth_school", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Percentage</Label>
                    <Input className="mt-1 h-8" value={formData.twelfth_percentage} onChange={(e) => handleChange("twelfth_percentage", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Percentile</Label>
                    <Input className="mt-1 h-8" value={formData.twelfth_percentile} onChange={(e) => handleChange("twelfth_percentile", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Grad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label>University</Label>
                <Input className="mt-1" value={formData.grad_university} onChange={(e) => handleChange("grad_university", e.target.value)} />
              </div>
              <div>
                <Label>College</Label>
                <Input className="mt-1" value={formData.grad_college} onChange={(e) => handleChange("grad_college", e.target.value)} />
              </div>
              <div>
                <Label>Last Semester</Label>
                <Input className="mt-1" value={formData.grad_last_sem} onChange={(e) => handleChange("grad_last_sem", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section: Address Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-1">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Street</Label>
                <Input className="mt-1" value={formData.street} onChange={(e) => handleChange("street", e.target.value)} />
              </div>
              <div>
                <Label>Apartment/Building</Label>
                <Input className="mt-1" value={formData.apartment} onChange={(e) => handleChange("apartment", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label>City</Label>
                <Input className="mt-1" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
              <div>
                <Label>State</Label>
                <Input className="mt-1" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
              </div>
              <div>
                <Label>Country</Label>
                <Input className="mt-1" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section: Stage Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-1">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Follow-up Date & Time</Label>
                <Input type="datetime-local" className="mt-1" value={formData.followup_date?.replace(" ", "T")?.slice(0, 16) || ""} onChange={(e) => handleChange("followup_date", e.target.value)} />
              </div>
              <div>
                <Label>Visit Date & Time</Label>
                <Input type="datetime-local" className="mt-1" value={formData.visit_date?.replace(" ", "T")?.slice(0, 16) || ""} onChange={(e) => handleChange("visit_date", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section: Additional */}
          <div className="space-y-4">
            <div>
              <Label>Note</Label>
              <Input className="mt-1" value={formData.note} onChange={(e) => handleChange("note", e.target.value)} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="consent" checked={formData.consent} onCheckedChange={(c) => handleChange("consent", c)} />
              <Label htmlFor="consent" className="text-sm font-medium">Consent given</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
