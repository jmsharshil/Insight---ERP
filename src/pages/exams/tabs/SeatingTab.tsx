import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Trash2, Pencil, Zap, Plus, Users } from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setSeating, setSeatingLoading, updateSeat, removeSeat } from "@/redux/slices/examSlice";
import type { SeatAssignment } from "@/redux/slices/examSlice";
import type { RootState } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface SeatingTabProps { examId: string; }

export default function SeatingTab({ examId }: SeatingTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { seating, seatingLoading } = useSelector((s: RootState) => s.exams);

  const [autoLoading, setAutoLoading]       = useState(false);
  const [manualOpen, setManualOpen]         = useState(false);
  const [manualLoading, setManualLoading]   = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState<SeatAssignment | null>(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<SeatAssignment | null>(null);

  const [manualForm, setManualForm] = useState({
    student_id: "", room_name: "", seat_number: "", row_number: "1",
  });

  const isAdmin   = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");
  const canAssign = isAdmin;

  const fetchSeating = () => {
    dispatch({
      type: examActions.GET_SEATING,
      method: "GET",
      endPoint: API.EXAMS.SEATING(examId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSeatingLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        dispatch(setSeating(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load seating"),
    });
  };

  useEffect(() => { fetchSeating(); }, [examId]);

  const handleAutoAssign = () => {
    dispatch({
      type: examActions.ASSIGN_SEATING,
      method: "POST",
      endPoint: API.EXAMS.SEATING(examId),
      body: { auto: true },
      auth: true,
      setLoading: (v: boolean) => setAutoLoading(v),
      getResponse: (res: any) => {
        toast.success(res?.message || "Seats auto-assigned.");
        fetchSeating();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Auto-assign failed"),
    });
  };

  const handleManualAssign = () => {
    dispatch({
      type: examActions.ASSIGN_SEATING,
      method: "POST",
      endPoint: API.EXAMS.SEATING(examId),
      body: [{ ...manualForm, row_number: Number(manualForm.row_number) }],
      auth: true,
      setLoading: (v: boolean) => setManualLoading(v),
      getResponse: () => {
        toast.success("Seat assigned.");
        setManualOpen(false);
        setManualForm({ student_id: "", room_name: "", seat_number: "", row_number: "1" });
        fetchSeating();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Manual assign failed"),
    });
  };

  const handleUpdateSeat = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_SEAT,
      method: "PATCH",
      endPoint: API.EXAMS.SEAT_DETAIL(examId, editTarget.id),
      body: { room_name: editTarget.room_name, seat_number: editTarget.seat_number, row_number: editTarget.row_number },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateSeat(res.data)); toast.success("Seat updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update seat"),
    });
  };

  const handleDeleteSeat = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_SEAT,
      method: "DELETE",
      endPoint: API.EXAMS.SEAT_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeSeat(deleteTarget.id)); toast.success("Seat removed."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to remove seat"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{seating.length} seat(s) assigned</p>
        {canAssign && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={handleAutoAssign} disabled={autoLoading}>
              <Zap className="w-3.5 h-3.5" />
              {autoLoading ? "Assigning…" : "Auto Assign"}
            </Button>
            <Button onClick={() => setManualOpen(true)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Manual Assign
            </Button>
          </div>
        )}
      </div>

      {seatingLoading ? <TableSkeleton rows={4} columns={5} /> : (
        <div>
          {seating.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-white rounded-xl border border-border">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p>No seats assigned yet.</p>
              {canAssign && <p className="mt-1 text-xs">Use Auto Assign or add manually.</p>}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {["Student", "Room", "Seat", "Row", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seating.map((seat, i) => (
                    <motion.tr key={seat.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{seat.student_name || "—"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{seat.student_id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{seat.room_name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{seat.seat_number}</td>
                      <td className="px-4 py-3 text-sm font-mono">{seat.row_number}</td>
                      <td className="px-4 py-3">
                        {canAssign && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(seat); setEditOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(seat)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Assign Dialog */}
      <Dialog open={manualOpen} onOpenChange={o => setManualOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Manual Seat Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: "Student UUID", key: "student_id", placeholder: "student-uuid", mono: true },
              { label: "Room Name",    key: "room_name",  placeholder: "Room 101" },
              { label: "Seat Number",  key: "seat_number", placeholder: "A1" },
              { label: "Row Number",   key: "row_number",  placeholder: "1", type: "number" },
            ].map(field => (
              <div key={field.key}>
                <Label className="text-xs font-semibold">{field.label} *</Label>
                <Input
                  type={(field as any).type ?? "text"}
                  value={(manualForm as any)[field.key]}
                  onChange={e => setManualForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className={`h-9 text-sm mt-1 ${field.mono ? "font-mono" : ""}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)} disabled={manualLoading}>Cancel</Button>
            <Button onClick={handleManualAssign} disabled={manualLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {manualLoading ? "Assigning…" : "Assign Seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Seat Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Seat</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              {[
                { label: "Room",        key: "room_name" },
                { label: "Seat Number", key: "seat_number" },
                { label: "Row Number",  key: "row_number", type: "number" },
              ].map(field => (
                <div key={field.key}>
                  <Label className="text-xs font-semibold">{field.label}</Label>
                  <Input
                    type={(field as any).type ?? "text"}
                    value={(editTarget as any)[field.key]}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, [field.key]: e.target.value } : null)}
                    className="h-9 text-sm mt-1"
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdateSeat} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Remove this seat assignment?"
        description="The student will lose their assigned seat."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDeleteSeat}
      />
    </div>
  );
}
