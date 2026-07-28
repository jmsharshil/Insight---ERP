import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Phone, Mail, MapPin, UserCheck, RefreshCw, ArrowRightLeft } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { APILead, LeadStatus } from "@/types/crm";
import { STAGE_COLORS, LEAD_STATUS_META } from "@/constants/dummy/crm";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AssignLeadDialog from "./AssignLeadDialog";
import TransferRequestDialog from "./TransferRequestDialog";
import { useAuth } from "@/hooks/useAuth";

const COURSE_LABELS: Record<string, string> = {
  cs_executive: "CS Executive",
  cs_professional: "CS Professional",
  cseet: "CSEET",
};

interface KanbanBoardProps {
  leads: APILead[];
  leadsLoading: boolean;
  stages: LeadStatus[];
  
  onDragEnd: (result: DropResult) => void;
  onView: (lead: APILead) => void;
  onAssignSuccess?: (lead: APILead, assignedToName: string) => void;
}

function KanbanCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 mb-2 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width={40} height={12} />
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <Skeleton width={60} height={16} className="rounded" />
        <Skeleton width={50} height={16} className="rounded" />
      </div>
      <div className="space-y-1.5 mb-3">
        <Skeleton width="40%" height={12} />
        <Skeleton width="70%" height={12} />
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <Skeleton width={70} height={10} />
        <Skeleton width={60} height={10} />
      </div>
    </div>
  );
}

function KanbanColumnSkeleton({ meta, colors }: any) {
  return (
    <div className="flex-shrink-0 w-[280px]">
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0 border-border",
          colors.header,
        )}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          <span className="font-heading font-semibold text-sm">{meta.label}</span>
        </div>
        <Skeleton width={20} height={16} className="rounded-full" />
      </div>
      <div className="rounded-b-xl border border-border p-2 min-h-[240px] bg-muted/30">
        <KanbanCardSkeleton />
        <KanbanCardSkeleton />
        <KanbanCardSkeleton />
      </div>
    </div>
  );
}

export default function KanbanBoard({ leads, leadsLoading, stages, onDragEnd, onView, onAssignSuccess }: KanbanBoardProps) {
  const [assignLead, setAssignLead] = useState<APILead | null>(null);
  const [transferLead, setTransferLead] = useState<APILead | null>(null);
  const { user } = useAuth();
  const canReassign = ["sales_senior_executive", "branch_manager", "super_admin"].includes(user?.role || "");

  if (leadsLoading && leads.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 mt-3 -mx-1 px-1">
        {stages.map((stage) => {
          const meta = LEAD_STATUS_META[stage];
          const colors = STAGE_COLORS[stage] || STAGE_COLORS.new;
          return <KanbanColumnSkeleton key={stage} meta={meta} colors={colors} />;
        })}
      </div>
    );
  }

  return (
    <>
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 mt-3 -mx-1 px-1">
        {stages.map((stage, stageIdx) => {
          const stageLeads = leads.filter((l) => l.current_stage === stage);
          const meta = LEAD_STATUS_META[stage];
          const colors = STAGE_COLORS[stage] || STAGE_COLORS.new;

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIdx * 0.05 }}
              className="flex-shrink-0 w-[280px]"
            >
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0 border-border",
                  colors.header,
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span className="font-heading font-semibold text-sm">{meta?.label || stage}</span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: colors.accent + "18",
                    color: colors.accent,
                  }}
                >
                  {stageLeads.length}
                </span>
              </div>

              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "rounded-b-xl border border-border p-2 min-h-[240px] max-h-[calc(100vh-380px)] overflow-y-auto transition-colors duration-200 scrollbar-hidden",
                      snapshot.isDraggingOver
                        ? "bg-primary/5 ring-2 ring-primary/20"
                        : "bg-muted/30",
                    )}
                  >
                    <AnimatePresence>
                      {stageLeads.map((lead, index) => (
                        <Draggable
                          key={String(lead.id)}
                          draggableId={String(lead.id)}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={cn(
                                "rounded-lg border bg-card p-3 mb-2 shadow-sm transition-all duration-150 group cursor-grab active:cursor-grabbing",
                                dragSnapshot.isDragging
                                  ? "shadow-lg ring-2 ring-primary/30 rotate-[1deg] scale-[1.02]"
                                  : "hover:shadow-md hover:-translate-y-0.5",
                              )}
                              style={{
                                ...dragProvided.draggableProps.style,
                              }}
                              onClick={() => onView(lead)}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {lead.first_name} {lead.surname}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                                  #{lead.id}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mb-2">
                                <span
                                  className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: colors.accent + "12",
                                    color: colors.accent,
                                  }}
                                >
                                  {COURSE_LABELS[lead.course] || lead.course}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                                  {lead.form_type_display}
                                </span>
                              </div>

                              <div className="space-y-1">
                                {lead.phone_student && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    <span>{lead.phone_student}</span>
                                  </div>
                                )}
                                {lead.email && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(lead.created_at)}
                                </span>
                                {lead.location && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[80px]">
                                      {lead.location}
                                    </span>
                                  </div>
                                )}
                              </div>
                                <div className="flex items-center justify-between mt-2 gap-2">
                                  {lead.assigned_to_name ? (
                                    <div className="flex items-center justify-between w-full">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        <UserCheck className="w-2.5 h-2.5 flex-shrink-0" />
                                        <span className="truncate max-w-[120px]">{lead.assigned_to_name}</span>
                                      </span>
                                      <div className="flex gap-1">
                                        {canReassign && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            onClick={(e) => { e.stopPropagation(); setAssignLead(lead); }}
                                            title="Reassign"
                                          >
                                            <RefreshCw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                          </Button>
                                        )}
                                        {user?.role === "tele_caller" && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            onClick={(e) => { e.stopPropagation(); setTransferLead(lead); }}
                                            title="Request Transfer to Counsellor"
                                          >
                                            <ArrowRightLeft className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between w-full">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-5 text-[10px] px-1.5 py-0 gap-1 bg-background"
                                        onClick={(e) => { e.stopPropagation(); setAssignLead(lead); }}
                                      >
                                        <UserCheck className="w-2.5 h-2.5" />
                                        Assign
                                      </Button>
                                      {user?.role === "tele_caller" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={(e) => { e.stopPropagation(); setTransferLead(lead); }}
                                          title="Request Transfer to Counsellor"
                                        >
                                          <ArrowRightLeft className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>

                    {provided.placeholder}

                    {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-10 text-xs text-muted-foreground">
                        No leads
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </motion.div>
          );
        })}
      </div>
    </DragDropContext>

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

      {/* Transfer Request Dialog */}
      <TransferRequestDialog
        lead={transferLead}
        open={!!transferLead}
        onOpenChange={(open) => {
          if (!open) setTransferLead(null);
        }}
        onSuccess={() => {
          setTransferLead(null);
        }}
      />
    </>
  );
}
