import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFetchJson, AdminForbiddenError, AdminUnauthorizedError } from "@/lib/adminFetch";
import AdminErrorBanner from "@/pages/admin/components/AdminErrorBanner";
import { AdminLinesSkeleton, AdminTableSkeleton } from "@/pages/admin/components/AdminSkeletons";

type SirplayHealth = {
  ok: boolean;
  baseUrl?: string;
  expiresAtMs?: number;
  hasRefreshToken?: boolean;
  tokenPreview?: string | null;
  error?: string;
  message?: string;
};

type SirplayMappings = {
  page: number;
  limit: number;
  items: Array<{
    id: string;
    email: string | null;
    externalProvider: string | null;
    externalUserId: string | null;
    role: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
};

export default function AdminSirplayPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [forbidden, setForbidden] = useState<string | null>(null);

  const mappingsUrl = useMemo(() => {
    const u = new URL("/api/admin/sirplay/mappings", window.location.origin);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", "25");
    if (query.trim()) u.searchParams.set("query", query.trim());
    return u.pathname + u.search;
  }, [page, query]);

  const health = useQuery({
    queryKey: ["admin_sirplay_health"],
    queryFn: () => adminFetchJson<SirplayHealth>("/api/admin/sirplay/health"),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const mappings = useQuery({
    queryKey: ["admin_sirplay_mappings", mappingsUrl],
    queryFn: () => adminFetchJson<SirplayMappings>(mappingsUrl),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    const err = health.error ?? mappings.error;
    if (!err) return;
    if (err instanceof AdminUnauthorizedError) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (err instanceof AdminForbiddenError) {
      setForbidden(err.missing ? `Missing permission: ${err.missing}` : "Forbidden");
    }
  }, [health.error, mappings.error, navigate]);

  return (
    <div className="space-y-4">
      {forbidden ? <AdminErrorBanner title="Access denied" message={forbidden} /> : null}
      <div>
        <h1 className="text-2xl font-semibold">Sirplay</h1>
        <p className="text-sm text-muted-foreground">Diagnostics (read-only)</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {health.isLoading ? (
            <AdminLinesSkeleton lines={5} />
          ) : health.data ? (
            <div className="text-sm">
              <div>
                <span className="text-muted-foreground">ok:</span> {String(health.data.ok)}
              </div>
              {health.data.baseUrl && (
                <div>
                  <span className="text-muted-foreground">baseUrl:</span> {health.data.baseUrl}
                </div>
              )}
              {typeof health.data.expiresAtMs === "number" && (
                <div>
                  <span className="text-muted-foreground">expires:</span> {new Date(health.data.expiresAtMs).toLocaleString()}
                </div>
              )}
              {typeof health.data.hasRefreshToken === "boolean" && (
                <div>
                  <span className="text-muted-foreground">refreshToken:</span> {health.data.hasRefreshToken ? "yes" : "no"}
                </div>
              )}
              {health.data.tokenPreview !== undefined && (
                <div>
                  <span className="text-muted-foreground">token:</span> {health.data.tokenPreview ?? "—"}
                </div>
              )}
              {health.data.message && (
                <div className="text-muted-foreground">{health.data.message}</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data.</div>
          )}

          <Button variant="outline" size="sm" onClick={() => health.refetch()} disabled={health.isLoading}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Mappings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Search email or externalUserId…"
            />
            <Button variant="outline" onClick={() => mappings.refetch()} disabled={mappings.isLoading}>
              Refresh
            </Button>
          </div>

          {mappings.isLoading ? (
            <AdminTableSkeleton columns={5} rows={8} />
          ) : mappings.data ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>External user</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.data.items.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.id}</TableCell>
                      <TableCell>{m.email ?? "—"}</TableCell>
                      <TableCell>{m.externalProvider ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{m.externalUserId ?? "—"}</TableCell>
                      <TableCell>{m.role ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">Page {mappings.data.page}</div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || mappings.isLoading}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={mappings.isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No mappings.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
