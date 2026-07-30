import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setMyBalance, setMyBalanceLoading, setViewedUserBalance, setViewedUserBalanceLoading } from "@/redux/slices/leaveSlice";
import type { LeaveBalance } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dropdownActions } from "@/redux/actions";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const ADMIN_ROLES = ["super_admin", "branch_manager", "admin_senior_executive"];

// Visual bar for remaining vs used
function BalanceBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-400" : "bg-green-500";
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BalancesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { myBalance, myBalanceLoading, viewedUserBalance, viewedUserBalanceLoading } = useSelector((s: RootState) => s.leave);

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  // Admin user lookup
  const [lookupUserId, setLookupUserId] = useState("");
  const [lookupYear, setLookupYear]     = useState(String(new Date().getFullYear()));

  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      getResponse: (res: any) => {
        const raw = res?.data?.results || res?.results || res?.data || res || [];
        const users = Array.isArray(raw) ? raw : [];
        const filtered = users.filter((u: any) => 
          !["super_admin", "student", "parent", "parents"].includes(u.role)
        );
        setStaffList(filtered.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || u.email
        })));
      },
      getError: () => {},
    });
  }, [dispatch]);

  useEffect(() => {
    dispatch({
      type: leaveActions.GET_MY_BALANCE,
      method: "GET",
      endPoint: API.LEAVE.MY_BALANCE,
      auth: true,
      setLoading: (v: boolean) => dispatch(setMyBalanceLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setMyBalance(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load balance"),
    });
  }, []);

  const handleLookup = () => {
    if (!lookupUserId.trim()) return;
    const params = lookupYear ? `?year=${lookupYear}` : "";
    dispatch({
      type: leaveActions.GET_USER_BALANCE,
      method: "GET",
      endPoint: `${API.LEAVE.USER_BALANCE(lookupUserId)}${params}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setViewedUserBalanceLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setViewedUserBalance(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load user balance"),
    });
  };

  const BalanceCards = ({ balances, loading }: { balances: LeaveBalance[]; loading: boolean }) => {
    if (loading) return <TableSkeleton />;
    if (balances.length === 0) return (
      <div className="text-center py-8 text-muted-foreground text-sm">No balance data found.</div>
    );
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {balances.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize">{b.leave_type_display}</p>
              <span className="text-xs text-muted-foreground">{b.year}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{b.remaining_days}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{b.used_days}</p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
              <div>
                <p className="text-lg font-bold text-muted-foreground">{b.total_days}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <BalanceBar used={Number(b.used_days)} total={Number(b.total_days)} />
            {Number(b.carried_forward) > 0 && (
              <p className="text-xs text-blue-600">+{b.carried_forward} carried forward</p>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* My Balance */}
      <div>
        <h3 className="text-sm font-semibold mb-3">My Leave Balance</h3>
        <BalanceCards balances={myBalance} loading={myBalanceLoading} />
      </div>

      {/* Admin: look up any user's balance */}
      {isAdmin && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold">Look Up Staff Balance</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <Label className="text-xs mb-1 block">Staff Member</Label>
              <Select value={lookupUserId} onValueChange={setLookupUserId}>
                <SelectTrigger className="h-9 text-sm w-64 bg-white">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.length > 0 ? (
                    staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 text-center">Loading...</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Year</Label>
              <Input type="number" min="0" value={lookupYear} onChange={e => setLookupYear(e.target.value)}
                className="h-9 text-sm w-24" />
            </div>
            <Button onClick={handleLookup} disabled={viewedUserBalanceLoading || !lookupUserId.trim()}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
              {viewedUserBalanceLoading ? "Loading…" : "Fetch Balance"}
            </Button>
          </div>
          {viewedUserBalance.length > 0 && (
            <BalanceCards balances={viewedUserBalance} loading={viewedUserBalanceLoading} />
          )}
        </div>
      )}
    </div>
  );
}
