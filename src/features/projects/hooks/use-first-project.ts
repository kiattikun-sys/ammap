"use client";

import { useEffect, useState } from "react";
import { listProjects } from "@/domains/project/queries";

export function useFirstProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then((projects) => {
        if (projects.length > 0) setProjectId(projects[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  return { projectId, loading };
}
