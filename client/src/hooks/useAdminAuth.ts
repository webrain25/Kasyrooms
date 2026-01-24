import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { AdminForbiddenError } from "@/lib/adminFetch";

export type AdminMe = {
  admin: {
    id: string;
    role: string;
    username?: string;
    email?: string;
    permissions: string[];
  };
};

async function fetchAdminMe(): Promise<AdminMe | null> {
  const res = await fetch("/api/admin/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let parsed: any = undefined;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
    if (res.status === 403) {
      throw new AdminForbiddenError({
        details: parsed ?? text,
        message: typeof parsed?.reason === "string" ? parsed.reason : "forbidden",
      });
    }
    throw new Error(`${res.status}: ${text}`);
  }
  return (await res.json()) as AdminMe;
}

export function useAdminAuth(options?: { redirectToLogin?: boolean }) {
  const redirectToLogin = options?.redirectToLogin ?? false;
  const [, navigate] = useLocation();

  const query = useQuery({
    queryKey: ["admin_me"],
    queryFn: fetchAdminMe,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const admin = query.data?.admin ?? null;

  const hasPermission = (permission: string) => {
    if (!admin) return false;
    return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
  };

  useEffect(() => {
    if (!redirectToLogin) return;
    if (query.isLoading) return;
    if (!admin) navigate("/admin/login", { replace: true });
  }, [admin, navigate, query.isLoading, redirectToLogin]);

  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Clear all admin-related cached queries (admin_* plus the admin_me identity)
      queryClient.removeQueries({
        predicate: (q) => {
          const k = q.queryKey;
          if (!Array.isArray(k) || k.length === 0) return false;
          const first = k[0];
          if (first === "admin_me") return true;
          return typeof first === "string" && first.startsWith("admin_");
        },
      });
      navigate("/admin/login", { replace: true });
    }
  };

  return {
    admin,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isAuthenticated: !!admin,
    refetch: query.refetch,
    logout,
    hasPermission,
  };
}
