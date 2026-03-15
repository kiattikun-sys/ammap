"use client";

import { useEffect, useState } from "react";
import { listOrgProfiles, type OrgProfile } from "../queries/list-org-profiles";

export function useOrgProfiles() {
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrgProfiles()
      .then((list) => {
        const map = new Map<string, string>();
        for (const p of list) {
          map.set(p.id, p.displayName);
        }
        setProfiles(map);
      })
      .finally(() => setLoading(false));
  }, []);

  function resolveAssignee(assignedTo: string | null): string {
    if (!assignedTo) return "Unassigned";
    return profiles.get(assignedTo) ?? "Unknown user";
  }

  return { profiles, resolveAssignee, loading };
}
