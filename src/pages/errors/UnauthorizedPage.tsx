import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex rounded-full bg-destructive/10 p-5 mb-4">
          <ShieldOff className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="font-heading font-bold text-2xl">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to view this page. Contact your administrator if you think this is a mistake.
        </p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary-dark">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
