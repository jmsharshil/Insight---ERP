import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
  Users,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar as CalIcon,
  Clock,
  MapPin,
  FileText,
  ChevronRight,
  Loader2,
  RefreshCw,
  GripVertical,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import { AppDispatch, RootState } from "@/store";
import { crmActions, leadActions } from "@/redux/actions";
import {
  setCRMAnalytics,
  setCRMLoading,
  setCRMError,
  setLeads,
  setLeadsLoading,
  type CRMAnalytics,
  type APILead,
} from "@/redux/slices/crmSlice";
import { API } from "@/service/api";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { LEAD_STATUS_META, type LeadStatus } from "@/constants/dummy/crm";
import { formatDate, cn } from "@/lib/utils";

/* ─── Stage config ───────────────────────────────────────────── */

const STAGES: LeadStatus[] = ["new", "contacted", "interested", "follow_up", "converted", "lost"];

const STAGE_COLORS: Record<string, { header: string; accent: string; ring: string }> = {
  new: { header: "bg-blue-50", accent: "#3B82F6", ring: "ring-blue-200" },
  contacted: { header: "bg-indigo-50", accent: "#6366F1", ring: "ring-indigo-200" },
  interested: { header: "bg-amber-50", accent: "#F59E0B", ring: "ring-amber-200" },
  follow_up: { header: "bg-purple-50", accent: "#8B5CF6", ring: "ring-purple-200" },
  converted: { header: "bg-green-50", accent: "#16A34A", ring: "ring-green-200" },
  lost: { header: "bg-red-50", accent: "#EF4444", ring: "ring-red-200" },
};

const COURSE_LABELS: Record<string, string> = {
  cs_executive: "CS Executive",
  cs_professional: "CS Professional",
  cseet: "CSEET",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function CRMPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, leads, leadsLoading } = useSelector((state: RootState) => state.crm);

  const [tab, setTab] = useState("pipeline");
  const [selectedLead, setSelectedLead] = useState<APILead | null>(null);
  const [isLeadDetailLoading, setIsLeadDetailLoading] = useState(false);

  const [pendingMove, setPendingMove] = useState<{ leadId: string; stage: string } | null>(null);
  const [moveNote, setMoveNote] = useState("");

  useEffect(() => {
    setPageTitle("CRM & Pre-Admission");
  }, [setPageTitle]);

  /* ─── Fetch analytics ──────────────────────────────────────── */
  // useEffect(() => {
  //   dispatch({
  //     type: crmActions.GET_CRM_ANALYTICS,
  //     method: "GET",
  //     endPoint: API.REPORTS.LEADS,
  //     auth: true,
  //     setLoading: (val: boolean) => dispatch(setCRMLoading(val)),
  //     getResponse: (res: any) => {
  //       if (res.data) dispatch(setCRMAnalytics(res.data));
  //     },
  //     getError: (err: any) => {
  //       dispatch(setCRMError(err.message));
  //       toast.error("Failed to load CRM analytics");
  //     },
  //   });
  // }, [dispatch, toast]);

  /* ─── Fetch leads list ─────────────────────────────────────── */
  const fetchLeads = useCallback(() => {
    dispatch({
      type: leadActions.GET_LEADS,
      method: "GET",
      endPoint: API.LEADS.LIST,
      auth: true,
      setLoading: (val: boolean) => dispatch(setLeadsLoading(val)),
      getResponse: (res: any) => {
        if (res.data) dispatch(setLeads(res.data));
      },
      getError: (err: any) => {
        toast.error("Failed to load leads");
      },
    });
  }, [dispatch, toast]);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Fetch single lead details ────────────────────────────── */
  const fetchLeadDetails = useCallback(
    (lead: APILead) => {
      // Show the sheet immediately with partial list data
      setSelectedLead(lead);
      setIsLeadDetailLoading(true);

      // Fetch full data in the background and update it silently
      dispatch({
        type: leadActions.GET_LEAD_DETAILS,
        method: "GET",
        endPoint: API.LEADS.GET(lead.id),
        auth: true,
        getResponse: (res: any) => {
          setIsLeadDetailLoading(false);
          if (res.data) setSelectedLead(res.data);
        },
        getError: (err: any) => {
          setIsLeadDetailLoading(false);
          toast.error("Failed to load full lead details");
        },
      });
    },
    [dispatch, toast],
  );

  /* ─── Stats from analytics ─────────────────────────────────── */
  const stats = useMemo(() => {
    if (analytics) {
      return {
        total: analytics.total_leads,
        new: analytics.new,
        contacted: analytics.contacted,
        interested: analytics.interested,
        follow_up: analytics.follow_up,
        converted: analytics.converted,
        lost: analytics.lost,
      };
    }
    const count = (stage: string) => leads.filter((l) => l.current_stage === stage).length;
    return {
      total: leads.length,
      new: count("new"),
      contacted: count("contacted"),
      interested: count("interested"),
      follow_up: count("follow_up"),
      converted: count("converted"),
      lost: count("lost"),
    };
  }, [analytics, leads]);

  /* ─── Drag & Drop handler ──────────────────────────────────── */
  const onDragEnd = useCallback((result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const targetStage = destination.droppableId;
    setPendingMove({ leadId: draggableId, stage: targetStage });
  }, []);

  const handleConfirmMove = useCallback(() => {
    if (!pendingMove) return;
    const { leadId, stage } = pendingMove;

    const leadToMove = leads.find((l) => String(l.id) === leadId);
    if (!leadToMove) return;

    const leadsWithoutMoved = leads.filter((l) => String(l.id) !== leadId);
    const updatedLeads = [{ ...leadToMove, current_stage: stage }, ...leadsWithoutMoved];

    dispatch(setLeads(updatedLeads));
    toast.success(`Lead moved to ${LEAD_STATUS_META[stage as LeadStatus]?.label || stage}`);

    dispatch({
      type: "UPDATE_LEAD_STATUS",
      method: "PATCH",
      endPoint: API.LEADS.STATUS(leadId),
      auth: true,
      body: { stage, note: moveNote },
      getError: () => {
        toast.error("Failed to update lead status");
        dispatch(setLeads(leads));
      },
    } as any);

    setPendingMove(null);
    setMoveNote("");
  }, [pendingMove, moveNote, leads, dispatch, toast]);

  const pendingLead = pendingMove ? leads.find((l) => String(l.id) === pendingMove.leadId) : null;
  const pendingTitle =
    pendingLead && pendingMove ? (
      <span className="flex items-center gap-1.5 flex-wrap font-medium">
        Converting{" "}
        <span className="font-bold text-primary">
          {pendingLead.first_name} {pendingLead.surname}
        </span>{" "}
        from
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
            LEAD_STATUS_META[pendingLead.current_stage as LeadStatus]?.bg,
            LEAD_STATUS_META[pendingLead.current_stage as LeadStatus]?.color,
          )}
        >
          {LEAD_STATUS_META[pendingLead.current_stage as LeadStatus]?.label ||
            pendingLead.current_stage}
        </span>
        to
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
            LEAD_STATUS_META[pendingMove.stage as LeadStatus]?.bg,
            LEAD_STATUS_META[pendingMove.stage as LeadStatus]?.color,
          )}
        >
          {LEAD_STATUS_META[pendingMove.stage as LeadStatus]?.label || pendingMove.stage}
        </span>
      </span>
    ) : (
      "Change Lead Stage"
    );

  return (
    <div>
      <PageHeader
        title="CRM & Pre-Admission"
        subtitle="Manage inquiries through the admission pipeline."
        actions={
          <Button onClick={fetchLeads} variant="outline" disabled={leadsLoading} className="gap-2">
            {leadsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        }
      />

      {/* ─── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
        <StatCard title="Total Leads" value={stats.total} icon={Users} />
        <StatCard title="New" value={stats.new} icon={UserPlus} />
        <StatCard title="Contacted" value={stats.contacted} icon={Phone} />
        <StatCard title="Interested" value={stats.interested} icon={TrendingUp} />
        <StatCard title="Follow Up" value={stats.follow_up} icon={Clock} />
        <StatCard title="Converted" value={stats.converted} icon={CheckCircle2} trendType="up" />
        <StatCard title="Lost" value={stats.lost} icon={XCircle} trendType="down" />
      </div>

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          {/* <TabsTrigger value="list">List View</TabsTrigger> */}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Pipeline (Kanban) */}
        <TabsContent value="pipeline">
          {leadsLoading && leads.length === 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-4 mt-3 -mx-1 px-1">
              {STAGES.map((stage) => {
                const meta = LEAD_STATUS_META[stage];
                const colors = STAGE_COLORS[stage];
                return <KanbanColumnSkeleton key={stage} meta={meta} colors={colors} />;
              })}
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-3 overflow-x-auto pb-4 mt-3 -mx-1 px-1">
                {STAGES.map((stage, stageIdx) => {
                  const stageLeads = leads.filter((l) => l.current_stage === stage);
                  const meta = LEAD_STATUS_META[stage];
                  const colors = STAGE_COLORS[stage];

                  return (
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stageIdx * 0.05 }}
                      className="flex-shrink-0 w-[280px]"
                    >
                      {/* Lane header */}
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
                          <span className="font-heading font-semibold text-sm">{meta.label}</span>
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

                      {/* Droppable lane body */}
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
                                      onClick={() => fetchLeadDetails(lead)}
                                    >
                                      {/* Name */}
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

                                      {/* Tags */}
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

                                      {/* Contact info */}
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

                                      {/* Footer */}
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
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <LeadsTable leads={leads} onView={fetchLeadDetails} />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <AnalyticsTab analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* ─── Lead Detail Sheet ───────────────────────────────── */}
      <LeadDetailSheet
        lead={selectedLead}
        isLoading={isLeadDetailLoading}
        onClose={() => setSelectedLead(null)}
      />

      {/* ─── Confirm Move Dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={!!pendingMove}
        onOpenChange={(open) => {
          if (!open) {
            setPendingMove(null);
            setMoveNote("");
          }
        }}
        onConfirm={handleConfirmMove}
        title={pendingTitle}
        description="Please provide an optional note for this stage change."
      >
        <div className="pt-2 pb-1">
          <Label htmlFor="note" className="text-xs text-muted-foreground mb-1 block">
            Note
          </Label>
          <Input
            id="note"
            placeholder="Enter note..."
            value={moveNote}
            onChange={(e) => setMoveNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirmMove();
              }
            }}
            className="text-sm h-10"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIST VIEW TABLE
   ═══════════════════════════════════════════════════════════════ */

function LeadsTable({ leads, onView }: { leads: APILead[]; onView: (l: APILead) => void }) {
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
        <Button variant="ghost" size="sm" onClick={() => onView(r)} className="gap-1">
          View <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="mt-3">
      <DataTable columns={cols} data={leads} exportable />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEAD DETAIL SHEET
   ═══════════════════════════════════════════════════════════════ */

function LeadDetailSheet({
  lead,
  isLoading,
  onClose,
}: {
  lead: APILead | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  if (!lead) return null;

  const meta = LEAD_STATUS_META[lead.current_stage as LeadStatus];
  const colors = STAGE_COLORS[lead.current_stage] || STAGE_COLORS.new;

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-[480px] w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl">
              {lead.first_name} {lead.surname}
            </SheetTitle>
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
          </div>
          <p className="text-xs text-muted-foreground font-mono">
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
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pipeline Stepper */}
            {/* <div>
            <Label className="text-xs mb-2 block">Pipeline Status</Label>
            <div className="flex items-center gap-1">
              {STAGES.map((s) => {
                const idx = STAGES.indexOf(s);
                const currentIdx = STAGES.indexOf(lead.current_stage as LeadStatus);
                const active = idx <= currentIdx;
                const sMeta = LEAD_STATUS_META[s];
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex-1 h-9 rounded flex items-center justify-center text-[10px] font-semibold transition-all",
                      active
                        ? `${sMeta.bg} ${sMeta.color}`
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {sMeta.label}
                  </div>
                );
              })}
            </div>
          </div> */}

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

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS TAB
   ═══════════════════════════════════════════════════════════════ */

function AnalyticsTab({ analytics }: { analytics: CRMAnalytics | null }) {
  if (!analytics)
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Loading analytics...</span>
      </div>
    );

  const COLORS = ["#3B82F6", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Conversion Rate"
          value={`${analytics.conversion_rate.toFixed(1)}%`}
          icon={TrendingUp}
          trendType="up"
          index={0}
        />
        <StatCard
          title="Avg Conversion Time"
          value={`${analytics.avg_conversion_days} days`}
          icon={CalIcon}
          index={1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 shadow-sm"
        >
          <h3 className="font-heading font-semibold text-lg mb-4">Leads by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.by_source}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, count }: any) => `${source} (${count})`}
                >
                  {analytics.by_source.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 shadow-sm"
        >
          <h3 className="font-heading font-semibold text-lg mb-4">Daily Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip labelFormatter={(v) => formatDate(v)} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETONS
   ═══════════════════════════════════════════════════════════════ */

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
