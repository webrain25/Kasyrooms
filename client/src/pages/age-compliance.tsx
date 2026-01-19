import LegalPage from "./legal-page";
import { acceptAge, isAgeOK, clearAgeConsent } from "@/lib/ageGate";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

export default function AgeCompliance() {
  const [location, navigate] = useLocation();
  const [blocked, setBlocked] = useState(false);
  const { t } = useI18n();
  useEffect(() => {
    if (isAgeOK()) {
      // If already accepted, send them home
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background legal content (scorrevole) */}
      <LegalPage slug="18plus" titleKey="ageCompliance.title" />

      {/* Full-screen blocking overlay with centered banner */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card border border-border rounded-xl shadow-xl w-[90%] max-w-md p-6 text-center">
          <h2 className="text-2xl font-semibold mb-3">{t("ageCompliance.modal.title")}</h2>
          {!blocked ? (
            <>
              <p className="text-muted mb-5">
                {t("ageCompliance.modal.body")}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { acceptAge(); navigate("/", { replace: true }); }}
                  className="inline-flex items-center justify-center rounded-md bg-gold-primary text-background px-4 py-2 text-sm font-semibold shadow hover:opacity-90"
                >
                  {t("ageCompliance.modal.yes")}
                </button>
                <button
                  onClick={() => { clearAgeConsent(); setBlocked(true); }}
                  className="inline-flex items-center justify-center rounded-md bg-muted text-foreground px-4 py-2 text-sm font-semibold border border-border hover:bg-muted/80"
                >
                  {t("ageCompliance.modal.no")}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted mb-5">
                {t("ageCompliance.modal.blocked")}
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://www.google.com"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-foreground px-4 py-2 text-sm font-semibold border border-border hover:bg-accent/80"
                >
                  {t("ageCompliance.modal.exit")}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
