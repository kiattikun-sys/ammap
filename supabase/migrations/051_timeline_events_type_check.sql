-- ================================================================
-- 051_timeline_events_type_check
-- Expand timeline_events.type CHECK constraint to match all values
-- used in the codebase (createTimelineEventSchema).
-- Old constraint only had 5 values; code uses 15.
-- ================================================================

ALTER TABLE public.timeline_events
  DROP CONSTRAINT IF EXISTS timeline_events_type_check;

ALTER TABLE public.timeline_events
  ADD CONSTRAINT timeline_events_type_check
    CHECK (type IN (
      'construction_start',
      'inspection',
      'inspection_scheduled',
      'inspection_completed',
      'defect_created',
      'defect_resolved',
      'corrective_action_created',
      'corrective_action_completed',
      'work_item_created',
      'work_item_started',
      'work_item_blocked',
      'work_item_completed',
      'progress_updated',
      'evidence_uploaded',
      'milestone'
    ));
