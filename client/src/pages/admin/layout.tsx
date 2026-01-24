import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  onLogout: () => void;
  admin: {
    id: string;
    role: string;
    username?: string;
    email?: string;
  };
};

function NavLink({ href, label }: { href: string; label: string }) {
  const [loc] = useLocation();
  const active = loc === href || (href !== "/admin" && loc.startsWith(href));
  return (
    <Link href={href} className={active ? "font-medium" : "text-muted-foreground"}>
      {label}
    </Link>
  );
}

export default function AdminLayout({ children, onLogout, admin }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="font-semibold">Kasyrooms Admin</div>
            <div className="text-xs text-muted-foreground">
              {admin.email || admin.username || admin.id} · {admin.role}
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-3">
          <div className="rounded-lg border p-4 space-y-2">
            <NavLink href="/admin" label="Overview" />
            <div />
            <NavLink href="/admin/users" label="Users" />
            <NavLink href="/admin/models" label="Models" />
            <NavLink href="/admin/reports" label="Reports" />
            <NavLink href="/admin/audit" label="Audit" />
            <div className="pt-2" />
            <NavLink href="/admin/sirplay" label="Sirplay" />
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
