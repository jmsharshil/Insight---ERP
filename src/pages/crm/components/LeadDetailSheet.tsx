import { Phone, Mail, MapPin, Users, FileText, Pencil } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { LEAD_STATUS_META, STAGE_COLORS, COURSE_LABELS, type LeadStatus } from "@/constants/dummy/crm";
import { type APILead } from "@/types/crm";
import { formatDate, cn } from "@/lib/utils";

function SheetSkeleton() {
  return (
    <div className="mt-5 space-y-5 pb-10">
      <div className="space-y-3">
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={40} className="rounded-lg" />
      </div>
      <div>
        <Skeleton width={100} height={16} className="mb-2" />
        <Skeleton height={80} className="rounded-lg" />
      </div>
      <div>
        <Skeleton width={120} height={16} className="mb-2" />
        <Skeleton height={120} className="rounded-lg" />
      </div>
    </div>
  );
}

interface LeadDetailSheetProps {
  lead: APILead | null;
  isLoading: boolean;
  onClose: () => void;
  onEditClick: () => void;
}

export default function LeadDetailSheet({ lead, isLoading, onClose, onEditClick }: LeadDetailSheetProps) {
  if (!lead) return null;

  const meta = LEAD_STATUS_META[lead.current_stage as LeadStatus];
  const colors = STAGE_COLORS[lead.current_stage] || STAGE_COLORS.new;

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-[480px] w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <SheetTitle className="font-heading text-xl">
              {lead.first_name} {lead.surname}
            </SheetTitle>
            <div className="flex flex-col items-end gap-2">
              {meta && (
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    meta.bg,
                    meta.color,
                  )}
                >
                  {meta.label}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={onEditClick} className="h-7 text-xs">
                <Pencil className="w-3 h-3 mr-1.5" /> Edit
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            #{lead.id} · {lead.form_type_display} · Created {formatDate(lead.created_at)}
          </p>
        </SheetHeader>

        {isLoading ? (
          <SheetSkeleton />
        ) : (
          <div className="mt-5 space-y-5 pb-10">
            {/* Contact Info */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.accent + "15" }}
                >
                  <Phone className="w-4 h-4" style={{ color: colors.accent }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{lead.phone_student}</p>
                </div>
              </div>

              {lead.email && (
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.accent + "15" }}
                  >
                    <Mail className="w-4 h-4" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
              )}

              {lead.location && (
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.accent + "15" }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{lead.location}</p>
                  </div>
                </div>
              )}

              {lead.father_name && (
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Father's Name</p>
                    <p className="font-medium">
                      {lead.father_name} {lead.phone_father ? `(${lead.phone_father})` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Address if exists */}
            {(lead.street || lead.city || lead.state) && (
              <div>
                <Label className="text-xs mb-2 block">Address</Label>
                <div className="rounded-lg border border-border p-3 text-sm bg-muted/20">
                  {lead.apartment && <p>{lead.apartment}</p>}
                  {lead.street && <p>{lead.street}</p>}
                  <p>{[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}</p>
                </div>
              </div>
            )}

            {/* Course & Form type */}
            <div>
              <Label className="text-xs mb-2 block">Inquiry Details</Label>
              <div className="rounded-lg bg-muted/40 p-4 text-sm grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Course</p>
                  <p className="font-semibold">{COURSE_LABELS[lead.course] || lead.course}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Form Type</p>
                  <p className="font-medium">{lead.form_type_display}</p>
                </div>
                {lead.group_module && (
                  <div>
                    <p className="text-xs text-muted-foreground">Module</p>
                    <p className="font-medium capitalize">{lead.group_module.replace("_", " ")}</p>
                  </div>
                )}
                {lead.batch_attempt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Attempt</p>
                    <p className="font-medium capitalize">{lead.batch_attempt}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Branch Name</p>
                  <p className="font-mono text-[11px] truncate">{lead.branch_name}</p>
                </div>
              </div>
            </div>

            {/* Status & Schedule */}
            {(lead.note || lead.followup_date || lead.visit_date || lead.reference_display) && (
              <div>
                <Label className="text-xs mb-2 block">Status & Schedule</Label>
                <div className="rounded-lg border border-border p-3 text-sm bg-muted/20 space-y-3">
                  {lead.note && (
                    <div>
                      <p className="text-xs text-muted-foreground">Latest Note</p>
                      <p className="font-medium whitespace-pre-wrap">{lead.note}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {lead.followup_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Follow-up</p>
                        <p className="font-medium text-sm">{new Date(lead.followup_date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    )}
                    {lead.visit_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Visit</p>
                        <p className="font-medium text-sm">{new Date(lead.visit_date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    )}
                  </div>
                  {lead.reference_display && (
                    <div>
                      <p className="text-xs text-muted-foreground">Reference</p>
                      <p className="font-medium">{lead.reference_display}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic Info */}
            {(lead.qualification ||
              lead.tenth_school ||
              lead.twelfth_school ||
              lead.grad_college) && (
              <div>
                <Label className="text-xs mb-2 block">Academic History</Label>
                <div className="rounded-lg border border-border divide-y divide-border/50 text-sm">
                  {lead.qualification && (
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground">Current Qualification</p>
                      <p className="font-medium capitalize">
                        {lead.qualification.replace("_", " ")}
                      </p>
                    </div>
                  )}
                  {lead.tenth_school && (
                    <div className="p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        10th Grade
                      </p>
                      <p className="font-medium">{lead.tenth_school}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        {lead.tenth_medium && <span>Board: {lead.tenth_medium.toUpperCase()}</span>}
                        {lead.tenth_percentage && <span>{lead.tenth_percentage}%</span>}
                      </div>
                    </div>
                  )}
                  {lead.twelfth_school && (
                    <div className="p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        12th Grade
                      </p>
                      <p className="font-medium">{lead.twelfth_school}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        {lead.twelfth_medium && (
                          <span>Board: {lead.twelfth_medium.toUpperCase()}</span>
                        )}
                        {lead.twelfth_percentage && <span>{lead.twelfth_percentage}%</span>}
                      </div>
                    </div>
                  )}
                  {lead.grad_college && (
                    <div className="p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Graduation
                      </p>
                      <p className="font-medium">{lead.grad_college}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lead.grad_university}</p>
                      {lead.grad_last_sem && <p className="text-xs text-muted-foreground mt-1">Last Semester: {lead.grad_last_sem}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Note */}
            {lead.note && (
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Note</span>
                </div>
                <p className="text-sm">{lead.note}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
