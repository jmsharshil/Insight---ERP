import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="text-center max-w-md">
        <p className="font-heading font-bold text-8xl text-primary">404</p>
        <h1 className="mt-4 font-heading font-bold text-2xl">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary-dark">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
