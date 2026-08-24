import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X, Search, Check, ChevronsUpDown } from "lucide-react";
import {
  setSlots, setSlotsLoading,
  setSelectedSlot, setSelectedSlotLoading,
  addSlot, updateSlotInList, removeSlot,
} from "@/redux/slices/timetableNewSlice";
import { timetableActions } from "@/redux/actions";
import { API } from "@/service/api";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SlotForm, { buildSlotPayload, type SlotFormValues } from "../components/SlotForm";
import TimetableGridView from "../components/TimetableGridView";

const DAY_TO_NUM: Record<string, string> = {
  Monday: "0", Tuesday: "1", Wednesday: "2",
  Thursday: "3", Friday: "4", Saturday: "5", Sunday: "6",
};

const SESSION_BADGE: Record<string, string> = {
  regular:    "bg-blue-100 text-blue-700",
  class_test: "bg-yellow-100 text-yellow-700",
  prelim:     "bg-purple-100 text-purple-700",
  practice:   "bg-green-100 text-green-700",
  custom:     "bg-gray-100 text-gray-700",
};

const DAY_MAP: Record<string, string> = {
  "0": "Mon", "1": "Tue", "2": "Wed", "3": "Thu", "4": "Fri", "5": "Sat", "6": "Sun",
};

const SLOT_TIMES: Record<string, { start: string; end: string }> = {
  P1: { start: "08:00", end: "10:00" },
  P2: { start: "10:15", end: "12:15" },
  P3: { start: "12:45", end: "14:45" },
  P4: { start: "15:00", end: "17:00" },
  P5: { start: "17:15", end: "19:15" },
  P6: { start: "19:30", end: "21:30" },
};

interface SlotsTabProps {
  batches:     { id: string; name: string }[];
  subjects:    { id: string; name: string }[];
  facultyList: { id: string; name: string; employee_id?: string; user_id?: string }[];
  classrooms:     { id: string; name: string }[];
  chapters:       { id: string; name: string; order: number; subject?: string }[];
  papers:         { id: string; name: string; subject?: string; file?: string }[];
  examinersList:  { id: string; name: string; employee_id?: string }[];
  paperCheckersList: { id: string; name: string; employee_id?: string }[];
  paperCheckersList: { id: string; name: string; employee_id?: string }[];
  defaultView?:   "grid" | "list";
  studentDetail?: any;
  onFiltersChange?: (filters: any) => void;
}

function FilterCombobox({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled
}: {
  items: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-9 text-sm w-44 justify-between font-normal px-3"
        >
          {selectedItem ? (
            <span className="truncate">{selectedItem.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[250px] overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id === value ? "" : item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function SlotsTab({
  batches, subjects, facultyList, classrooms, chapters, papers,
  examinersList, paperCheckersList, defaultView = "list", studentDetail, onFiltersChange
}: SlotsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { slots, slotsLoading, slotsCount } = useSelector((s: RootState) => s.timetableNew);
  const isBranchManager = user && user.role === "branch_manager";
  const isFaculty = user && user.role === "faculty";

  const currentFacultyProfile = useMemo(() => {
    if (!isFaculty || !user) return null;
    return facultyList.find(f => f.user_id === user.id || f.name.toLowerCase() === user.name?.toLowerCase());
  }, [facultyList, isFaculty, user]);

  const [filters, setFilters] = useState({ batch_id: "", day_of_week: "", faculty_id: "", subject_id: "", session_type: "" });
  const [gridBatchId, setGridBatchId] = useState("");
  
  useEffect(() => {
    onFiltersChange?.({
      ...filters,
      batch_id: defaultView === "grid" ? gridBatchId : filters.batch_id
    });
  }, [filters, gridBatchId, defaultView, onFiltersChange]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formPreFill, setFormPreFill] = useState<Partial<SlotFormValues> | null>(null);
  const [formLockedFields, setFormLockedFields] = useState<(keyof SlotFormValues)[]>([]);
  const [conflictData, setConflictData] = useState<{ payload: any, clashingSlots: any[], conflicts: string[], message: string } | null>(null);

  // Drag-and-copy state
  const [duplicateTarget, setDuplicateTarget] = useState<{
    slotId: string; slotCode: string; dayOfWeek: number; dayLabel: string; date: string; sourceSlot: any;
  } | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const canEdit = !!user && ["super_admin", "branch_manager", "admin_senior_executive", "admin"].includes(user.role ?? "");
  const canDelete = !!user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");

  const fetchSlots = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    
    if (isBranchManager && user?.branch) {
      p.set("branch_id", user.branch);
    }
    
    if (isFaculty && currentFacultyProfile) {
      p.set("faculty_id", currentFacultyProfile.id);
    }

    dispatch({
      type: timetableActions.GET_SLOTS,
      method: "GET",
      endPoint: `${API.TIMETABLE.SLOTS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setSlotsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          dispatch(setSlots({ data, count: res.count ?? data.length }));
        } else toast.error("Failed to load timetable slots.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading slots"),
    });
  };

  useEffect(() => {
    // If faculty, wait until faculty list is loaded (if possible) or just fetch anyway
    fetchSlots(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFacultyProfile?.id]);

  const isStudentLike = user && (user.role === "student" || user.role === "parent" || user.role === "parents");
  
  const studentBatchIds = useMemo(() => {
    const ids = new Set<string>();
    if (isStudentLike && studentDetail) {
      const getBatchId = (b: any) => (typeof b === "object" && b !== null) ? b.id || b.batch_id : b;
      const currentBatchId = getBatchId(studentDetail.batch);
      if (currentBatchId) ids.add(String(currentBatchId));
      if (studentDetail.batch_history) {
        studentDetail.batch_history.forEach((bh: any) => {
          const bhId = getBatchId(bh.batch || bh.batch_id);
          if (bhId) ids.add(String(bhId));
        });
      }
    }
    return ids;
  }, [isStudentLike, studentDetail]);

  const filteredBatches = useMemo(() => {
    if (isStudentLike && studentBatchIds.size > 0) {
      return batches.filter(b => studentBatchIds.has(String(b.id)));
    }
    return batches;
  }, [batches, isStudentLike, studentBatchIds]);

  const filteredSlots = useMemo(() => {
    let result = slots;
    if (isBranchManager) {
      const permittedBatchIds = new Set(batches.map(b => b.id));
      result = result.filter((slot: any) => permittedBatchIds.has(slot.batch));
    }
    if (isFaculty) {
      result = result.filter((slot: any) => {
        if (currentFacultyProfile) {
          return slot.faculty === currentFacultyProfile.id;
        }
        if (user?.name && slot.faculty_name) {
          return slot.faculty_name.toLowerCase().includes(user.name.toLowerCase()) || 
                 user.name.toLowerCase().includes(slot.faculty_name.toLowerCase());
        }
        return false;
      });
    }
    if (isStudentLike && studentBatchIds.size > 0) {
      result = result.filter((slot: any) => {
        const slotBatchId = typeof slot.batch === "object" && slot.batch !== null ? slot.batch.id || slot.batch.batch_id : slot.batch;
        return studentBatchIds.has(String(slotBatchId));
      });
    }
    return result;
  }, [slots, isBranchManager, isFaculty, batches, currentFacultyProfile, user?.name, isStudentLike, studentBatchIds]);

  const handleCreateOrUpdate = (payload: Record<string, any>) => {
    const isEdit = !!editingSlot;
    dispatch({
      type: isEdit ? timetableActions.UPDATE_SLOT : timetableActions.CREATE_SLOT,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.TIMETABLE.SLOT_DETAIL(editingSlot.id) : API.TIMETABLE.SLOTS,
      body: payload,
      auth: true,
      setLoading: (v: boolean) => setFormLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          if (isEdit) {
            dispatch(updateSlotInList(res.data));
            toast.success("Timetable slot updated.");
          } else {
            dispatch(addSlot(res.data));
            toast.success("Timetable slot created.");
          }
          setFormOpen(false);
          setEditingSlot(null);
          setConflictData(null);
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) => {
        const data = err?.response?.data;
        // Handle clash error specifically
        if ((data?.clashing_slots?.length || data?.conflicts?.length) && !payload.ignore_conflict) {
          setConflictData({ 
            payload, 
            clashingSlots: data.clashing_slots || [], 
            conflicts: data.conflicts || [],
            message: data.message || "Faculty scheduling conflict detected." 
          });
        } else {
          toast.error(data?.message || err?.message || `Failed to ${isEdit ? "update" : "create"} slot`);
        }
      },
    });
  };

  const handleConfirmConflict = () => {
    if (!conflictData) return;
    const isEdit = !!editingSlot;
    const bodyPayload = { ...conflictData.payload };
    if (isEdit) {
      bodyPayload.id = editingSlot.id;
    }
    
    dispatch({
      type: isEdit ? timetableActions.UPDATE_SLOT : timetableActions.CREATE_SLOT,
      method: "POST",
      endPoint: "/api/v1/timetable/confirm/",
      body: bodyPayload,
      auth: true,
      setLoading: (v: boolean) => setFormLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          if (isEdit) {
            dispatch(updateSlotInList(res.data));
            toast.success("Timetable slot updated.");
          } else {
            dispatch(addSlot(res.data));
            toast.success("Timetable slot created.");
          }
          setFormOpen(false);
          setEditingSlot(null);
          setConflictData(null);
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || "Failed to confirm slot");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: timetableActions.DELETE_SLOT,
      method: "DELETE",
      endPoint: API.TIMETABLE.SLOT_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeSlot(deleteTarget.id));
        toast.success("Timetable slot deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete slot"),
    });
  };

  if (defaultView === "grid") {
    return (
      <div className="space-y-4">
        {slotsLoading ? <TableSkeleton columns={7} rows={6} className="mt-0" /> : (
          <TimetableGridView
            slots={filteredSlots}
            batches={filteredBatches}
            canEdit={canEdit}
            canDelete={canDelete}
            onAddClick={(day, slotCode, batchId, date) => {
              if (!canEdit) return;
              const times = SLOT_TIMES[slotCode];
              const isExtraSlot = slotCode === "P5" || slotCode === "P6";
              setEditingSlot(null);
              setFormPreFill({
                session_type: isExtraSlot ? "custom" : "regular",
                day_of_week: String(DAY_TO_NUM[day]),
                slot_code: slotCode,
                batch: batchId,
                session_date: date,
                start_time: times?.start ?? "",
                end_time: times?.end ?? "",
              });
              setFormLockedFields(isExtraSlot ? ["batch", "session_type"] : ["batch", "day_of_week", "slot_code"]);
              setFormOpen(true);
            }}
            onSlotClick={(slot) => {
              if (!canEdit) return;
              setEditingSlot(slot);
              setFormLockedFields([]);
              setFormOpen(true);
            }}
            onDeleteSlot={(slot) => setDeleteTarget({ id: slot.id, name: slot.session_name || slot.id })}
            onDuplicateSlot={(slotId, slotCode, dayOfWeek, dayLabel, date, sourceSlot) => {
              setDuplicateTarget({ slotId, slotCode, dayOfWeek, dayLabel, date, sourceSlot });
            }}
            onActiveBatchChange={setGridBatchId}
          />
        )}
        
        <Dialog open={formOpen} onOpenChange={open => { setFormOpen(open); if (!open) { setEditingSlot(null); setFormPreFill(null); setFormLockedFields([]); } }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlot ? "Edit Timetable Slot" : "Create Timetable Slot"}</DialogTitle>
            </DialogHeader>
            <SlotForm
              batches={filteredBatches}
              subjects={subjects}
              facultyList={facultyList}
              classrooms={classrooms}
              chapters={chapters}
              papers={papers}
              examinersList={examinersList}
              paperCheckersList={paperCheckersList}
              loading={formLoading}
              isEdit={!!editingSlot}
              defaultValues={editingSlot ? {
                session_type:  editingSlot.session_type,
                batch:         editingSlot.batch,
                subject:       editingSlot.subject ?? "",
                faculty:       editingSlot.faculty ?? "",
                classroom:     editingSlot.classroom ?? "",
                session_name:  editingSlot.session_name ?? "",
                slot_code:     editingSlot.slot_code ?? "",
                day_of_week:   String(editingSlot.day_of_week ?? ""),
                session_date:  editingSlot.session_date ?? "",
                start_time:    editingSlot.start_time?.slice(0,5) ?? "",
                end_time:      editingSlot.end_time?.slice(0,5) ?? "",
                effective_from: editingSlot.effective_from ?? "",
                effective_to:   editingSlot.effective_to ?? "",
                is_recurring:   editingSlot.is_recurring ?? true,
                chapters:       (editingSlot.chapters ?? []).join(", "),
                examiners:      (editingSlot.examiners ?? []).join(", "),
                paper_checkers: (editingSlot.paper_checkers ?? []).join(", "),
                selected_papers: (editingSlot.exam?.selected_papers ?? []).map((p: any) => p.id || p).join(", "),
              } : formPreFill ?? undefined}
              lockedFields={editingSlot ? [] : formLockedFields}
              onSubmit={(payload) => handleCreateOrUpdate(payload)}
              onCancel={() => { setFormOpen(false); setEditingSlot(null); setFormPreFill(null); setFormLockedFields([]); }}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={o => !o && setDeleteTarget(null)}
          title={`Delete slot "${deleteTarget?.name}"?`}
          description="This removes only the timetable slot. Any linked Exam record will remain in the system."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
        />

        {/* Duplicate confirmation dialog */}
        <ConfirmDialog
          open={!!duplicateTarget}
          onOpenChange={o => { if (!o) setDuplicateTarget(null); }}
          title="Copy Session to Another Slot"
          description="Are you sure you want to copy this regular session?"
          confirmLabel={duplicateLoading ? "Copying..." : "Copy Session"}
          variant="info"
          onConfirm={() => {
            if (!duplicateTarget) return;
            setDuplicateLoading(true);
            dispatch({
              type: timetableActions.DUPLICATE_SLOT,
              method: "POST",
              endPoint: API.TIMETABLE.DUPLICATE(duplicateTarget.slotId),
              auth: true,
              body: {
                slot_code: duplicateTarget.slotCode,
                day_of_week: duplicateTarget.dayOfWeek,
              },
              getResponse: (res: any) => {
                setDuplicateLoading(false);
                if (res.data) dispatch(addSlot(res.data));
                toast.success(
                  `Session copied to ${duplicateTarget.dayLabel} · ${duplicateTarget.slotCode}`
                );
                setDuplicateTarget(null);
              },
              getError: (err: any) => {
                setDuplicateLoading(false);
                toast.error(err?.response?.data?.message || err?.response?.data?.detail || "Failed to copy session");
              },
            } as any);
          }}
        >
          {duplicateTarget && (
            <div className="space-y-3 pt-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-semibold text-blue-800">Source Session</p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Subject:</span> {duplicateTarget.sourceSlot?.subject_name || "—"}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Faculty:</span> {duplicateTarget.sourceSlot?.faculty_name || "—"}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Room:</span> {duplicateTarget.sourceSlot?.classroom_name || "—"}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-semibold text-green-800">Copy To</p>
                <p className="text-sm text-green-700">
                  <span className="font-medium">Day:</span> {duplicateTarget.dayLabel}{duplicateTarget.date ? ` (${duplicateTarget.date})` : ""}
                </p>
                <p className="text-sm text-green-700">
                  <span className="font-medium">Slot:</span> {duplicateTarget.slotCode}
                </p>
              </div>
            </div>
          )}
        </ConfirmDialog>

        <ConfirmDialog
          open={!!conflictData}
          onOpenChange={o => { if (!o) setConflictData(null); }}
          title="Scheduling Conflict Detected"
          description={conflictData?.conflicts?.length ? "The following conflicts were found. Do you want to proceed and save this slot anyway?" : conflictData?.message}
          confirmLabel={formLoading ? "Saving..." : "Confirm & Save"}
          variant="warning"
          onConfirm={handleConfirmConflict}
        >
          {conflictData && (
            <div className="mt-2 space-y-2">
              {conflictData.conflicts && conflictData.conflicts.length > 0 ? (
                conflictData.conflicts.map((conflict, idx) => (
                  <div key={idx} className="bg-yellow-50 text-yellow-800 text-sm border border-yellow-300 rounded-md p-2.5">
                    {conflict}
                  </div>
                ))
              ) : conflictData.clashingSlots && conflictData.clashingSlots.length > 0 ? (
                conflictData.clashingSlots.map((slot, idx) => (
                  <div key={idx} className="bg-yellow-50 text-yellow-800 text-sm border border-yellow-300 rounded-md p-2.5">
                    {typeof slot === "string" ? slot : `Clashing Slot: ${slot.batch_name || "Unknown Batch"} - ${slot.day_label || slot.session_date} ${slot.start_time}-${slot.end_time}`}
                  </div>
                ))
              ) : null}
            </div>
          )}
        </ConfirmDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <Select value={filters.session_type} onValueChange={v => setFilters(f => ({ ...f, session_type: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Session Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["regular","class_test","prelim","practice","custom"].map(t => (
              <SelectItem key={t} value={t} className="capitalize">{t === "custom" ? "Special" : t.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.day_of_week} onValueChange={v => setFilters(f => ({ ...f, day_of_week: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-32"><SelectValue placeholder="Day" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {[["0","Monday"],["1","Tuesday"],["2","Wednesday"],["3","Thursday"],["4","Friday"],["5","Saturday"],["6","Sunday"]].map(([v,l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FilterCombobox
          items={filteredBatches}
          value={filters.batch_id}
          onChange={(val) => setFilters(f => ({ ...f, batch_id: val }))}
          placeholder="Select Batch"
          searchPlaceholder="Search batches..."
          emptyText="No batches found."
        />
        <FilterCombobox
          items={facultyList.map(f => ({ id: f.id, name: f.employee_id ? `${f.name} (${f.employee_id})` : f.name }))}
          value={filters.faculty_id}
          onChange={(val) => setFilters(f => ({ ...f, faculty_id: val }))}
          placeholder="Select Faculty"
          searchPlaceholder="Search faculty..."
          emptyText="No faculty found."
        />
        <FilterCombobox
          items={subjects}
          value={filters.subject_id}
          onChange={(val) => setFilters(f => ({ ...f, subject_id: val }))}
          placeholder="Select Subject"
          searchPlaceholder="Search subjects..."
          emptyText="No subjects found."
        />
        <Button onClick={fetchSlots} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setFilters({ batch_id: "", day_of_week: "", faculty_id: "", subject_id: "", session_type: "" })}>
          <X className="w-3 h-3 mr-1" />Clear
        </Button>
        {canEdit && (
          <Button onClick={() => { setEditingSlot(null); setFormOpen(true); }} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm ml-auto gap-1.5">
            <Plus className="w-4 h-4" /> Add Slot
          </Button>
        )}
      </div>

      {slotsLoading ? <TableSkeleton columns={7} rows={6} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Timetable Slots</span>
            <span className="text-xs text-muted-foreground">{slotsCount} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40">
                <tr>{["Session", "Batch", "Subject", "Faculty", "Classroom", "Day / Date", "Time", "Exam", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredSlots.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No slots found.</td></tr>
                ) : filteredSlots.map((slot: any, i: number) => (
                  <motion.tr key={slot.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge className={`text-xs capitalize ${SESSION_BADGE[slot.session_type] ?? ""}`}>
                        {slot.session_type_display || slot.session_type}
                      </Badge>
                      {slot.session_name && <div className="text-xs text-muted-foreground mt-0.5 max-w-[140px] truncate">{slot.session_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium">{slot.batch_name || "—"}</div>
                      {slot.course_code && <div className="text-muted-foreground">{slot.course_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{slot.subject_name || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{slot.faculty_name || "—"}</div>
                      {slot.faculty_employee_id && <div className="text-muted-foreground">{slot.faculty_employee_id}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{slot.classroom_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {slot.session_type === "regular"
                        ? (
                            <div className="flex flex-col">
                              <span>{DAY_MAP[String(slot.day_of_week)] ?? slot.day_label ?? "—"}{slot.slot_code ? ` · ${slot.slot_code}` : ""}</span>
                              {slot.session_date && <span className="text-muted-foreground text-[10px]">{slot.session_date}</span>}
                            </div>
                          )
                        : <span>{slot.session_date ?? "—"}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {slot.exam
                        ? <Badge className="bg-purple-100 text-purple-700 text-xs">Exam linked</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditingSlot(slot); setFormOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget({ id: slot.id, name: slot.session_name || slot.id })}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={open => { setFormOpen(open); if (!open) { setEditingSlot(null); setFormPreFill(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Timetable Slot" : "Create Timetable Slot"}</DialogTitle>
          </DialogHeader>
          <SlotForm
            batches={filteredBatches}
            subjects={subjects}
            facultyList={facultyList}
            classrooms={classrooms}
            chapters={chapters}
            papers={papers}
            examinersList={examinersList}
            paperCheckersList={paperCheckersList}
            loading={formLoading}
            isEdit={!!editingSlot}
            defaultValues={editingSlot ? {
              session_type:  editingSlot.session_type,
              batch:         editingSlot.batch,
              subject:       editingSlot.subject ?? "",
              faculty:       editingSlot.faculty ?? "",
              classroom:     editingSlot.classroom ?? "",
              session_name:  editingSlot.session_name ?? "",
              slot_code:     editingSlot.slot_code ?? "",
              day_of_week:   String(editingSlot.day_of_week ?? ""),
              session_date:  editingSlot.session_date ?? "",
              start_time:    editingSlot.start_time?.slice(0,5) ?? "",
              end_time:      editingSlot.end_time?.slice(0,5) ?? "",
              effective_from: editingSlot.effective_from ?? "",
              effective_to:   editingSlot.effective_to ?? "",
              is_recurring:   editingSlot.is_recurring ?? true,
              chapters:       (editingSlot.chapters ?? []).join(", "),
              examiners:      (editingSlot.examiners ?? []).join(", "),
              paper_checkers: (editingSlot.paper_checkers ?? []).join(", "),
              selected_papers: (editingSlot.exam?.selected_papers ?? []).map((p: any) => p.id || p).join(", "),
            } : formPreFill ?? undefined}
            onSubmit={(payload) => handleCreateOrUpdate(payload)}
            onCancel={() => { setFormOpen(false); setEditingSlot(null); setFormPreFill(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete slot "${deleteTarget?.name}"?`}
        description="This removes only the timetable slot. Any linked Exam record will remain in the system."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

      {/* Conflict Confirm */}
      <ConfirmDialog
        open={!!conflictData}
        onOpenChange={o => { if (!o) setConflictData(null); }}
        title="Scheduling Conflict Detected"
        description={conflictData?.conflicts?.length ? "The following conflicts were found. Do you want to proceed and save this slot anyway?" : conflictData?.message}
        confirmLabel={formLoading ? "Saving..." : "Confirm & Save"}
        variant="warning"
        onConfirm={handleConfirmConflict}
      >
        {conflictData && (
          <div className="mt-2 space-y-2">
            {conflictData.conflicts && conflictData.conflicts.length > 0 ? (
              conflictData.conflicts.map((conflict, idx) => (
                <div key={idx} className="bg-yellow-50 text-yellow-800 text-sm border border-yellow-300 rounded-md p-2.5">
                  {conflict}
                </div>
              ))
            ) : conflictData.clashingSlots && conflictData.clashingSlots.length > 0 ? (
              conflictData.clashingSlots.map((slot, idx) => (
                <div key={idx} className="bg-yellow-50 text-yellow-800 text-sm border border-yellow-300 rounded-md p-2.5">
                  {typeof slot === "string" ? slot : `Clashing Slot: ${slot.batch_name || "Unknown Batch"} - ${slot.day_label || slot.session_date} ${slot.start_time}-${slot.end_time}`}
                </div>
              ))
            ) : null}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
