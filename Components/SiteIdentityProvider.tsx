"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SiteIdentity } from "@/lib/site-identity";
import { DEFAULT_SITE_ICON } from "@/lib/site-identity";
import { siteConfig } from "@/config/site";

type SiteIdentityContextValue = {
  identity: SiteIdentity;
  setIdentity: (next: Partial<SiteIdentity>) => void;
};

const STORAGE_KEY = "site_identity_cache";
const EVENT_NAME = "site-identity-updated";

const SiteIdentityContext = createContext<SiteIdentityContextValue | null>(null);

const DEFAULT_IDENTITY: SiteIdentity = {
  title: siteConfig.name,
  description: siteConfig.description,
  logo: DEFAULT_SITE_ICON,
};

function resolveField(
  incoming: string | null | undefined,
  current: string,
  fallback: string
): string {
  if (incoming !== undefined && incoming !== null) {
    const normalized = String(incoming).trim();
    return normalized || fallback;
  }

  const currentNormalized = String(current ?? "").trim();
  return currentNormalized || fallback;
}

function normalizeIdentity(input: Partial<SiteIdentity>, current: SiteIdentity, fallback: SiteIdentity): SiteIdentity {
  return {
    title: resolveField(input.title, current.title, fallback.title),
    description: resolveField(input.description, current.description, fallback.description),
    logo: resolveField(input.logo, current.logo, fallback.logo),
  };
}

function readStoredIdentity(fallback: SiteIdentity): SiteIdentity {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SiteIdentity>;
    return normalizeIdentity(parsed, fallback, fallback);
  } catch {
    return fallback;
  }
}

function persistIdentity(identity: SiteIdentity) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Ignore storage issues.
  }
}

export function pushSiteIdentityUpdate(identity: Partial<SiteIdentity>) {
  if (typeof window === "undefined") return;

  const current = readStoredIdentity(DEFAULT_IDENTITY);
  const nextIdentity = normalizeIdentity(identity, current, DEFAULT_IDENTITY);
  persistIdentity(nextIdentity);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: nextIdentity }));
}

export function SiteIdentityProvider({
  initialIdentity,
  children,
}: {
  initialIdentity: SiteIdentity;
  children: React.ReactNode;
}) {
  const [identity, setIdentityState] = useState<SiteIdentity>(() => readStoredIdentity(initialIdentity));

  useEffect(() => {
    persistIdentity(identity);
  }, [identity]);

  useEffect(() => {
    const handleIdentityUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<SiteIdentity>>;
      setIdentityState((current) => {
        const next = normalizeIdentity(customEvent.detail ?? {}, current, initialIdentity);
        persistIdentity(next);
        return next;
      });
    };

    window.addEventListener(EVENT_NAME, handleIdentityUpdate as EventListener);
    return () => {
      window.removeEventListener(EVENT_NAME, handleIdentityUpdate as EventListener);
    };
  }, [initialIdentity]);

  const setIdentity = useCallback((next: Partial<SiteIdentity>) => {
    setIdentityState((current) => {
      const merged = normalizeIdentity(next, current, DEFAULT_IDENTITY);
      persistIdentity(merged);
      return merged;
    });
  }, []);

  const value = useMemo<SiteIdentityContextValue>(
    () => ({
      identity,
      setIdentity,
    }),
    [identity, setIdentity]
  );

  return <SiteIdentityContext.Provider value={value}>{children}</SiteIdentityContext.Provider>;
}

export function useSiteIdentity() {
  const context = useContext(SiteIdentityContext);
  if (!context) {
    throw new Error("useSiteIdentity must be used within SiteIdentityProvider");
  }
  return context;
}
