import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppRouter from "@/router/AppRouter";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "DM Sans, sans-serif",
            borderRadius: "10px",
          },
        }}
      />
    </BrowserRouter>
  );
}
