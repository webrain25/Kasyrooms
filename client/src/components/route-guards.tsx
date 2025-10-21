import { ComponentType } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";

export function withAuth<P extends object>(Wrapped: ComponentType<P>): ComponentType<P> {
  function Guarded(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const [, navigate] = useLocation();

    if (isLoading) return null;
    if (!isAuthenticated) {
      navigate(`/login`);
      return null;
    }
    return <Wrapped {...(props as P)} />;
  }
  return Guarded;
}

export function withRole<P extends object>(roles: Array<'user'|'model'|'admin'>, Wrapped: ComponentType<P>): ComponentType<P> {
  function Guarded(props: P) {
    const { user, isLoading } = useAuth();
    const [, navigate] = useLocation();

    if (isLoading) return null;
    if (!user || !user.role || !roles.includes(user.role)) {
      navigate("/login");
      return null;
    }
    return <Wrapped {...(props as P)} />;
  }
  return Guarded;
}
