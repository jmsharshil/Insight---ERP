import { useState } from "react";
import { ChevronRight, MoreHorizontal, UserCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { LEAD_STATUS_META, COURSE_LABELS, type LeadStatus } from "@/constants/dummy/crm";
import { APILead } from "@/types/crm";
import { formatDate, cn } from "@/lib/utils";
import AssignLeadDialog from "./AssignLeadDialog";
import { useAuth } from "@/hooks/useAuth";

interface LeadsTableProps {
  leads: APILead[];
  onView: (l: APILead) => void;
  onChangeStage?: (l: APILead, stage: LeadStatus) => void;
  onAssignSuccess?: (lead: APILead, assignedToName: string) => void;
}

export default function LeadsTable({ leads, onView, onChangeStage, onAssignSuccess }: LeadsTableProps) {
  const STAGES = Object.keys(LEAD_STATUS_META) as LeadStatus[];
  const { user } = useAuth();
  const canReassign = ["sales_senior_executive", "branch_manager", "super_admin"].includes(user?.role || "");

  const [assignLead, setAssignLead] = useState<APILead | null>(null);

  const cols: DataTableColumn<APILead>[] = [
    {
      key: "id",
      header: "ID",
      className: "font-mono text-xs",
      render: (r) => `#${r.id}`,
    },
    {
      key: "first_name",
      header: "Name",
      render: (r) => (
        <span className="font-medium">
          {r.first_name} {r.surname}
        </span>
      ),
    },
    {
      key: "course",
      header: "Course",
      render: (r) => COURSE_LABELS[r.course] || r.course,
    },
    {
      key: "form_type_display",
      header: "Type",
      render: (r) => (
        <span className="text-xs bg-muted px-2 py-0.5 rounded">{r.form_type_display}</span>
      ),
    },
    {
      key: "current_stage",
      header: "Stage",
      render: (r) => {
        const meta = LEAD_STATUS_META[r.current_stage as LeadStatus];
        if (!meta) return r.current_stage;
        return (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              meta.bg,
              meta.color,
            )}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "phone_student",
      header: "Phone",
    },
    {
      key: "created_at",
      header: "Date",
      render: (r) => formatDate(r.created_at),
    },
    /* ── Assigned To ──────────────────────────────────────────── */
    {
      key: "assigned_to_name" as keyof APILead,
      header: "Assigned To",
      render: (r) => {
        if (r.assigned_to_name) {
          /* Already assigned — show the name */
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <UserCheck className="w-3 h-3 flex-shrink-0" />
                {r.assigned_to_name}
              </span>
              {canReassign && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); setAssignLead(r); }}
                  title="Reassign"
                >
                  <RefreshCw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
          );
        }
        /* Unassigned — show the Assign action button inline */
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs px-2.5"
            onClick={(e) => { e.stopPropagation(); setAssignLead(r); }}
          >
            <UserCheck className="w-3 h-3" />
            Assign
          </Button>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onView(r)} className="gap-1 h-8">
            View <ChevronRight className="w-3.5 h-3.5" />
          </Button>


          {onChangeStage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STAGES.map((s) => {
                  const meta = LEAD_STATUS_META[s];
                  if (s === r.current_stage) return null;
                  return (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onChangeStage(r, s)}
                      className="text-xs cursor-pointer"
                    >
                      {meta?.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mt-3">
        <DataTable columns={cols} data={leads} exportable onRowClick={onView} />
      </div>

      {/* Assign Lead Dialog */}
      <AssignLeadDialog
        lead={assignLead}
        open={!!assignLead}
        onOpenChange={(open) => {
          if (!open) setAssignLead(null);
        }}
        onSuccess={(lead, assignedToName) => {
          setAssignLead(null);
          if (onAssignSuccess) onAssignSuccess(lead, assignedToName);
        }}
      />
    </>
  );
}
