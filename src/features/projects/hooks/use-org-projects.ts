"use client";

import { useEffect, useState } from "react";
import { listProjects } from "@/domains/project/queries";

export function useOrgProjects() {
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then((projects) => setProjectIds(projects.map((p) => p.id)))
      .finally(() => setLoading(false));
  }, []);

  return { projectIds, loading };
}
