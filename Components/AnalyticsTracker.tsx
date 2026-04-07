"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const currentPath = pathname || "/";
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: currentPath }),
      keepalive: true,
    }).catch(() => {
      // Ignore analytics errors on client.
    });
  }, [pathname]);

  return null;
}
