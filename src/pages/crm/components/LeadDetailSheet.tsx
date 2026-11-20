import { Phone, Mail, MapPin, Users, FileText, Pencil, ChevronDown, Headphones, UserCheck, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { LEAD_STATUS_META, STAGE_COLORS, type LeadStatus } from "@/constants/dummy/crm";
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
  onChangeStage?: (lead: APILead, stage: LeadStatus) => void;
}

export default function LeadDetailSheet({ lead, isLoading, onClose, onEditClick, onChangeStage }: LeadDetailSheetProps) {
  if (!lead) return null;

  const meta = LEAD_STATUS_META[lead.current_stage as LeadStatus];
  const colors = STAGE_COLORS[lead.current_stage] || STAGE_COLORS.new;

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="font-heading text-xl">
              {lead.first_name} {lead.surname}
            </DialogTitle>
            <div className="flex flex-col items-end gap-2 pr-6">
              <div className="flex items-center gap-2">
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
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            #{lead.id} · {lead.form_type_display} · Created {formatDate(lead.created_at)}
          </p>
        </DialogHeader>

        {isLoading ? (
          <SheetSkeleton />
        ) : (
          <div className="mt-5 space-y-5 pb-10">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2.5 text-sm">
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
                  <div className="flex items-center gap-2.5">
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
            </div>

            {/* Assigned Staff: Telecaller & Counsellor */}
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Assigned Staff</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Assigned Telecaller */}
                <div className="rounded-lg border border-border/80 p-3.5 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Assigned Telecaller</span>
                    </span>
                    {lead.assigned_telecaller ? (
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                        Assigned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">
                        Unassigned
                      </Badge>
                    )}
                  </div>

                  {lead.assigned_telecaller ? (
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-foreground">
                        {typeof lead.assigned_telecaller === "object" && lead.assigned_telecaller !== null
                          ? lead.assigned_telecaller.name
                          : String(lead.assigned_telecaller)}
                      </p>
                      {typeof lead.assigned_telecaller === "object" && lead.assigned_telecaller !== null && (
                        <div className="space-y-1 text-xs text-muted-foreground pt-0.5">
                          {lead.assigned_telecaller.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <a
                                href={`tel:${lead.assigned_telecaller.phone}`}
                                className="hover:text-primary transition-colors font-medium"
                              >
                                {lead.assigned_telecaller.phone}
                              </a>
                            </div>
                          )}
                          {lead.assigned_telecaller.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <a
                                href={`mailto:${lead.assigned_telecaller.email}`}
                                className="hover:text-primary transition-colors truncate"
                              >
                                {lead.assigned_telecaller.email}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No telecaller assigned</p>
                  )}
                </div>

                {/* Assigned Counsellor */}
                <div className="rounded-lg border border-border/80 p-3.5 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Assigned Counsellor</span>
                    </span>
                    {lead.assigned_counsellor ? (
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-semibold">
                        Assigned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">
                        Unassigned
                      </Badge>
                    )}
                  </div>

                  {lead.assigned_counsellor ? (
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-foreground">
                        {typeof lead.assigned_counsellor === "object" && lead.assigned_counsellor !== null
                          ? lead.assigned_counsellor.name
                          : String(lead.assigned_counsellor)}
                      </p>
                      {typeof lead.assigned_counsellor === "object" && lead.assigned_counsellor !== null && (
                        <div className="space-y-1 text-xs text-muted-foreground pt-0.5">
                          {lead.assigned_counsellor.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <a
                                href={`tel:${lead.assigned_counsellor.phone}`}
                                className="hover:text-primary transition-colors font-medium"
                              >
                                {lead.assigned_counsellor.phone}
                              </a>
                            </div>
                          )}
                          {lead.assigned_counsellor.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <a
                                href={`mailto:${lead.assigned_counsellor.email}`}
                                className="hover:text-primary transition-colors truncate"
                              >
                                {lead.assigned_counsellor.email}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No counsellor assigned</p>
                  )}
                </div>
              </div>

              {/* Assignment History if present */}
              {Array.isArray(lead.assignment_history) && lead.assignment_history.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="w-3 h-3 text-muted-foreground" />
                    <span>Recent Assignment History</span>
                  </p>
                  <div className="rounded-lg border border-border divide-y divide-border/60 bg-white text-xs max-h-36 overflow-y-auto">
                    {lead.assignment_history.map((hist: any) => (
                      <div key={hist.id} className="p-2.5 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {hist.assigned_to_name || hist.assigned_to?.name || "Assigned"}
                            </span>
                            {hist.status && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/30 capitalize">
                                {hist.status}
                              </Badge>
                            )}
                          </div>
                          {hist.note && (
                            <p className="text-muted-foreground text-[11px] mt-0.5">{hist.note}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {formatDate(hist.created_at || hist.changed_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <p className="font-semibold">{lead.course}</p>
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
                  <div className="rounded-lg border border-border divide-y divide-border/50 text-sm h-full max-h-56 overflow-y-auto">
                    {lead.qualification && (
                      <div className="p-3 bg-muted/20">
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
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          {lead.tenth_board && <span>Board: {lead.tenth_board.toUpperCase()}</span>}
                          {lead.tenth_medium && (
                            <span>Medium: {lead.tenth_medium === "other" ? "Other" : `${lead.tenth_medium.charAt(0).toUpperCase() + lead.tenth_medium.slice(1)} Medium`}</span>
                          )}
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
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          {lead.twelfth_board && (
                            <span>Board: {lead.twelfth_board.toUpperCase()}</span>
                          )}
                          {lead.twelfth_medium && (
                            <span>Medium: {lead.twelfth_medium === "other" ? "Other" : `${lead.twelfth_medium.charAt(0).toUpperCase() + lead.twelfth_medium.slice(1)} Medium`}</span>
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
            </div>
            {/* Status Change Action Buttons */}
            <div className="pt-4 border-t mt-4">
              <Label className="text-xs mb-3 block text-muted-foreground">Update Status</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LEAD_STATUS_META).map(([stage, smeta]) => (
                  <Button
                    key={stage}
                    variant={lead.current_stage === stage ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs h-8",
                      lead.current_stage === stage ? cn(smeta.bg, smeta.color, "border-transparent hover:opacity-90") : ""
                    )}
                    onClick={() => onChangeStage && onChangeStage(lead, stage as LeadStatus)}
                  >
                    <span className={cn("w-2 h-2 rounded-full mr-2", lead.current_stage === stage ? "bg-current opacity-70" : smeta.bg)} />
                    {smeta.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
