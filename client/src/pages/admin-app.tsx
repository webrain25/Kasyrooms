import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import AdminLoginPage from "@/pages/admin-login";
import AdminLayout from "@/pages/admin/layout";
import AdminOverviewPage from "@/pages/admin/overview";
import AdminUsersPage from "@/pages/admin/users";
import AdminModelsPage from "@/pages/admin/models";
import AdminReportsPage from "@/pages/admin/reports";
import AdminAuditPage from "@/pages/admin/audit";
import AdminSirplayPage from "@/pages/admin/sirplay";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AdminForbiddenError } from "@/lib/adminFetch";

function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside>
          <Skeleton className="h-60 w-full" />
        </aside>
        <main className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    </div>
  );
}

function AdminProtectedArea() {
  const { admin, isLoading, isError, error, logout } = useAdminAuth({ redirectToLogin: true });

  if (isLoading) {
    return <AdminShellSkeleton />;
  }

  if (isError) {
    if (error instanceof AdminForbiddenError) {
      return (
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-xl px-4 py-12 space-y-4">
            <div className="text-lg font-semibold">Access denied</div>
            <div className="text-sm text-muted-foreground">
              Your admin session is valid, but you are not allowed to access the admin area.
            </div>
            {error.message ? <div className="text-sm">Reason: {error.message}</div> : null}
            <div className="flex gap-2">
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-12 space-y-4">
          <div className="text-lg font-semibold">Admin error</div>
          <div className="text-sm text-muted-foreground">{String(error)}</div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout admin={admin} onLogout={logout}>
      <Switch>
        <Route path="/admin" component={AdminOverviewPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/models" component={AdminModelsPage} />
        <Route path="/admin/reports" component={AdminReportsPage} />
        <Route path="/admin/audit" component={AdminAuditPage} />
        <Route path="/admin/sirplay" component={AdminSirplayPage} />
        <Route>{() => <div className="text-sm text-muted-foreground">Not found. Go to /admin.</div>}</Route>
      </Switch>
    </AdminLayout>
  );
}

function AdminLoginRoute() {
  const { admin, isLoading } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (admin) navigate("/admin", { replace: true });
  }, [admin, isLoading, navigate]);

  if (isLoading) return <AdminShellSkeleton />;
  if (admin) return null;
  return <AdminLoginPage />;
}

export default function AdminApp() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginRoute} />
      <Route>{() => <AdminProtectedArea />}</Route>
    </Switch>
  );
}
