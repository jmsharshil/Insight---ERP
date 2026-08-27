import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const INACTIVITY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const DEBOUNCE_TIME = 1000; // 1 second throttle for high-frequency events

/**
 * A robust component that automatically logs the user out after a specified
 * period of inactivity. It handles throttling high-frequency events like 
 * mouse movements and scrolling.
 */
export default function AutoLogoutHandler({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const toast = useToast();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    const now = Date.now();
    // Throttle the resets to prevent performance degradation on high-frequency events
    if (now - lastActivityRef.current < DEBOUNCE_TIME && timerRef.current) {
      return;
    }
    lastActivityRef.current = now;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      if (user?.email) {
        sessionStorage.setItem("auto_logout_email", user.email);
      }
      logout();
      toast.info("You have been logged out due to inactivity.");
    }, INACTIVITY_TIME);
  }, [user, logout, toast]);

  useEffect(() => {
    // Only run the inactivity timer when the user is logged in
    if (!isAuthenticated) return;

    // Events that signify user activity
    const activityEvents = [
      'mousemove', 
      'click', 
      'keydown', 
      'scroll', 
      'touchstart'
    ];
    
    activityEvents.forEach(event => {
      // Use passive: true to ensure scrolling and touch events stay performant
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Initialize the first timer
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer]);

  return <>{children}</>;
}
