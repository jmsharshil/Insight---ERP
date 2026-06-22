import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { facultyAction } from "@/redux/actions";
import {
  setFaculty,
  setSelectedFaculty,
  setSelectedFacultyLoading,
  updateFacultyInList,
} from "@/redux/slices/facultySlice";
import { RootState, AppDispatch } from "@/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Save, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const FACULTY_LEVELS = [
  { value: "executive", label: "Executive" },
  { value: "professional", label: "Professional" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  // { value: "contract", label: "Contract" },
];

interface FacultyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facultyId: string | null;
}

export default function FacultyDetailSheet({
  open,
  onOpenChange,
  facultyId,
}: FacultyDetailSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const { selectedFaculty, selectedFacultyLoading } = useSelector(
    (state: RootState) => state.faculty,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    // specialization: "",
    // subject_expertise: "",
    level: "",
    employment_type: "",
    salary: 0,
    hourly_rate: 0,
    session_hours: 0,
    bank_account: "",
    ifsc_code: "",
    pan_number: "",
    is_active: true,
    branch_id: "",
  });

  // Fetch faculty details when sheet opens with a facultyId
  useEffect(() => {
    if (open && facultyId) {
      dispatch(setSelectedFacultyLoading(true));
      dispatch({
        type: facultyAction.GET_FACULTY_DETAILS,
        method: "GET",
        endPoint: `/api/v1/faculty/${facultyId}/`,
        auth: true,
        setLoading: (val: boolean) => dispatch(setSelectedFacultyLoading(val)),
        getResponse: (res: any) => {
          const data = res?.data || res;
          if (data?.id) {
            dispatch(setSelectedFaculty(data));
          }
        },
        getError: (err: any) => {
          toast.error("Failed to load faculty details");
        },
      } as any);
    }
    if (!open) {
      setIsEditing(false);
      dispatch(setSelectedFaculty(null));
    }
  }, [open, facultyId]);

  // Sync edit form with selectedFaculty
  useEffect(() => {
    if (selectedFaculty) {
      setEditForm({
        full_name: selectedFaculty.full_name || "",
        email: selectedFaculty.email || "",
        phone: selectedFaculty.phone || "",
        qualification: selectedFaculty.qualification || "",
        // specialization: selectedFaculty.specialization || "",
        // subject_expertise: selectedFaculty.subject_expertise || "",
        level: selectedFaculty.level || "",
        employment_type: selectedFaculty.employment_type || "",
        salary: selectedFaculty.salary ? parseFloat(selectedFaculty.salary.toString()) : 0,
        hourly_rate: selectedFaculty.hourly_rate
          ? parseFloat(selectedFaculty.hourly_rate.toString())
          : 0,
        session_hours: selectedFaculty.session_hours
          ? parseFloat(selectedFaculty.session_hours.toString())
          : 0,
        bank_account: selectedFaculty.bank_account || "",
        ifsc_code: selectedFaculty.ifsc_code || "",
        pan_number: selectedFaculty.pan_number || "",
        is_active: selectedFaculty.is_active ?? true,
        branch_id: selectedFaculty.branch || "",
      });
    }
  }, [selectedFaculty]);

  const handleUpdate = () => {
    if (!selectedFaculty) return;
    setUpdateLoading(true);
    dispatch({
      type: facultyAction.UPDATE_FACULTY,
      method: "PATCH",
      endPoint: `/api/v1/faculty/${selectedFaculty.id}/`,
      body: editForm,
      auth: true,
      setLoading: (val: boolean) => setUpdateLoading(val),
      getResponse: (res: any) => {
        const data = res?.data || res;
        toast.success("Faculty updated successfully");
        dispatch(setSelectedFaculty(data));
        dispatch(updateFacultyInList(data));
        setIsEditing(false);
        // Refresh faculty list
        dispatch({
          type: facultyAction.GET_FACULTY,
          method: "GET",
          endPoint: "/api/v1/faculty/",
          auth: true,
          setLoading: () => {},
          getResponse: (listRes: any) => {
            if (listRes.data) dispatch(setFaculty(listRes.data));
          },
          getError: () => {},
        } as any);
      },
      getError: (err: any) => {
        toast.error("Failed to update faculty");
      },
    } as any);
  };

  // Detail row helper
  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between mt-2">
          <SheetTitle>
            {selectedFacultyLoading
              ? "Loading..."
              : isEditing
                ? "Edit Faculty"
                : selectedFaculty?.full_name || "Faculty Details"}
          </SheetTitle>
          {selectedFaculty && !isEditing && !selectedFacultyLoading && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
        </SheetHeader>

        {selectedFacultyLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading faculty details...</p>
          </div>
        ) : selectedFaculty ? (
          <div className="mt-6">
            {isEditing ? (
              /* ── Edit Mode ── */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input
                      value={editForm.full_name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={editForm.is_active}
                        onCheckedChange={(c) =>
                          setEditForm((f) => ({ ...f, is_active: c }))
                        }
                      />
                      <Label>{editForm.is_active ? "Active" : "Inactive"}</Label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Level</Label>
                    <Select
                      value={editForm.level}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, level: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {FACULTY_LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Employment Type</Label>
                    <Select
                      value={editForm.employment_type}
                      onValueChange={(v) =>
                        setEditForm((f) => ({ ...f, employment_type: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.employment_type === "full_time" && (
                    <div className="space-y-1 col-span-2">
                      <Label>Salary</Label>
                      <Input
                        type="number"
                        value={editForm.salary}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            salary: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  )}
                  {editForm.employment_type === "part_time" && (
                    <>
                      <div className="space-y-1">
                        <Label>Hourly Rate</Label>
                        <Input
                          type="number"
                          value={editForm.hourly_rate}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              hourly_rate: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Session Hours</Label>
                        <Input
                          type="number"
                          value={editForm.session_hours}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              session_hours: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1 col-span-2">
                    <Label>Qualification</Label>
                    <Input
                      value={editForm.qualification}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, qualification: e.target.value }))
                      }
                    />
                  </div>
                  {/* <div className="space-y-1 col-span-2">
                    <Label>Specialization</Label>
                    <Input
                      value={editForm.specialization}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, specialization: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Subject Expertise</Label>
                    <Input
                      value={editForm.subject_expertise}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, subject_expertise: e.target.value }))
                      }
                    />
                  </div> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="space-y-1">
                    <Label>Bank Account</Label>
                    <Input
                      value={editForm.bank_account}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, bank_account: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>IFSC Code</Label>
                    <Input
                      value={editForm.ifsc_code}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, ifsc_code: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>PAN Number</Label>
                    <Input
                      value={editForm.pan_number}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, pan_number: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={updateLoading}>
                    {updateLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              /* ── View Mode ── */
              <div className="space-y-5">
                {/* Header with avatar */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-4">
                    {selectedFaculty.photo_url ? (
                      <img
                        src={selectedFaculty.photo_url}
                        alt={selectedFaculty.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                        {selectedFaculty.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                    <div>
                      <div className="text-base font-semibold">{selectedFaculty.full_name}</div>
                      <div className="text-xs text-muted-foreground">{selectedFaculty.employee_id}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge
                          className={
                            selectedFaculty.is_active
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }
                        >
                          {selectedFaculty.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {selectedFaculty.employment_type_display}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Scan Card */}
                {(selectedFaculty.qr_code_url || selectedFaculty.qr_code) && (
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/25 p-5 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-border shadow-md">
                      <img
                        src={selectedFaculty.qr_code_url || selectedFaculty.qr_code}
                        alt="QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">Digital QR Identity Card</h4>
                      <p className="text-xs text-muted-foreground max-w-[280px]">
                        Scan this QR code with the attendance reader terminal or mobile app to log sessions.
                      </p>
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                    Personal Information
                  </h4>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <DetailRow label="Email" value={selectedFaculty.email} />
                    <DetailRow label="Phone" value={selectedFaculty.phone} />
                    <DetailRow label="Joining Date" value={selectedFaculty.joining_date} />
                    <DetailRow label="Created At" value={selectedFaculty.created_at} />
                  </div>
                </div>

                {/* Professional Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                    Professional Details
                  </h4>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <DetailRow label="Level" value={selectedFaculty.level_display} />
                    <DetailRow label="Employment Type" value={selectedFaculty.employment_type_display} />
                    <DetailRow label="Qualification" value={selectedFaculty.qualification} />
                    {/* <DetailRow label="Specialization" value={selectedFaculty.specialization} /> */}
                    <div className="flex justify-between items-start py-2.5 border-b border-border/50 last:border-0 gap-4">
                      <span className="text-muted-foreground text-sm whitespace-nowrap mt-0.5">Subject Expertise</span>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {selectedFaculty.subject_name ? (
                          selectedFaculty.subject_name.split(",").map((subject: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="font-medium text-xs">
                              {subject.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm font-medium">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                    Financial Details
                  </h4>
                  <div className="rounded-lg border border-border bg-card p-3">
                    {selectedFaculty.employment_type === "full_time" && (
                      <DetailRow label="Salary" value={selectedFaculty.salary ? `₹${parseFloat(selectedFaculty.salary).toLocaleString()}` : "—"} />
                    )}
                    {selectedFaculty.employment_type === "part_time" && (
                      <>
                        <DetailRow label="Hourly Rate" value={selectedFaculty.hourly_rate ? `₹${parseFloat(selectedFaculty.hourly_rate).toLocaleString()}` : "—"} />
                        <DetailRow label="Session Hours" value={selectedFaculty.session_hours || "0"} />
                      </>
                    )}
                    <DetailRow label="Bank Account" value={selectedFaculty.bank_account} />
                    <DetailRow label="IFSC Code" value={selectedFaculty.ifsc_code} />
                    <DetailRow label="PAN Number" value={selectedFaculty.pan_number} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            No faculty selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
