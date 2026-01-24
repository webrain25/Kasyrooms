import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFetchJson, adminPostJson, AdminForbiddenError, AdminUnauthorizedError } from "@/lib/adminFetch";
import { ResolveReportDialog } from "@/pages/admin/components/ReasonDialog";
import { useToast } from "@/hooks/use-toast";
import AdminErrorBanner from "@/pages/admin/components/AdminErrorBanner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminTableSkeleton } from "@/pages/admin/components/AdminSkeletons";

type ReportsList = {
  page: number;
  limit: number;
  items: Array<any>;
};

export default function AdminReportsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [forbidden, setForbidden] = useState<string | null>(null);

  const url = useMemo(() => {
    const u = new URL("/api/admin/reports", window.location.origin);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", "25");
    if (status) u.searchParams.set("status", status);
    if (type) u.searchParams.set("type", type);
    return u.pathname + u.search;
  }, [page, status, type]);

  const q = useQuery({
    queryKey: ["admin_reports", url],
    queryFn: () => adminFetchJson<ReportsList>(url),
    staleTime: 0,
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

  const resolveReport = async (id: string, args: { action: string; notes?: string }) => {
    setActionLoading(true);
    try {
      await adminPostJson(`/api/admin/reports/${encodeURIComponent(id)}/resolve`, args);
      await q.refetch();
      toast({ title: "Report resolved", description: id });
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not resolve report",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {forbidden ? <AdminErrorBanner title="Access denied" message={forbidden} /> : null}
      <ResolveReportDialog
        open={!!resolveTargetId}
        onOpenChange={(open) => setResolveTargetId(open ? resolveTargetId : null)}
        title="Resolve report"
        description={resolveTargetId ? `Report ID: ${resolveTargetId}` : undefined}
        isLoading={actionLoading}
        onConfirm={async (args) => {
          if (!resolveTargetId) return;
          await resolveReport(resolveTargetId, args);
        }}
      />

      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Assign/resolve incoming reports</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Any status</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
          >
            <option value="">Any type</option>
            <option value="user">user</option>
            <option value="model">model</option>
            <option value="payment">payment</option>
            <option value="content">content</option>
            <option value="other">other</option>
          </select>
          <Button variant="outline" onClick={() => q.refetch()} disabled={q.isLoading}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <AdminTableSkeleton columns={6} rows={8} />
          ) : q.data ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.items.map((r) => (
                    <TableRow key={String(r.id)}>
                      <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                      <TableCell>{String(r.type || "—")}</TableCell>
                      <TableCell>{String(r.status || "—")}</TableCell>
                      <TableCell className="text-xs">
                        <div className="text-muted-foreground">{String(r.targetType || "—")}</div>
                        <div className="font-mono">{String(r.targetId || "—")}</div>
                      </TableCell>
                      <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        {String(r.status || "") !== "resolved" && (
                          <Button
                            size="sm"
                            onClick={() => setResolveTargetId(String(r.id))}
                            disabled={!hasPermission("reports.resolve")}
                            title={!hasPermission("reports.resolve") ? "Missing reports.resolve" : undefined}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">Page {q.data.page}</div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || q.isLoading}
                  >
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={q.isLoading}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No results.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
