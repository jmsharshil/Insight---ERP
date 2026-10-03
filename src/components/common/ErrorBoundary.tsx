import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
    
    // Check if error is due to a new deployment (Vite chunk load error)
    const isChunkLoadError = error?.name === 'ChunkLoadError' || error?.message?.includes('Failed to fetch dynamically imported module');
    if (isChunkLoadError) {
      const reloadCount = parseInt(sessionStorage.getItem('chunk_reload_count') || '0', 10);
      if (reloadCount < 2) {
        sessionStorage.setItem('chunk_reload_count', String(reloadCount + 1));
        window.location.reload();
      }
    }
  }

  reset = () => {
    const isChunkLoadError = this.state.error?.name === 'ChunkLoadError' || this.state.error?.message?.includes('Failed to fetch dynamically imported module');
    if (isChunkLoadError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: undefined });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
            <div className="rounded-full bg-destructive/10 p-3 inline-flex mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button onClick={this.reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
