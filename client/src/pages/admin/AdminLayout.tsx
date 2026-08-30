import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Star,
  Megaphone,
  Zap,
  Settings,
  ScrollText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import "./admin.css";

interface AdminUser {
  username: string;
  displayName: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: string;
  requireAuth?: boolean;
}

const NAV_ITEMS = [
  { path: "/admin/overview",     label: "Overview",     icon: LayoutDashboard },
  { path: "/admin/applications", label: "Applications", icon: Users },
  { path: "/admin/analytics",    label: "Analytics",    icon: BarChart3 },
  { path: "/admin/talent",       label: "Talent",       icon: Star },
  { path: "/admin/acquisition",  label: "Acquisition",  icon: Megaphone },
  { path: "/admin/skills",       label: "Skills",       icon: Zap },
];

const BOTTOM_NAV = [
  { path: "/admin/audit",    label: "Audit Log", icon: ScrollText },
  { path: "/admin/settings", label: "Settings",  icon: Settings },
];

export function useAdminAuth() {
  const me = trpc.admin.me.useQuery(undefined, { retry: false });
  return {
    admin: me.data ?? null,
    loading: me.isLoading,
    refetch: me.refetch,
  };
}

export default function AdminLayout({ children, title, breadcrumb, requireAuth = true }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { admin, loading } = useAdminAuth();
  const utils = trpc.useUtils();
  const logout = trpc.admin.logout.useMutation({
    onSuccess: async () => {
      await utils.admin.me.invalidate();
      setLocation("/admin/login");
    },
  });

  useEffect(() => {
    if (!loading && requireAuth && !admin) {
      setLocation("/admin/login");
    }
  }, [admin, loading, requireAuth, setLocation]);

  if (loading && requireAuth) {
    return (
      <div className="admin-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⊙</div>
          Verifying session…
        </div>
      </div>
    );
  }

  if (requireAuth && !admin) {
    return null; // redirect handled by useEffect
  }

  const activeSection = NAV_ITEMS.find((n) => location === n.path) ??
    BOTTOM_NAV.find((n) => location === n.path);

  return (
    <div className="admin-root">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-brand">VVLF</div>
            <div className="admin-sidebar-title">Admin</div>
          </div>

          <nav className="admin-nav">
            <div className="admin-nav-section">
              <div className="admin-nav-section-label">Main</div>
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  className={`admin-nav-item ${location === path ? "active" : ""}`}
                  onClick={() => setLocation(path)}
                  title={label}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="admin-nav-divider" />

            <div className="admin-nav-section">
              {BOTTOM_NAV.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  className={`admin-nav-item ${location === path ? "active" : ""}`}
                  onClick={() => setLocation(path)}
                  title={label}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="admin-sidebar-footer">
            {admin && (
              <div className="admin-user-badge">
                <div className="admin-user-avatar">
                  {(admin.displayName || admin.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="admin-user-info">
                  <div className="admin-user-name">{admin.displayName || admin.username}</div>
                  <div className="admin-user-role">{admin.role}</div>
                </div>
              </div>
            )}
            <button
              className="admin-nav-item"
              style={{ marginTop: 8, color: "#dc2626" }}
              onClick={() => logout.mutate()}
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="admin-main">
          {/* Top bar */}
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <div className="admin-breadcrumb">
                <span>VVLF Admin</span>
                {(breadcrumb ?? activeSection?.label) && (
                  <>
                    <ChevronRight size={14} />
                    <strong>{breadcrumb ?? activeSection?.label}</strong>
                  </>
                )}
              </div>
            </div>
            <div className="admin-topbar-right">
              {admin && (
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {admin.displayName || admin.username}
                </span>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="admin-content">
            {title && (
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {title}
                </h1>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
