import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFetchJson, adminPostJson, AdminForbiddenError, AdminUnauthorizedError } from "@/lib/adminFetch";
import { ConfirmDialog, SuspendReasonDialog } from "@/pages/admin/components/ReasonDialog";
import { useToast } from "@/hooks/use-toast";
import AdminErrorBanner from "@/pages/admin/components/AdminErrorBanner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminTableSkeleton } from "@/pages/admin/components/AdminSkeletons";

type UsersList = {
  page: number;
  limit: number;
  items: Array<{
    id: string;
    username: string | null;
    email: string | null;
    role: string | null;
    status: string | null;
    lastLogin: string | null;
    createdAt: string;
  }>;
};

export default function AdminUsersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [suspendTargetId, setSuspendTargetId] = useState<string | null>(null);
  const [unsuspendTargetId, setUnsuspendTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [forbidden, setForbidden] = useState<string | null>(null);

  const url = useMemo(() => {
    const u = new URL("/api/admin/users", window.location.origin);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", "25");
    if (query.trim()) u.searchParams.set("query", query.trim());
    if (status) u.searchParams.set("status", status);
    return u.pathname + u.search;
  }, [page, query, status]);

  const q = useQuery({
    queryKey: ["admin_users", url],
    queryFn: () => adminFetchJson<UsersList>(url),
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

  const suspend = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      await adminPostJson(`/api/admin/users/${encodeURIComponent(id)}/suspend`, { reason });
      await q.refetch();
      toast({ title: "User suspended", description: id });
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not suspend user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const unsuspend = async (id: string) => {
    setActionLoading(true);
    try {
      await adminPostJson(`/api/admin/users/${encodeURIComponent(id)}/unsuspend`);
      await q.refetch();
      toast({ title: "User unsuspended", description: id });
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not unsuspend user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {forbidden ? <AdminErrorBanner title="Access denied" message={forbidden} /> : null}
      <SuspendReasonDialog
        open={!!suspendTargetId}
        onOpenChange={(open) => setSuspendTargetId(open ? suspendTargetId : null)}
        title="Suspend user"
        description={suspendTargetId ? `User ID: ${suspendTargetId}` : undefined}
        confirmLabel="Suspend"
        isLoading={actionLoading}
        onConfirm={async (reason) => {
          if (!suspendTargetId) return;
          await suspend(suspendTargetId, reason);
        }}
      />

      <ConfirmDialog
        open={!!unsuspendTargetId}
        onOpenChange={(open) => setUnsuspendTargetId(open ? unsuspendTargetId : null)}
        title="Unsuspend user"
        description={unsuspendTargetId ? `User ID: ${unsuspendTargetId}` : undefined}
        confirmLabel="Unsuspend"
        isLoading={actionLoading}
        onConfirm={async () => {
          if (!unsuspendTargetId) return;
          await unsuspend(unsuspendTargetId);
        }}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Search + suspend/unsuspend</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search username/email…"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Any status</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => q.refetch()} disabled={q.isLoading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <AdminTableSkeleton columns={7} rows={8} />
          ) : q.data ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.items.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.id}</TableCell>
                      <TableCell>{u.username ?? "—"}</TableCell>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell>{u.role ?? "—"}</TableCell>
                      <TableCell>{u.status ?? "—"}</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {String(u.status || "") === "suspended" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnsuspendTargetId(u.id)}
                            disabled={!hasPermission("users.restore")}
                            title={!hasPermission("users.restore") ? "Missing users.restore" : undefined}
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSuspendTargetId(u.id)}
                            disabled={!hasPermission("users.disable")}
                            title={!hasPermission("users.disable") ? "Missing users.disable" : undefined}
                          >
                            Suspend
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
