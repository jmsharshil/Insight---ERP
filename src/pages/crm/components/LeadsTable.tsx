import { ChevronRight, MoreHorizontal } from "lucide-react";
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

interface LeadsTableProps {
  leads: APILead[];
  onView: (l: APILead) => void;
  onChangeStage?: (l: APILead, stage: LeadStatus) => void;
}

export default function LeadsTable({ leads, onView, onChangeStage }: LeadsTableProps) {
  const STAGES = Object.keys(LEAD_STATUS_META) as LeadStatus[];
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
    <div className="mt-3">
      <DataTable columns={cols} data={leads} exportable onRowClick={onView} />
    </div>
  );
}
