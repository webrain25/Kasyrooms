import { Switch, Route } from "wouter";
import { Suspense, lazy, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchProvider } from "@/lib/searchContext";
import { FavoritesProvider } from "@/lib/favoritesContext";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/authContext";
import { withRole } from "@/components/route-guards";
// Use relative import to avoid IDE path alias glitches
import AgeGateGuard from "./components/age-gate-guard";
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const ModelProfile = lazy(() => import("@/pages/model-profile"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const AllModels = lazy(() => import("@/pages/models"));
const Favorites = lazy(() => import("@/pages/favorites"));
const BecomeModelPage = lazy(() => import("@/pages/become-model"));
const HelpPage = lazy(() => import("@/pages/support/help"));
const ContactPage = lazy(() => import("@/pages/support/contact"));
const TermsPage = lazy(() => import("@/pages/terms"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const CookiesPage = lazy(() => import("@/pages/cookies"));
const SupportLanding = lazy(() => import("@/pages/support"));
const FAQPage = lazy(() => import("@/pages/support/faq"));
const DmcaPage = lazy(() => import("@/pages/dmca"));
const DmcaSubmitPage = lazy(() => import("@/pages/dmca-submit"));
const GuidelinesPage = lazy(() => import("@/pages/guidelines"));
const RefundPolicyPage = lazy(() => import("@/pages/refund"));
const AdminDashboard = lazy(() => import("@/pages/admin"));
const ModelDashboard = lazy(() => import("@/pages/model-dashboard"));
const AgeCompliance = lazy(() => import("@/pages/age-compliance"));
const KycOnboardingPage = lazy(() => import("@/pages/kyc"));
// Debug tools (non-production) lazy import
const DebugImages = lazy(() => import("@/pages/debug-images"));

function Router() {
  const AdminOnly = withRole(['admin'], AdminDashboard);
  const ModelOnly = withRole(['model'], ModelDashboard);
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <Switch>
        <Route path="/" component={Home} />
        {/* Favorites page performs its own auth redirect */}
        <Route path="/favorites" component={Favorites} />
        <Route path="/models" component={AllModels} />
        <Route path="/become-model" component={BecomeModelPage} />
        <Route path="/support" component={SupportLanding} />
        <Route path="/help" component={HelpPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/cookies" component={CookiesPage} />
        <Route path="/dmca" component={DmcaPage} />
  <Route path="/dmca-submit" component={DmcaSubmitPage} />
  <Route path="/kyc" component={KycOnboardingPage} />
        <Route path="/guidelines" component={GuidelinesPage} />
        <Route path="/refund" component={RefundPolicyPage} />
  <Route path="/18plus" component={AgeCompliance} />
  <Route path="/admin">{() => <AdminOnly />}</Route>
  <Route path="/dashboard/model">{() => <ModelOnly />}</Route>
        <Route path="/model/:id" component={ModelProfile} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
  {/* Debug image loading page (omit from production menus) */}
  <Route path="/debug/images" component={DebugImages} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SearchProvider>
          <FavoritesProvider>
            <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <AgeGateGuard>
              <TokenConsumer />
              <Router />
            </AgeGateGuard>
          </TooltipProvider>
            </I18nProvider>
          </FavoritesProvider>
        </SearchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function TokenConsumer() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;
    // Consume token and then clean URL
    (async () => {
      try {
        const r = await fetch('/api/auth/login-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token })
        });
        if (!r.ok) {
          // On failure, redirect to login
          window.location.replace('/login');
          return;
        }
        const j = await r.json();
        if (j?.user && j?.token) {
          try {
            localStorage.setItem('user', JSON.stringify(j.user));
            localStorage.setItem('token', j.token);
          } catch {}
        }
        // Clean URL without token param
        url.searchParams.delete('token');
        const clean = url.pathname + (url.searchParams.toString() ? ('?' + url.searchParams.toString()) : '') + url.hash;
        window.history.replaceState({}, '', clean);
        // Optionally reload to reinitialize AuthProvider from localStorage
        window.location.reload();
      } catch {
        window.location.replace('/login');
      }
    })();
  }, []);
  return null;
}

export default App;
