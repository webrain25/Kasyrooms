import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFetchJson, AdminForbiddenError, AdminUnauthorizedError } from "@/lib/adminFetch";
import AdminErrorBanner from "@/pages/admin/components/AdminErrorBanner";
import { AdminTableSkeleton } from "@/pages/admin/components/AdminSkeletons";

type AuditList = {
  page: number;
  limit: number;
  items: Array<any>;
};

export default function AdminAuditPage() {
  const [, navigate] = useLocation();
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [forbidden, setForbidden] = useState<string | null>(null);

  const url = useMemo(() => {
    const u = new URL("/api/admin/audit", window.location.origin);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", "25");
    if (actorId.trim()) u.searchParams.set("actorId", actorId.trim());
    if (action.trim()) u.searchParams.set("action", action.trim());
    return u.pathname + u.search;
  }, [action, actorId, page]);

  const q = useQuery({
    queryKey: ["admin_audit", url],
    queryFn: () => adminFetchJson<AuditList>(url),
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

  return (
    <div className="space-y-4">
      {forbidden ? <AdminErrorBanner title="Access denied" message={forbidden} /> : null}
      <div>
        <h1 className="text-2xl font-semibold">Audit</h1>
        <p className="text-sm text-muted-foreground">Read-only audit log</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input
            value={actorId}
            onChange={(e) => {
              setPage(1);
              setActorId(e.target.value);
            }}
            placeholder="actorAdminId…"
          />
          <Input
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            placeholder="action… (e.g. users.suspend)"
          />
          <Button variant="outline" onClick={() => q.refetch()} disabled={q.isLoading}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Events</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <AdminTableSkeleton columns={4} rows={8} />
          ) : q.data ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.items.map((ev) => (
                    <TableRow key={String(ev.id)}>
                      <TableCell className="whitespace-nowrap">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{String(ev.actorAdminId || "—")}</TableCell>
                      <TableCell>{String(ev.action || "—")}</TableCell>
                      <TableCell className="text-xs">
                        <div className="text-muted-foreground">{String(ev.targetType || "—")}</div>
                        <div className="font-mono">{String(ev.targetId || "—")}</div>
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
            <div className="text-sm text-muted-foreground">No events.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
