import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { studentActions } from "@/redux/actions";
import { setStudents, setStudentsLoading, setStudentsError } from "@/redux/slices/studentSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, GraduationCap, UserCheck, Award, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealStudent } from "@/redux/slices/studentSlice";
import { TableSkeleton } from "@/components/common/Skeletons";

export default function StudentsTab() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  
  const { students, loading: studentsLoading } = useSelector((state: RootState) => state.students);
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    dispatch({
      type: studentActions.GET_STUDENTS,
      method: "GET",
      endPoint: API.STUDENTS.LIST,
      auth: true,
      setLoading: (val: boolean) => dispatch(setStudentsLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setStudents({ data: res.data, count: res.count }));
        } else {
          dispatch(setStudentsError("Unexpected response format"));
          toast.error("Failed to load students data.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch students";
        dispatch(setStudentsError(msg));
        toast.error(msg);
      },
    });
  }, [dispatch, toast]);



  const cols: DataTableColumn<RealStudent>[] = [
    {
      key: "name", header: "Student",
      render: (r) => (
        <button
          onClick={() => navigate(`/students/${r.id}`)}
          className="flex items-center gap-2 hover:text-primary-dark"
        >
          {r.photo_url ? (
            <img src={r.photo_url} alt={r.full_name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark grid place-items-center text-xs font-medium">
              {r.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
          )}
          <span className="font-medium">{r.full_name}</span>
        </button>
      ),
    },
    { key: "admissionNumber", header: "Admission No", className: "font-mono text-xs", render: (r) => r.admission_number },
    { key: "course", header: "Course", render: (r) => <span className="capitalize">{r.course.replace(/_/g, " ")}</span> },
    { key: "batch", header: "Batch", render: (r) => <span className="capitalize">{r.batch_attempt}</span> },
    { key: "contact", header: "Contact", render: (r) => <div className="text-xs"><div>{r.phone_student}</div><div className="text-muted-foreground">{r.email}</div></div> },
    {
      key: "status", header: "Status",
      render: (r) => {
        let bg = "bg-gray-100", text = "text-gray-700";
        if (r.status === "active") { bg = "bg-green-100"; text = "text-green-700"; }
        if (r.status === "inactive") { bg = "bg-red-100"; text = "text-red-700"; }
        if (r.status === "alumni") { bg = "bg-purple-100"; text = "text-purple-700"; }
        return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", bg, text)}>{r.status_display}</span>;
      },
    },
    {
      key: "actions", header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/students/${r.id}`)}>View Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (studentsLoading && students.length === 0) {
    return <TableSkeleton columns={7} rows={6} className="mt-0" />;
  }

  return (
    <div className="mt-0 space-y-6">
      <DataTable 
        columns={cols} 
        data={students} 
        exportable={isSuperAdmin || user?.role === "branch_manager"} 
        onRowClick={(r) => navigate(`/students/${r.id}`)}
      />
    </div>
  );
}
