# AMMAP Owner Phase Review Checklist

> Use this checklist every time Claude returns a Phase report.
> Score each section independently. Block progression if any section scores below threshold.

---

## How to Use

After each Phase report is delivered:
1. Read the report fully.
2. Score each of the 5 sections below.
3. If **any Critical item is unresolved**, request re-execution before proceeding.
4. Sign off with your review date and proceed to the next phase.

---

## 1️⃣ Structural Validity

*Does the report follow the required format and cover all required items?*

| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Report contains all required sections for this phase | ☐ | ☐ | |
| Each persona / scenario / table entry is present | ☐ | ☐ | |
| No section is marked "N/A" without explanation | ☐ | ☐ | |
| Tables are complete — no missing cells or placeholder text | ☐ | ☐ | |
| Findings are numbered and prioritized | ☐ | ☐ | |
| Report stops cleanly at this phase — does not skip ahead | ☐ | ☐ | |

**Section Result:** ☐ PASS &nbsp;&nbsp; ☐ FAIL

---

## 2️⃣ Evidence Quality

*Is every claim backed by real code, query result, or observable UI behavior?*

| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Every "PASS" or "FAIL" verdict cites a source (file path, SQL result, or UI observation) | ☐ | ☐ | |
| No invented behavior — if a feature is absent, it is reported as absent | ☐ | ☐ | |
| DB query results are shown (row counts, column values) not assumed | ☐ | ☐ | |
| Code inspection references include file path and relevant line range | ☐ | ☐ | |
| Mock vs real behavior is clearly distinguished (e.g., `createProgressRecord` is mock-only) | ☐ | ☐ | |
| Any unverifiable item is flagged as "unverified" rather than assumed passing | ☐ | ☐ | |

**Section Result:** ☐ PASS &nbsp;&nbsp; ☐ FAIL

---

## 3️⃣ Behavioral Realism

*Would a real construction professional find this behavior believable and correct?*

| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Each persona sees exactly what their role demands — no more, no less | ☐ | ☐ | |
| Write operations are gated to the correct roles (engineer ≠ viewer ≠ owner) | ☐ | ☐ | |
| Workflow handoffs between roles are correctly represented (PM → Engineer → QA) | ☐ | ☐ | |
| Defect lifecycle transitions follow correct order (open → in_progress → pending_reinspection → closed) | ☐ | ☐ | |
| Timeline events are produced by the correct trigger actions | ☐ | ☐ | |
| No role can perform an action beyond their operational mandate | ☐ | ☐ | |

**Section Result:** ☐ PASS &nbsp;&nbsp; ☐ FAIL

---

## 4️⃣ Security Correctness

*Are all tenant boundaries and permission controls properly enforced?*

| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| No data from Organization A is visible to Organization B | ☐ | ☐ | |
| RLS policies confirmed active — no policy bypass observed | ☐ | ☐ | |
| Direct URL access to another org's project returns no data | ☐ | ☐ | |
| viewer role cannot INSERT / UPDATE / DELETE (or this gap is reported as Critical) | ☐ | ☐ | |
| `createProject` is role-gated to owner/admin (or this gap is reported as Critical) | ☐ | ☐ | |
| Storage bucket `evidence-files` enforces project-scoped access | ☐ | ☐ | |
| Silent failure rule respected — if RLS blocks silently, it is logged as a bug | ☐ | ☐ | |

**Section Result:** ☐ PASS &nbsp;&nbsp; ☐ FAIL

---

## 5️⃣ Product Insight

*Does the report surface actionable intelligence about the product?*

| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Missing features are identified with clear description | ☐ | ☐ | |
| Gaps are prioritized: Critical / High / Medium / Low | ☐ | ☐ | |
| At least one unexpected finding is surfaced (not just confirming what was already known) | ☐ | ☐ | |
| Recommendations are concrete and actionable (not vague) | ☐ | ☐ | |
| Root cause is identified — not just the symptom | ☐ | ☐ | |
| Report distinguishes between: "works correctly", "works but wrong", "does not exist" | ☐ | ☐ | |

**Section Result:** ☐ PASS &nbsp;&nbsp; ☐ FAIL

---

## Overall Review Decision

| Section | Result |
|---------|--------|
| 1. Structural Validity | ☐ PASS / ☐ FAIL |
| 2. Evidence Quality | ☐ PASS / ☐ FAIL |
| 3. Behavioral Realism | ☐ PASS / ☐ FAIL |
| 4. Security Correctness | ☐ PASS / ☐ FAIL |
| 5. Product Insight | ☐ PASS / ☐ FAIL |

**Decision:**
- ☐ **APPROVE** — All 5 sections pass. Proceed to next phase.
- ☐ **CONDITIONAL APPROVE** — Minor gaps noted. Proceed but carry findings forward.
- ☐ **REJECT** — One or more Critical items unresolved. Re-execute phase before proceeding.

**Reviewed by:** ___________________  
**Date:** ___________________  
**Phase reviewed:** ___________________

---

## Quick Reference — Phase-Specific Expectations

| Phase | Primary Evidence Expected |
|-------|--------------------------|
| Phase 0 | Route table, service/action inventory, RLS boundary map |
| Phase 1 | DB query output for each persona's project access, domain record counts |
| Phase 2 | Per-role operation attempt results — success/failure with source evidence |
| Phase 3 | Step-by-step workflow execution log, DB state before/after each scenario |
| Phase 4 | Cross-org DB query results, direct URL test outcomes |
| Phase 5 | Orphan check query results with row counts, FK integrity verification |
| Phase 6 | Per-persona scored table with justification for each dimension |
| Phase 7 | Prioritized gap list with root cause and recommendation per item |

---

## Critical Blocking Issues (Auto-Reject)

Any of the following findings must block phase approval regardless of other scores:

1. **CRITICAL SECURITY FAILURE** — cross-org data visible to wrong tenant
2. **RLS disabled** on any production table
3. **Data was deleted** from existing bootstrap records
4. **Schema was modified** during simulation
5. **Mock behavior reported as real** — e.g. `createProgressRecord` result treated as a DB write
6. **Blank or placeholder sections** in the phase report
