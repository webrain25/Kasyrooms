import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminFetchJson, AdminForbiddenError, AdminUnauthorizedError } from "@/lib/adminFetch";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminErrorBanner from "@/pages/admin/components/AdminErrorBanner";
import { AdminCardsSkeleton } from "@/pages/admin/components/AdminSkeletons";

type MetricsOverview = {
  range: string;
  usersRegistered: number;
  modelsActive: number;
  reportsOpen: number;
  reportsResolved: number;
};

export default function AdminOverviewPage() {
  const [, navigate] = useLocation();
  const [forbidden, setForbidden] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin_metrics_overview"],
    queryFn: () => adminFetchJson<MetricsOverview>("/api/admin/metrics/overview?range=7d"),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!q.error) return;
    if (q.error instanceof AdminUnauthorizedError) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (q.error instanceof AdminForbiddenError) {
      setForbidden(q.error.missing ? `Missing permission: ${q.error.missing}` : "Forbidden");
    }
  }, [q.error, navigate]);

  return (
    <div className="space-y-4">
      {forbidden ? <AdminErrorBanner title="Access denied" message={forbidden} /> : null}
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">KPI (last 7 days)</p>
      </div>

      {q.isLoading ? (
        <AdminCardsSkeleton count={4} />
      ) : q.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Users registered</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{q.data.usersRegistered}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Models active</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{q.data.modelsActive}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reports open</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{q.data.reportsOpen}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reports resolved</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{q.data.reportsResolved}</CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No data.</div>
      )}
    </div>
  );
}
