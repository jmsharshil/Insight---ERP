import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { admissionActions } from "@/redux/actions";
import { setSelectedAdmission, setSelectedAdmissionLoading, setAdmissionsError } from "@/redux/slices/admissionSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";

import { motion } from "framer-motion";
import { ChevronLeft, Calendar, MapPin, Phone, Mail, FileText, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageLoader from "@/components/common/PageLoader";

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-border/40 last:border-0 gap-1 sm:gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-1/3">
        {icon} <span>{label}</span>
      </div>
      <div className="text-sm font-medium sm:w-2/3 break-words">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-5 h-full">
      <h3 className="font-heading text-lg font-semibold mb-4 text-card-foreground border-b border-border/50 pb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function StudentAdmissionDetailedPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { setPageTitle } = useUI();

  const { selectedAdmission: admission, selectedAdmissionLoading: loading, error } = useSelector((state: RootState) => state.admissions);

  useEffect(() => {
    setPageTitle("Admission Details");
  }, [setPageTitle]);

  useEffect(() => {
    if (!id) return;
    dispatch({
      type: admissionActions.GET_ADMISSION_DETAIL,
      method: "GET",
      endPoint: API.ADMISSIONS.GET(id),
      auth: true,
      setLoading: (val: boolean) => dispatch(setSelectedAdmissionLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setSelectedAdmission(res.data));
        } else {
          dispatch(setAdmissionsError("Invalid data format"));
        }
      },
      getError: (err: any) => {
        dispatch(setAdmissionsError(err?.message || "Failed to load"));
        toast.error("Failed to load admission details.");
      }
    });
  }, [id, dispatch, toast]);

  if (loading) return <PageLoader />;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!admission) return <div className="p-6 text-center text-muted-foreground">No data found.</div>;

  const handleApprove = () => {
    dispatch({
      type: admissionActions.APPROVE_ADMISSION,
      method: "POST",
      endPoint: API.ADMISSIONS.APPROVE(admission.id),
      auth: true,
      setLoading: (val: boolean) => dispatch(setSelectedAdmissionLoading(val)),
      getResponse: () => {
        toast.success("Admission approved successfully!");
        navigate(-1);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || "Failed to approve admission");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="w-5 h-5" /></Button>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Admission #{admission.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          {(admission.status === "approval_pending" || admission.status === "payment_submitted") && (
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">Approve Admission</Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        {admission.doc_photo ? (
          <img src={admission.doc_photo} alt={admission.first_name} className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-sm" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary-light text-primary-dark grid place-items-center text-3xl font-bold shadow-sm">
            {admission.first_name?.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-heading font-bold text-text-primary">{admission.first_name} {admission.surname}</h2>
            <Badge className={admission.status === "payment_pending" ? "bg-amber-100 text-amber-700" : admission.status === "payment_submitted" ? "bg-blue-100 text-blue-700" : admission.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-black"}>
              {admission.status_display || admission.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium"><span className="capitalize">{admission.course?.replace(/_/g, " ")}</span> ({admission.batch_attempt})</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {admission.branch?.name || admission.city}</span>
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {admission.phone_student}</span>
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {admission.email}</span>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile & Contact</TabsTrigger>
          <TabsTrigger value="academic">Academic & Forms</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payment">Payment Info</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Personal Details">
              <Row icon={<User className="w-4 h-4" />} label="First Name" value={admission.first_name} />
              <Row label="Surname" value={admission.surname} />
              <Row icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={admission.dob} />
              <Row label="Category" value={admission.category?.toUpperCase() || "—"} />
            </Card>

            <Card title="Address & Location">
              <Row icon={<MapPin className="w-4 h-4" />} label="Street" value={admission.street} />
              {admission.apartment && <Row label="Apartment" value={admission.apartment} />}
              <Row label="City" value={admission.city} />
              <Row label="State" value={admission.state} />
              <Row label="Pincode" value={admission.pincode} />
              <Row label="Country" value={admission.country} />
              <Row label="Location Area" value={admission.location || "—"} />
            </Card>

            <Card title="Parents & Guardians">
              <Row label="Father's Name" value={admission.father_name || "—"} />
              <Row label="Mother's Name" value={admission.mother_name || "—"} />
              <Row icon={<Phone className="w-4 h-4" />} label="Father Phone" value={admission.phone_father || "—"} />
              {admission.phone_father_2 && <Row icon={<Phone className="w-4 h-4" />} label="Alt Father Phone" value={admission.phone_father_2} />}
              <Row icon={<Mail className="w-4 h-4" />} label="Parent Email" value={admission.email_parent || "—"} />
            </Card>

            <Card title="Administrative Notes">
              <div className="space-y-4">
                <Row label="Counsellor" value={admission.assigned_counsellor?.name || "Unassigned"} />
                <Row label="Reference" value={admission.reference?.replace(/_/g, " ").toUpperCase() || "—"} />
                <Row label="Consent Given" value={admission.consent ? "Yes" : "No"} />
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground block mb-1">Notes:</span>
                  <p className="text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{admission.note || "No notes available."}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Admission Details">
              <Row label="Course" value={<span className="capitalize">{admission.course?.replace(/_/g, " ")}</span>} />
              <Row label="Module/Group" value={<span className="capitalize">{admission.group_module?.replace(/_/g, " ")}</span>} />
              <Row label="Batch Attempt" value={<span className="capitalize">{admission.batch_attempt}</span>} />
              <Row label="Qualification" value={admission.qualification || "—"} />
            </Card>

            <Card title="10th Standard Details">
              <Row label="Medium" value={<span className="uppercase">{admission.tenth_medium || "—"}</span>} />
              <Row label="School" value={admission.tenth_school || "—"} />
              <Row label="Coaching" value={admission.tenth_coaching || "—"} />
              <Row label="Percentage" value={admission.tenth_percentage ? `${admission.tenth_percentage}%` : "—"} />
              <Row label="Percentile" value={admission.tenth_percentile ? `${admission.tenth_percentile} PR` : "—"} />
            </Card>

            <Card title="12th Standard Details">
              <Row label="Medium" value={<span className="uppercase">{admission.twelfth_medium || "—"}</span>} />
              <Row label="School" value={admission.twelfth_school || "—"} />
              <Row label="Coaching" value={admission.twelfth_coaching || "—"} />
              <Row label="Percentage" value={admission.twelfth_percentage ? `${admission.twelfth_percentage}%` : "—"} />
              <Row label="Percentile" value={admission.twelfth_percentile ? `${admission.twelfth_percentile} PR` : "—"} />
            </Card>

            <Card title="Graduation Details">
              <Row label="University" value={admission.grad_university || "—"} />
              <Row label="College" value={admission.grad_college || "—"} />
              <Row label="Last Semester" value={admission.grad_last_sem || "—"} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card title="Uploaded Documents">
            <div className="grid sm:grid-cols-2 gap-4">
              {admission.doc_photo && <a href={admission.doc_photo} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> Photograph</a>}
              {admission.doc_signature && <a href={admission.doc_signature} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> Signature</a>}
              {admission.doc_dob_certificate && <a href={admission.doc_dob_certificate} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> DOB Certificate</a>}
              {admission.doc_id_card && <a href={admission.doc_id_card} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> ID Proof</a>}
              {admission.doc_twelfth_receipt && <a href={admission.doc_twelfth_receipt} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> 12th Receipt</a>}
              {admission.doc_twelfth_marksheet && <a href={admission.doc_twelfth_marksheet} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> 12th Marksheet</a>}
              {admission.doc_category_cert && <a href={admission.doc_category_cert} target="_blank" className="text-primary hover:underline flex items-center gap-2 p-3 bg-muted/20 rounded border border-border/50"><FileText className="w-5 h-5 text-blue-500" /> Category Certificate</a>}
              
              {(!admission.doc_photo && !admission.doc_signature && !admission.doc_dob_certificate && !admission.doc_id_card && !admission.doc_twelfth_receipt && !admission.doc_twelfth_marksheet && !admission.doc_category_cert) && (
                <p className="text-sm text-muted-foreground col-span-2 p-4">No documents uploaded.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Payment Status">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {admission.status === "payment_submitted" || admission.status === "active" ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-lg capitalize">{admission.status.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {admission.status === "payment_pending" ? "Waiting for student to upload payment details." : "Payment details submitted."}
                    </p>
                  </div>
                </div>
                
                {admission.status === "payment_pending" && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mt-4">
                    The student has been sent a link to upload their payment details. 
                    <br />
                    Link: <code>/insight/student/payment-upload?id={admission.id}</code>
                  </div>
                )}
              </div>
            </Card>

            {(admission.payment_screenshot || admission.transaction_id) && (
              <Card title="Payment Details">
                <Row label="Transaction ID" value={<span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{admission.transaction_id || "N/A"}</span>} />
                <Row label="Submitted At" value={admission.payment_submitted_at ? new Date(admission.payment_submitted_at).toLocaleString() : "—"} />
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground block mb-2">Screenshot:</span>
                  {admission.payment_screenshot ? (
                    <a href={admission.payment_screenshot} target="_blank" rel="noreferrer">
                      <img src={admission.payment_screenshot} alt="Payment Screenshot" className="max-h-[200px] rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <span className="text-sm">No screenshot provided.</span>
                  )}
                </div>
                {admission.payment_note && (
                  <div className="pt-4">
                    <span className="text-sm text-muted-foreground block mb-1">Student Note:</span>
                    <p className="text-sm bg-muted/30 p-2 rounded-md">{admission.payment_note}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
