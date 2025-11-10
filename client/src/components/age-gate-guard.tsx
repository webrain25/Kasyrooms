import { PropsWithChildren, useEffect } from "react";
import { useLocation } from "wouter";
import { isAgeOK } from "@/lib/ageGate";

// Paths that are always allowed without age confirmation (legal, support, auth)
const ALLOWLIST_PREFIXES = [
  "/18plus",
  "/terms",
  "/privacy",
  "/cookies",
  "/dmca",
  "/guidelines",
  "/refund",
  "/support",
  "/help",
  "/faq",
  "/contact",
  "/login",
  "/register",
];

export default function AgeGateGuard({ children }: PropsWithChildren) {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const allowed = ALLOWLIST_PREFIXES.some((p) => location.startsWith(p));
    if (!allowed && !isAgeOK()) {
      if (location !== "/18plus") navigate("/18plus");
    }
  }, [location, navigate]);

  return <>{children}</>;
}
