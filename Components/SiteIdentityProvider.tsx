"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SiteIdentity } from "@/lib/site-identity";

type SiteIdentityContextValue = {
  identity: SiteIdentity;
  setIdentity: (next: Partial<SiteIdentity>) => void;
};

const STORAGE_KEY = "site_identity_cache";
const EVENT_NAME = "site-identity-updated";

const SiteIdentityContext = createContext<SiteIdentityContextValue | null>(null);

function normalizeIdentity(input: Partial<SiteIdentity>, fallback: SiteIdentity): SiteIdentity {
  return {
    title: String(input.title ?? fallback.title).trim() || fallback.title,
    description: String(input.description ?? fallback.description).trim() || fallback.description,
    logo: String(input.logo ?? fallback.logo).trim() || fallback.logo,
  };
}

function readStoredIdentity(fallback: SiteIdentity): SiteIdentity {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SiteIdentity>;
    return normalizeIdentity(parsed, fallback);
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

  const current = readStoredIdentity({
    title: "",
    description: "",
    logo: "",
  });
  const nextIdentity = normalizeIdentity(identity, current);
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
  const [identity, setIdentityState] = useState<SiteIdentity>(() => initialIdentity);

  useEffect(() => {
    const stored = readStoredIdentity(initialIdentity);
    setIdentityState(stored);
    persistIdentity(stored);

    const handleIdentityUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<SiteIdentity>>;
      setIdentityState((current) => {
        const next = normalizeIdentity(customEvent.detail ?? {}, current);
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
      const merged = normalizeIdentity(next, current);
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
