"use client";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { PageShell } from "./page-shell";

interface AppShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AppShell({ title, description, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} description={description} onMenuClick={() => setOpen(true)} />
        <PageShell>{children}</PageShell>
      </div>
    </div>
  );
}
