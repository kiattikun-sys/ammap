"use client";

import { useEffect, useState, useCallback } from "react";
import { listTimelineEvents } from "@/domains/timeline/queries/list-timeline-events";
import { listProgressRecords } from "@/domains/timeline/queries/list-progress-records";
import type { TimelineEvent } from "@/domains/timeline/model/timeline-event";
import type { ProgressRecord } from "@/domains/timeline/model/progress-record";

interface TimelineControllerProps {
  projectId: string;
  onTimestampFilterChange?: (timestamp: Date | null) => void;
}

export function TimelineController({
  projectId,
  onTimestampFilterChange,
}: TimelineControllerProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [activeTimestamp, setActiveTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    listTimelineEvents({ projectId }).then(setEvents);
    listProgressRecords({ projectId }).then(setProgressRecords);
  }, [projectId]);

  const setFilter = useCallback(
    (timestamp: Date | null) => {
      setActiveTimestamp(timestamp);
      onTimestampFilterChange?.(timestamp);
    },
    [onTimestampFilterChange]
  );

  const clearFilter = useCallback(() => {
    setFilter(null);
  }, [setFilter]);

  useEffect(() => {
    if (events.length === 0) return;
    console.log(
      "[TimelineController] Loaded",
      events.length,
      "events,",
      progressRecords.length,
      "progress records"
    );
  }, [events, progressRecords]);

  useEffect(() => {
    if (activeTimestamp) {
      const filtered = events.filter(
        (e) => e.timestamp <= activeTimestamp
      );
      console.log(
        "[TimelineController] Filter active at",
        activeTimestamp.toISOString(),
        "— visible events:",
        filtered.length
      );
    }
  }, [activeTimestamp, events]);

  // Expose filter API on window for dev/testing convenience
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    w.__timelineSetFilter = setFilter;
    w.__timelineClearFilter = clearFilter;
    return () => {
      delete w.__timelineSetFilter;
      delete w.__timelineClearFilter;
    };
  }, [setFilter, clearFilter]);

  return null;
}
