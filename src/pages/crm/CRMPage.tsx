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
  Pencil,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import EditLeadDialog from "./EditLeadDialog";
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
import { TableSkeleton } from "@/components/common/Skeletons";
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
import { LEAD_STATUS_META, STAGE_COLORS, type LeadStatus } from "@/constants/dummy/crm";
import { formatDate, cn } from "@/lib/utils";

import LeadsTable from "./components/LeadsTable";
import AnalyticsTab from "./components/AnalyticsTab";
import KanbanBoard from "./components/KanbanBoard";
import LeadDetailSheet from "./components/LeadDetailSheet";

/* ─── Stage config ───────────────────────────────────────────── */

const STAGES: LeadStatus[] = ["new", "contacted", "interested", "visit", "visited", "follow_up", "converted", "lost"];
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

  const filteredLeads = useMemo(() => {
    if (!user || user.role === "super_admin" || !user.branch) return leads;
    return leads.filter((l: any) => {
      const branchId = typeof l.branch === "object" && l.branch !== null ? l.branch.id : l.branch;
      return branchId === user.branch;
    });
  }, [leads, user]);

  const [tab, setTab] = useState("table");
  const [selectedLead, setSelectedLead] = useState<APILead | null>(null);
  const [isLeadDetailLoading, setIsLeadDetailLoading] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);

  const [pendingMove, setPendingMove] = useState<{ leadId: string; stage: string } | null>(null);
  const [moveNote, setMoveNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [visitDate, setVisitDate] = useState("");

  useEffect(() => {
    setPageTitle("CRM & Pre-Admission");
  }, [setPageTitle]);

  /* ─── Fetch analytics ──────────────────────────────────────── */
  useEffect(() => {
    const endPoint = user && user.role === "branch_manager" && user.branch
      ? `${API.REPORTS.LEADS}${API.REPORTS.LEADS.includes('?') ? '&' : '?'}branch_id=${user.branch}`
      : API.REPORTS.LEADS;

    dispatch({
      type: crmActions.GET_CRM_ANALYTICS,
      method: "GET",
      endPoint: endPoint,
      auth: true,
      setLoading: (val: boolean) => dispatch(setCRMLoading(val)),
      getResponse: (res: any) => {
        if (res.data) dispatch(setCRMAnalytics(res.data));
      },
      getError: (err: any) => {
        dispatch(setCRMError(err.message));
        toast.error("Failed to load CRM analytics");
      },
    });
  }, [dispatch, toast]);

  /* ─── Fetch leads list ─────────────────────────────────────── */
  const fetchLeads = useCallback(() => {
    const endPoint = user && user.role === "branch_manager" && user.branch
      ? `${API.LEADS.LIST}${API.LEADS.LIST.includes('?') ? '&' : '?'}branch_id=${user.branch}`
      : API.LEADS.LIST;

    dispatch({
      type: leadActions.GET_LEADS,
      method: "GET",
      endPoint: endPoint,
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
        visit: (analytics as any).visit || 0,
        visited: (analytics as any).visited || 0,
        follow_up: analytics.follow_up,
        converted: analytics.converted,
        lost: analytics.lost,
      };
    }
    const count = (stage: string) => filteredLeads.filter((l) => l.current_stage === stage).length;
    return {
      total: filteredLeads.length,
      new: count("new"),
      contacted: count("contacted"),
      interested: count("interested"),
      visit: count("visit"),
      visited: count("visited"),
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

    if (stage === "follow_up" && !followUpDate) {
      toast.error("Follow-up date and time is required");
      return;
    }
    if (stage === "visit" && !visitDate) {
      toast.error("Visit date and time is required");
      return;
    }

    const leadToMove = leads.find((l) => String(l.id) === leadId);
    if (!leadToMove) return;

    const leadsWithoutMoved = leads.filter((l) => String(l.id) !== leadId);
    const updatedLeads = [{ ...leadToMove, current_stage: stage }, ...leadsWithoutMoved];

    dispatch(setLeads(updatedLeads));
    toast.success(`Lead moved to ${LEAD_STATUS_META[stage as LeadStatus]?.label || stage}`);

    const body: any = { stage, note: moveNote };
    if (stage === "follow_up" && followUpDate) {
      // Format datetime string slightly if needed, but standard datetime-local outputs "YYYY-MM-DDTHH:mm"
      // the backend might expect "YYYY-MM-DD HH:mm:ss", but let's pass it straight first or format it:
      body.followup_date = followUpDate.replace("T", " ") + ":00";
    }
    if (stage === "visit" && visitDate) {
      body.visit_date = visitDate.replace("T", " ") + ":00";
    }

    dispatch({
      type: "UPDATE_LEAD_STATUS",
      method: "PATCH",
      endPoint: API.LEADS.STATUS(leadId),
      auth: true,
      body,
      getError: () => {
        toast.error("Failed to update lead status");
        dispatch(setLeads(leads));
      },
    } as any);

    setPendingMove(null);
    setMoveNote("");
    setFollowUpDate("");
    setVisitDate("");
  }, [pendingMove, moveNote, followUpDate, visitDate, leads, dispatch, toast]);

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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
        <StatCard title="Total Leads" value={stats.total} icon={Users} />
        <StatCard title="New" value={stats.new} icon={UserPlus} />
        <StatCard title="Contacted" value={stats.contacted} icon={Phone} />
        <StatCard title="Interested" value={stats.interested} icon={TrendingUp} />
        <StatCard title="Visit" value={stats.visit} icon={MapPin} />
        <StatCard title="Visited" value={stats.visited} icon={CheckCircle2} />
        <StatCard title="Follow Up" value={stats.follow_up} icon={Clock} />
        <StatCard title="Converted" value={stats.converted} icon={CheckCircle2} trendType="up" />
        <StatCard title="Lost" value={stats.lost} icon={XCircle} trendType="down" />
      </div>

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="pipeline">Kanban Board</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
      
      
      
        {/* Table View */}
        <TabsContent value="table">
          {leadsLoading ? (
            <TableSkeleton rows={10} columns={8} className="mt-3" />
          ) : (
          <LeadsTable
            leads={filteredLeads}
            onView={(lead) => {
              setSelectedLead(lead);
              fetchLeadDetails(lead);
            }}
            onChangeStage={(lead, stage) => {
              setPendingMove({ leadId: String(lead.id), stage });
            }}
            onAssignSuccess={() => fetchLeads()}
          />
        )}
        </TabsContent>

        {/* Pipeline (Kanban) */}
        <TabsContent value="pipeline">
          <KanbanBoard
            leads={filteredLeads}
            leadsLoading={leadsLoading}
            stages={STAGES}
            onDragEnd={onDragEnd}
            onView={(lead) => {
              setSelectedLead(lead);
              fetchLeadDetails(lead);
            }}
            onAssignSuccess={() => fetchLeads()}
          />
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
        onEditClick={() => setIsEditLeadOpen(true)}
      />

      {/* ─── Edit Lead Dialog ────────────────────────────────── */}
      <EditLeadDialog
        lead={selectedLead}
        open={isEditLeadOpen}
        onOpenChange={setIsEditLeadOpen}
        onSuccess={() => {
          fetchLeads();
          if (selectedLead) {
             fetchLeadDetails(selectedLead);
          }
        }}
      />

      {/* ─── Confirm Move Dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={!!pendingMove}
        onOpenChange={(open) => {
          if (!open) {
            setPendingMove(null);
            setMoveNote("");
            setFollowUpDate("");
            setVisitDate("");
          }
        }}
        onConfirm={handleConfirmMove}
        title={pendingTitle}
        description="Please provide an optional note for this stage change."
      >
        <div className="pt-2 pb-1 space-y-3">
          {pendingMove?.stage === "follow_up" && (
            <div>
              <Label htmlFor="followUpDate" className="text-xs text-muted-foreground mb-1 block">
                Follow Up Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="followUpDate"
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="text-sm h-10"
              />
            </div>
          )}
          {pendingMove?.stage === "visit" && (
            <div>
              <Label htmlFor="visitDate" className="text-xs text-muted-foreground mb-1 block">
                Visit Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="visitDate"
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="text-sm h-10"
              />
            </div>
          )}
          <div>
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
        </div>
      </ConfirmDialog>
    </div>
  );
}



