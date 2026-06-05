import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import router from "@/router/router";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
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
    </>
  );
}
