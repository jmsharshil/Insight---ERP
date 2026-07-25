import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { admissionActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Save, Upload, FileCheck, Eye, Loader2, X } from "lucide-react";

interface EditAdmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: any;
  onSaveSuccess: () => void;
}

const documentFields = [
  { key: "photo", label: "Photograph" },
  { key: "signature", label: "Signature" },
  { key: "tenth_marksheet", label: "10th Marksheet" },
  { key: "twelfth_marksheet", label: "12th Marksheet" },
  { key: "grad_marksheet", label: "Graduation Marksheet" },
  { key: "id_proof", label: "ID Proof" },
];

export default function EditAdmissionDialog({
  open,
  onOpenChange,
  admission,
  onSaveSuccess,
}: EditAdmissionDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    first_name: "",
    surname: "",
    dob: "",
    category: "gen",
    street: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    location: "",
    father_name: "",
    mother_name: "",
    phone_student: "",
    phone_father: "",
    phone_father_2: "",
    email: "",
    email_parent: "",
    course: "cs_executive",
    group_module: "module_1",
    batch_attempt: "june",
    qualification: "appearing_12",
    tenth_medium: "gseb",
    tenth_school: "",
    tenth_coaching: "",
    tenth_percentage: "",
    tenth_percentile: "",
    twelfth_medium: "gseb",
    twelfth_school: "",
    twelfth_coaching: "",
    twelfth_percentage: "",
    twelfth_percentile: "",
    grad_university: "",
    grad_college: "",
    grad_last_sem: "",
    note: "",
    reference: "google",
  });

  // Reset form when dialog opens or admission data changes
  useEffect(() => {
    if (open && admission) {
      setEditForm({
        first_name: admission.first_name || "",
        surname: admission.surname || "",
        dob: admission.dob || "",
        category: admission.category || "gen",
        street: admission.street || "",
        apartment: admission.apartment || "",
        city: admission.city || "",
        state: admission.state || "",
        pincode: admission.pincode || "",
        country: admission.country || "India",
        location: admission.location || "",
        father_name: admission.father_name || "",
        mother_name: admission.mother_name || "",
        phone_student: admission.phone_student || "",
        phone_father: admission.phone_father || "",
        phone_father_2: admission.phone_father_2 || "",
        email: admission.email || "",
        email_parent: admission.email_parent || "",
        course: admission.course || "cs_executive",
        group_module: admission.group_module || "module_1",
        batch_attempt: admission.batch_attempt || "june",
        qualification: admission.qualification || "appearing_12",
        tenth_medium: admission.tenth_medium || "gseb",
        tenth_school: admission.tenth_school || "",
        tenth_coaching: admission.tenth_coaching || "",
        tenth_percentage: admission.tenth_percentage ? String(admission.tenth_percentage) : "",
        tenth_percentile: admission.tenth_percentile ? String(admission.tenth_percentile) : "",
        twelfth_medium: admission.twelfth_medium || "gseb",
        twelfth_school: admission.twelfth_school || "",
        twelfth_coaching: admission.twelfth_coaching || "",
        twelfth_percentage: admission.twelfth_percentage ? String(admission.twelfth_percentage) : "",
        twelfth_percentile: admission.twelfth_percentile ? String(admission.twelfth_percentile) : "",
        grad_university: admission.grad_university || "",
        grad_college: admission.grad_college || "",
        grad_last_sem: admission.grad_last_sem || "",
        note: admission.note || "",
        reference: admission.reference || "google",
      });
      setSelectedFiles({});
    }
  }, [open, admission]);

  const handleEditFormChange = (field: string, value: string | boolean) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "course") {
        if (value === "cseet") {
          updated.group_module = "full";
          if (!["june", "oct", "feb"].includes(prev.batch_attempt)) {
            updated.batch_attempt = "june";
          }
        } else if (value === "cs_executive" || value === "cs_professional") {
          if (prev.group_module === "full" || prev.group_module === "both") {
            updated.group_module = "module_1";
          }
          if (!["june", "dec"].includes(prev.batch_attempt)) {
            updated.batch_attempt = "june";
          }
        }
      }
      return updated;
    });
  };

  const triggerFileInput = (key: string) => {
    setSelectedDocKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedDocKey) {
      setSelectedFiles((prev) => ({
        ...prev,
        [selectedDocKey]: file,
      }));
    }
    e.target.value = "";
  };

  const handleRemoveSelectedFile = (key: string) => {
    setSelectedFiles((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admission?.id) return;

    const payload = new FormData();

    // 1. Append all text fields
    Object.entries(editForm).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        if (key.endsWith("_percentage") || key.endsWith("_percentile")) {
          payload.append(key, val ? String(parseFloat(val)) : "");
        } else {
          payload.append(key, String(val));
        }
      }
    });

    // 2. Append all selected files
    Object.entries(selectedFiles).forEach(([key, file]) => {
      if (file) {
        payload.append(key, file);
      }
    });

    dispatch({
      type: admissionActions.SUBMIT_ADMISSION,
      method: "PATCH",
      endPoint: API.ADMISSIONS.SUBMIT(admission.id),
      body: payload,
      auth: true,
      setLoading: (val: boolean) => setUpdatingDetails(val),
      getResponse: () => {
        toast.success("Admission details updated successfully!");
        onOpenChange(false);
        onSaveSuccess();
      },
      getError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to update details";
        toast.error(errMsg);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/10">
          <DialogTitle className="text-xl font-heading font-bold text-text-primary flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" /> Edit Admission Details
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Modify personal, contact, academic, past education, and documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveDetails} className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="personal" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-2 border-b border-border bg-muted/5">
              <TabsList className="grid grid-cols-5 w-full h-9 p-0.5 bg-muted/80 rounded-lg">
                <TabsTrigger value="personal" className="text-xs font-semibold">Personal</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs font-semibold">Contact & Address</TabsTrigger>
                <TabsTrigger value="academic" className="text-xs font-semibold">Academic</TabsTrigger>
                <TabsTrigger value="education" className="text-xs font-semibold">Education</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs font-semibold">Documents</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* 1. PERSONAL DETAILS TAB */}
              <TabsContent value="personal" className="space-y-4 focus:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">First Name <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      value={editForm.first_name}
                      onChange={(e) => handleEditFormChange("first_name", e.target.value)}
                      placeholder="e.g. Tulsi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Surname <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      value={editForm.surname}
                      onChange={(e) => handleEditFormChange("surname", e.target.value)}
                      placeholder="e.g. Kerai"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Date of Birth <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => handleEditFormChange("dob", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Category</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(val) => handleEditFormChange("category", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gen">General</SelectItem>
                        <SelectItem value="obc">OBC</SelectItem>
                        <SelectItem value="sc">SC</SelectItem>
                        <SelectItem value="st">ST</SelectItem>
                        <SelectItem value="ews">EWS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Father's Name</Label>
                    <Input
                      value={editForm.father_name}
                      onChange={(e) => handleEditFormChange("father_name", e.target.value)}
                      placeholder="e.g. Harji"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Mother's Name</Label>
                    <Input
                      value={editForm.mother_name}
                      onChange={(e) => handleEditFormChange("mother_name", e.target.value)}
                      placeholder="e.g. Jashuben"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 2. CONTACT & ADDRESS TAB */}
              <TabsContent value="contact" className="space-y-4 focus:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Student Phone <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      type="tel"
                      value={editForm.phone_student}
                      onChange={(e) => handleEditFormChange("phone_student", e.target.value)}
                      placeholder="e.g. 9954563258"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Student Email <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditFormChange("email", e.target.value)}
                      placeholder="e.g. email@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Father's Phone</Label>
                    <Input
                      type="tel"
                      value={editForm.phone_father}
                      onChange={(e) => handleEditFormChange("phone_father", e.target.value)}
                      placeholder="e.g. 9978221566"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Alt Father's Phone</Label>
                    <Input
                      type="tel"
                      value={editForm.phone_father_2}
                      onChange={(e) => handleEditFormChange("phone_father_2", e.target.value)}
                      placeholder="Alternate phone"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-text-primary">Parent Email</Label>
                    <Input
                      type="email"
                      value={editForm.email_parent}
                      onChange={(e) => handleEditFormChange("email_parent", e.target.value)}
                      placeholder="parent@example.com"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-text-primary">Street Address</Label>
                    <Input
                      value={editForm.street}
                      onChange={(e) => handleEditFormChange("street", e.target.value)}
                      placeholder="Street address details"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Apartment</Label>
                    <Input
                      value={editForm.apartment}
                      onChange={(e) => handleEditFormChange("apartment", e.target.value)}
                      placeholder="Apartment/Suite"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">City</Label>
                    <Input
                      value={editForm.city}
                      onChange={(e) => handleEditFormChange("city", e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">State</Label>
                    <Input
                      value={editForm.state}
                      onChange={(e) => handleEditFormChange("state", e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Pincode</Label>
                    <Input
                      value={editForm.pincode}
                      onChange={(e) => handleEditFormChange("pincode", e.target.value)}
                      placeholder="Pincode"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Country</Label>
                    <Input
                      value={editForm.country}
                      onChange={(e) => handleEditFormChange("country", e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Location Area</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => handleEditFormChange("location", e.target.value)}
                      placeholder="Location area"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 3. ACADEMIC TAB */}
              <TabsContent value="academic" className="space-y-4 focus:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Course <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.course}
                      onValueChange={(val) => handleEditFormChange("course", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs_executive">CS Executive</SelectItem>
                        <SelectItem value="cs_professional">CS Professional</SelectItem>
                        <SelectItem value="cseet">CSEET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Group Module</Label>
                    <Select
                      value={editForm.group_module}
                      onValueChange={(val) => handleEditFormChange("group_module", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Module" />
                      </SelectTrigger>
                      <SelectContent>
                        {editForm.course === "cseet" ? (
                          <SelectItem value="full">Full Syllabus</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="module_1">Module 1</SelectItem>
                            <SelectItem value="module_2">Module 2</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Batch Attempt</Label>
                    <Select
                      value={editForm.batch_attempt}
                      onValueChange={(val) => handleEditFormChange("batch_attempt", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Attempt" />
                      </SelectTrigger>
                      <SelectContent>
                        {editForm.course === "cseet" ? (
                          <>
                            <SelectItem value="june">June</SelectItem>
                            <SelectItem value="oct">October</SelectItem>
                            <SelectItem value="feb">February</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="june">June</SelectItem>
                            <SelectItem value="dec">December</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Current Qualification</Label>
                    <Select
                      value={editForm.qualification}
                      onValueChange={(val) => handleEditFormChange("qualification", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appearing_12">Appearing 12th</SelectItem>
                        <SelectItem value="pass_12">Passed 12th</SelectItem>
                        <SelectItem value="cseet_pass">CSEET Pass</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="post_graduate">Post Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-text-primary">Reference</Label>
                    <Select
                      value={editForm.reference}
                      onValueChange={(val) => handleEditFormChange("reference", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How did you hear about us?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="existing">Existing Student</SelectItem>
                        <SelectItem value="offline_ad">Offline Ad</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-text-primary">Administrative Notes</Label>
                    <Textarea
                      value={editForm.note}
                      onChange={(e) => handleEditFormChange("note", e.target.value)}
                      placeholder="Add administration notes, comments, or guidelines here..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 4. PAST EDUCATION TAB */}
              <TabsContent value="education" className="space-y-6 focus:outline-none">
                {/* 10th Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold border-b border-border pb-1 text-primary">10th Standard Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Board/Medium</Label>
                      <Select
                        value={editForm.tenth_medium}
                        onValueChange={(val) => handleEditFormChange("tenth_medium", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gseb">GSEB</SelectItem>
                          <SelectItem value="cbse">CBSE</SelectItem>
                          <SelectItem value="icse">ICSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">School Name</Label>
                      <Input
                        value={editForm.tenth_school}
                        onChange={(e) => handleEditFormChange("tenth_school", e.target.value)}
                        placeholder="School name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Coaching Institute</Label>
                      <Input
                        value={editForm.tenth_coaching}
                        onChange={(e) => handleEditFormChange("tenth_coaching", e.target.value)}
                        placeholder="Coaching name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Percentage (%)</Label>
                      <Input
                        type="number" min="0"
                        step="0.01"
                        value={editForm.tenth_percentage}
                        onChange={(e) => handleEditFormChange("tenth_percentage", e.target.value)}
                        placeholder="e.g. 86.16"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Percentile</Label>
                      <Input
                        type="number" min="0"
                        step="0.01"
                        value={editForm.tenth_percentile}
                        onChange={(e) => handleEditFormChange("tenth_percentile", e.target.value)}
                        placeholder="e.g. 95.42"
                      />
                    </div>
                  </div>
                </div>

                {/* 12th Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold border-b border-border pb-1 text-primary">12th Standard Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Board/Medium</Label>
                      <Select
                        value={editForm.twelfth_medium}
                        onValueChange={(val) => handleEditFormChange("twelfth_medium", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gseb">GSEB</SelectItem>
                          <SelectItem value="cbse">CBSE</SelectItem>
                          <SelectItem value="icse">ICSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">School Name</Label>
                      <Input
                        value={editForm.twelfth_school}
                        onChange={(e) => handleEditFormChange("twelfth_school", e.target.value)}
                        placeholder="School name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Coaching Institute</Label>
                      <Input
                        value={editForm.twelfth_coaching}
                        onChange={(e) => handleEditFormChange("twelfth_coaching", e.target.value)}
                        placeholder="Coaching name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Percentage (%)</Label>
                      <Input
                        type="number" min="0"
                        step="0.01"
                        value={editForm.twelfth_percentage}
                        onChange={(e) => handleEditFormChange("twelfth_percentage", e.target.value)}
                        placeholder="e.g. 80.16"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Percentile</Label>
                      <Input
                        type="number" min="0"
                        step="0.01"
                        value={editForm.twelfth_percentile}
                        onChange={(e) => handleEditFormChange("twelfth_percentile", e.target.value)}
                        placeholder="e.g. 95.42"
                      />
                    </div>
                  </div>
                </div>

                {/* Graduation Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold border-b border-border pb-1 text-primary">Graduation Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">University</Label>
                      <Input
                        value={editForm.grad_university}
                        onChange={(e) => handleEditFormChange("grad_university", e.target.value)}
                        placeholder="University name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">College</Label>
                      <Input
                        value={editForm.grad_college}
                        onChange={(e) => handleEditFormChange("grad_college", e.target.value)}
                        placeholder="College name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-text-primary">Last Semester</Label>
                      <Input
                        value={editForm.grad_last_sem}
                        onChange={(e) => handleEditFormChange("grad_last_sem", e.target.value)}
                        placeholder="e.g. Sem 6"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 5. DOCUMENTS TAB */}
              <TabsContent value="documents" className="space-y-4 focus:outline-none">
                <p className="text-xs text-muted-foreground mb-2">
                  Upload or replace student admission documents. Changes will be saved when you submit the form.
                </p>
                <div className="space-y-3">
                  {documentFields.map((field) => {
                    const isSelected = !!selectedFiles[field.key];
                    const hasExisting = admission && !!admission[field.key];
                    const existingUrl = admission ? admission[field.key] : null;

                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-card hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{field.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isSelected ? (
                                <span className="text-amber-600 font-medium">
                                  New file selected: {selectedFiles[field.key]?.name}
                                </span>
                              ) : hasExisting ? (
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                  Existing document uploaded
                                  {typeof existingUrl === "string" && (
                                    <a
                                      href={existingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-primary hover:underline ml-2 gap-0.5"
                                    >
                                      View <Eye className="w-3 h-3" />
                                    </a>
                                  )}
                                </span>
                              ) : (
                                null
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSelectedFile(field.key)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => triggerFileInput(field.key)}
                            className="flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {hasExisting || isSelected ? "Replace" : "Upload"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="p-6 pt-4 border-t border-border bg-muted/10 gap-2 flex items-center justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatingDetails} className="bg-primary hover:bg-primary/95 text-white flex items-center gap-2">
              {updatingDetails ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Hidden File Input for document upload within dialog */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />
    </Dialog>
  );
}
