"use client";

import { useMe } from "@/hooks/use-auth";
import { resources } from "@/resources";
import { StatsCard } from "@/components/widgets/stats-card";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { getIcon } from "@/lib/icons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();

  // Redirect USER role to their dashboard
  useEffect(() => {
    if (!isLoading && user && user.role === "USER") {
      router.push("/board");
    }
  }, [user, isLoading, router]);

  // Show admin dashboard only for ADMIN role
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return null;
  }

  const allWidgets = resources.flatMap((r) => r.dashboard?.widgets ?? []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-accent/10 via-bg-secondary to-bg-secondary p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.first_name || "Admin"}
        </h1>
        <p className="text-text-secondary mt-1">
          Monitor and manage the Desis-Keep platform.
        </p>
      </div>

      {/* Stats widgets */}
      {allWidgets.length > 0 ? (
        <WidgetGrid widgets={allWidgets} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total Resources" value="—" icon="Database" color="accent" />
          <StatsCard label="Registered" value={String(resources.length)} icon="Layers" color="success" />
        </div>
      )}

      {/* Admin Management + System Tools */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin Resources */}
        <div className="rounded-xl border border-border bg-bg-secondary p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Admin Management</h2>
          <div className="space-y-3">
            <a
              href="/resources/users"
              className="flex items-center gap-4 rounded-lg border border-border bg-bg-tertiary p-4 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <span className="text-accent text-lg font-bold">👥</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">Users</h3>
                <p className="text-xs text-text-muted">Manage all users</p>
              </div>
            </a>
            <a
              href="/resources/blogs"
              className="flex items-center gap-4 rounded-lg border border-border bg-bg-tertiary p-4 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <span className="text-accent text-lg font-bold">📝</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">Blogs</h3>
                <p className="text-xs text-text-muted">Manage blog posts</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Tools */}
        <div className="rounded-xl border border-border bg-bg-secondary p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">System Tools</h2>
          <div className="space-y-2">
            <a
              href="http://localhost:8080/studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary px-4 py-3 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-info/10">
                <span className="text-info text-sm font-bold">DB</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">GORM Studio</p>
                <p className="text-xs text-text-muted">Browse database</p>
              </div>
            </a>
            <a
              href="http://localhost:8080/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary px-4 py-3 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success/10">
                <span className="text-success text-sm font-bold">OK</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">API Health</p>
                <p className="text-xs text-text-muted">Check status</p>
              </div>
            </a>
            <a
              href="/system/jobs"
              className="flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary px-4 py-3 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10">
                <span className="text-warning text-sm font-bold">Q</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">Job Queue</p>
                <p className="text-xs text-text-muted">Background jobs</p>
              </div>
            </a>
            <a
              href="/system/files"
              className="flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary px-4 py-3 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <span className="text-accent text-sm font-bold">S3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">File Storage</p>
                <p className="text-xs text-text-muted">Manage uploads</p>
              </div>
            </a>
            <a
              href="/system/security"
              className="flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary px-4 py-3 hover:border-accent/30 hover:bg-bg-hover transition-all group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-danger/10">
                <span className="text-danger text-sm font-bold">🔒</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">Security</p>
                <p className="text-xs text-text-muted">Security settings</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="rounded-xl border border-border bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Platform Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {resources.filter(r => ['labels', 'notes', 'links', 'images', 'files'].includes(r.slug)).map((r) => {
            const Icon = getIcon(r.icon);
            return (
              <div
                key={r.slug}
                className="rounded-lg border border-border bg-bg-tertiary p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-accent" />
                  <p className="text-xs font-medium text-text-muted">{r.label?.plural ?? r.name}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-text-muted mt-1">Total items</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
