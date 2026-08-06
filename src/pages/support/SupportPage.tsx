import { useEffect, useState } from "react";
import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { LifeBuoy, Mail, Phone, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { axiosRequest } from "@/service/axiosRequest";
import { CreateTicketDialog } from "./components/CreateTicketDialog";
import { useNavigate } from "react-router-dom";

export default function SupportPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const res = await axiosRequest({
        method: "GET",
        url: `${baseUrl}/api/v1/support/queries/`,
        headers: { Authorization: `Bearer ${token}` },
      });
      let fetchedData = res.data?.data || res.data?.results || res.data;
      if (!Array.isArray(fetchedData)) {
        fetchedData = [];
      }
      setQueries(fetchedData);
    } catch (err) {
      console.error("Failed to fetch support queries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const columns = [
    { 
      header: "Title", 
      render: (row: any) => (
        <span className="font-medium cursor-pointer text-primary hover:underline" onClick={() => navigate(`/support/queries/${row.id}`)}>
          {row.title}
        </span>
      ),
      key: "title"
    },
    { 
      header: "Status", 
      render: (row: any) => (
        <Badge variant="outline" className={`${row.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'} uppercase text-[10px]`}>
          {row.status || 'open'}
        </Badge>
      ),
      key: "status"
    },
    { 
      header: "Opened By", 
      render: (row: any) => {
        if (row.requested_by_name) return row.requested_by_name;
        if (typeof row.user === 'string') return "User";
        return row.user?.full_name || row.user?.name || "User";
      },
      key: "user"
    },
    { 
      header: "Assigned To", 
      render: (row: any) => {
        if (row.assigned_to_name) return row.assigned_to_name;
        if (!row.assigned_to) return "-";
        if (typeof row.assigned_to === 'string') return "Support Staff";
        return row.assigned_to?.full_name || row.assigned_to?.name || "Support Staff";
      },
      key: "assigned"
    },
    { 
      header: "Date", 
      render: (row: any) => {
        if (!row.created_at) return "-";
        const d = new Date(row.created_at);
        return format(d, "MMM d, yyyy h:mm a");
      },
      key: "date"
    }
  ];

  return (
    <>
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="faqs">FAQs & Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <SectionCard 
            title="My Support Tickets" 
            action={
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Create Ticket
              </Button>
            }
          >
            <DataTable 
              data={queries} 
              columns={columns} 
              loading={loading}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="faqs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="Contact Support">
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <LifeBuoy className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Need assistance?</h3>
                <p className="text-muted-foreground text-sm">
                  Our support team is available 24/7 to help you with any issues you might encounter while using the platform.
                </p>
                <div className="w-full pt-4 space-y-3">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-3 h-12">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground leading-none">Email us</span>
                      <span className="text-sm font-medium">support@insight.edu</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-start gap-3 h-12">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground leading-none">Call us</span>
                      <span className="text-sm font-medium">+91 1800 123 4567</span>
                    </div>
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Frequently Asked Questions">
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                  <h4 className="font-semibold text-sm mb-1">How do I reset my password?</h4>
                  <p className="text-xs text-muted-foreground">Go to the login page and click on "Forgot Password" to receive a reset link on your registered email.</p>
                </div>
                <div className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                  <h4 className="font-semibold text-sm mb-1">Where can I view my leave balance?</h4>
                  <p className="text-xs text-muted-foreground">You can view your detailed leave balances from the Leave Management module in the sidebar.</p>
                </div>
                <div className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                  <h4 className="font-semibold text-sm mb-1">I didn't receive a notification.</h4>
                  <p className="text-xs text-muted-foreground">Please check your notification settings or ensure you have active internet connectivity. Reach out if the issue persists.</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-center">
                <Button variant="link" className="text-primary text-sm flex items-center gap-2">
                  View full Knowledge Base <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      <CreateTicketDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        onSuccess={fetchQueries} 
      />
      
    </>
  );
}
