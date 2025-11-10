import LegalPage from "./legal-page";
import { acceptAge, isAgeOK } from "@/lib/ageGate";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AgeCompliance() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (isAgeOK()) {
      // If already accepted, send them home
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Compose the existing legal page content */}
      <LegalPage slug="18plus" titleKey="ageCompliance.title" />
      {/* Sticky CTA to confirm age */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 border-t border-border backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="text-sm text-muted">
            Confermo di avere almeno 18 anni (o età legale nel mio Paese) per accedere a contenuti per adulti.
          </div>
          <button
            onClick={() => { acceptAge(); navigate("/", { replace: true }); }}
            className="inline-flex items-center justify-center rounded-md bg-gold-primary text-background px-4 py-2 text-sm font-semibold shadow hover:opacity-90"
          >
            Ho più di 18 anni – Entra
          </button>
        </div>
      </div>
    </div>
  );
}
