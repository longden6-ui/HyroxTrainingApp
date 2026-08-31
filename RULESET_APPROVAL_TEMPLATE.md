# HYROX Coach AI - Professional Ruleset Approval Form

**Document Version:** 1.0  
**Date Prepared:** 2026-08-31  
**Valid From:** [Approval Date]  
**Valid Until:** [Expiration Date, typically 12 months from approval]

---

## Executive Summary

This document requests professional approval of the guardrail rules, phase structure, and safety mechanisms embedded in the HYROX Coach AI training plan generator. The system is designed to personalize 6-phase training plans for HYROX competition preparation while enforcing safety constraints at the data layer.

**Scope:** This approval covers only the training methodologies and constraints defined below. It does NOT constitute medical advice or diagnosis and does not override individual medical clearance.

---

## Section 1: Professional Approver Identity

| Field | Value |
|-------|-------|
| **Full Name** | ________________________________ |
| **Professional Credential** | ________________________________ |
| **License/Cert #** | ________________________________ |
| **Issuing Body** | ________________________________ |
| **Years of Experience** | ________________________________ |
| **Specialty** | [ ] Sports Medicine [ ] Athletic Training [ ] Exercise Physiology [ ] HYROX Coaching [ ] Other: _______ |
| **Organization** | ________________________________ |
| **Contact Email** | ________________________________ |
| **Contact Phone** | ________________________________ |

---

## Section 2: The 7 Hard Guardrails

Each constraint below must be reviewed and approved individually. If any constraint is disapproved or requires modification, note it in Section 6.

### Guardrail 1: No Post-Race-Date Sessions
**Rule:** Training sessions must never be scheduled on or after the athlete's HYROX competition date.

**Implementation:** The system refuses to generate plans with sessions after `competitionDate`. This is a hard database constraint enforced at the data layer.

**Technical Details:**
- Session scheduling calculates backwards from race date
- Taper phase ends on race date (no workload)
- Latest session = race date - 1 day

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

### Guardrail 2: Progression Caps by Phase
**Rule:** Week-to-week workload increases are capped by training phase to prevent injury from rapid escalation.

**Constraints:**
| Phase | Max Weekly Increase | Rationale |
|-------|-------------------|-----------|
| Foundation (Weeks 1-4) | 5% | Build aerobic base safely |
| Development (Weeks 5-8) | 8% | Introduce intensity gradually |
| Race-Specific (Weeks 9-12) | 10% | Sport-specific adaptations |
| Peak (Weeks 13-15) | 5% | Reduce injury risk before taper |
| Taper (Weeks 16-17) | -40% to -60% | Recovery and system supercompensation |
| Recovery (Week 18+) | 0% to 3% | Return to base training |

**Implementation:**
- Checked at plan-generation time
- Recalculation blocked if projected week exceeds cap
- Non-material changes (minor tweaks) don't trigger recalculation

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

### Guardrail 3: Minimum Recovery Days per Week
**Rule:** Athletes must have at least minimal recovery (no training) depending on phase.

**Constraints:**
| Phase | Min Recovery Days/Week |
|-------|----------------------|
| Foundation | 1 day minimum (usually 1-2) |
| Development | 0-1 day minimum |
| Race-Specific | 0 days minimum (optional rest days) |
| Peak | 0 days minimum |
| Taper | 1 day minimum (mandatory active recovery) |
| Recovery | 2+ days minimum |

**Implementation:**
- Allocation algorithm respects availability windows
- Never schedules 7 days in a row
- Taper forces at least one rest day

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

### Guardrail 4: Equipment Safety Filtering
**Rule:** Session equipment substitutions are only safe for certain station types. Non-negotiable equipment remains locked.

**Constraints:**
| Equipment | Substitutable? | Notes |
|-----------|----------------|-------|
| SkiErg | No | Competition equipment, no substitutes |
| Rowing Machine | Yes | Assault bike or kayak acceptable |
| Wall Balls | Yes | Sandbag or medicine ball acceptable |
| Rope Climb | No | Sport-specific, no safe substitute |
| Sled Push/Pull | Yes | If athlete has access (occupational load gated) |
| Burpee Broad Jump | No | Plyometric timing critical |
| Tire Flip | Yes | Heavy kettlebell acceptable |
| Ladder | Yes | Cones or hurdles acceptable |

**Implementation:**
- Equipment restrictions are hard-coded in Prisma schema
- Athlete's equipment access tracked in occupational load check
- Substitution only offered if athlete has declared access

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

### Guardrail 5: Occupational Load Never Exceeded
**Rule:** No session can cause total weekly workload to exceed athlete's declared availability.

**Constraints:**
- Session duration must fit within available hours that day
- Total weekly hours cannot exceed athlete's stated capacity
- Hourly intensity cap prevents fatigue accumulation

**Implementation:**
- Checked during allocation (before sessions are created)
- Recalculation refuses to add sessions exceeding capacity
- Audit trail records every capacity check

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

### Guardrail 6: No Workload Stacking (No Missed Sessions Re-added)
**Rule:** If an athlete misses a session, that workload is NOT re-added to future weeks. This prevents cascading fatigue and burnout.

**Constraints:**
- Missed sessions are marked with `purpose: 'SKIPPED'` permanently
- Future plan recalculations don't attempt to "catch up"
- Plan continues from current state without backfilling

**Implementation:**
- Data-layer immutability: once a session is locked/completed, it cannot be modified
- Recalculation respects session history as-is
- Test: missed sessions in week 4 don't increase week 5 volume

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

### Guardrail 7: Safety Pause Mechanism (Red Flags)
**Rule:** If an athlete reports specific health markers, plan generation pauses and prompts professional intervention.

**Red-Flag Thresholds:**
| Trigger | Threshold | Action |
|---------|-----------|--------|
| **Pain + Limited Mobility** | Both reported in same check-in | PAUSED_FOR_SAFETY; show professional help link |
| **Repeated Pain Reports** | 3+ pain reports in 7 days | PAUSED_FOR_SAFETY; suggest medical review |
| **Occupational Conflict** | Work hours exceed capacity | PAUSED_FOR_SAFETY; ask for calendar update |
| **Guardrail Violation Detected** | Any hard constraint fails | PAUSED_FOR_SAFETY; show constraint details |

**Implementation:**
- Check runs before every plan recalculation
- Status immediately set to `PAUSED_FOR_SAFETY`
- Athlete cannot resume plan without explicit clearance flow
- No silent downgrading (Red-flag safety response [FR-G10])

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

## Section 3: Training Phase Structure

**Total Program Horizon:** 77 days minimum (11 weeks)  
**Phases:** 6 sequential phases, no phase skipping

| Phase | Duration | Goal | Key Constraint |
|-------|----------|------|-----------------|
| **Foundation** | Weeks 1-4 (28 days) | Aerobic base & movement quality | 5% weekly increase cap |
| **Development** | Weeks 5-8 (28 days) | Work capacity & tempo | 8% weekly increase cap |
| **Race-Specific** | Weeks 9-12 (28 days) | Sport-specific adaptations | 10% weekly increase cap |
| **Peak** | Weeks 13-15 (21 days) | Race-pace simulation | 5% weekly increase cap |
| **Taper** | Weeks 16-17 (14 days) | Reduce volume 40-60% | Mandatory recovery days |
| **Recovery** | Week 18+ | Return to base | 0-3% increase |

**Phase Allocation Logic:**
- Athlete provides availability hours per day and target race date
- System calculates total horizon (race date - today)
- If < 77 days: system refuses to generate (insufficient time)
- If >= 77 days: allocates proportionally across phases

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

## Section 4: Station Emphasis Distribution

**Principle:** Station selection balances strength, aerobic capacity, and race-specific skill development.

**Distribution Ratios (when athlete ranks 3 stations):**
- **Station 1 (Ranked Hardest):** 50% of total sessions
- **Station 2 (Ranked Medium):** 30% of total sessions
- **Station 3 (Ranked Easiest):** 15% of total sessions
- **Cross-training / Recovery:** 5% of total sessions

**Rationale:**
- Focuses volume on weakest link (station 1)
- Maintains development of secondary weakness (station 2)
- Preserves strength in strong station (station 3)
- Cross-training prevents single-station overuse

**Example:** 100 total sessions
- Station 1: 50 sessions
- Station 2: 30 sessions
- Station 3: 15 sessions
- Cross-training: 5 sessions

**Approved:** [ ] Yes [ ] No [ ] With modifications (see Section 6)

---

## Section 5: System Safety Checks

### 5.1 Approval Gate (Constraint 4)
Plan generation will **REFUSE** to run if:
- RuleSet status is not `APPROVED` (approvedAt = null)
- EventStandardSet status is not `APPROVED`

This gate is non-bypassable at the application layer.

### 5.2 Immutability (FR-A02)
Once a session is locked (athlete completed it), it cannot be:
- Deleted
- Rescheduled
- Modified in duration, intensity, or equipment

Only metadata (notes, rationale) can be updated.

### 5.3 Audit Trail
Every approval, plan generation, safety trigger, and recalculation is logged with:
- Timestamp
- User/system action
- RuleSet version applied
- Reason (if guardrail violation)

### 5.4 Version Control
This RuleSet is **Version 1.0**. Any future modifications require:
- Re-approval by the accountable professional
- New version number
- Effective date
- Transition plan for in-flight plans

**Approved:** [ ] Yes [ ] No

---

## Section 6: Modifications & Objections

If you disapprove any guardrail or propose modifications, document them below:

### Guardrail 1 (No Post-Race Sessions)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Guardrail 2 (Progression Caps)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Guardrail 3 (Recovery Days)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Guardrail 4 (Equipment Filtering)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Guardrail 5 (Occupational Load)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Guardrail 6 (No Workload Stacking)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Guardrail 7 (Safety Pause)
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

### Phase Structure / Distribution Ratios
**Status:** [ ] Approve [ ] Reject [ ] Modify  
**Proposed Change:** _______________________________________________  
**Rationale:** ___________________________________________________

---

## Section 7: Legal & Liability Acknowledgment

By approving this RuleSet, the accountable professional acknowledges:

1. **Not Medical Advice:** This system is a training plan generator, not a diagnostic or medical device. It does not replace individual medical consultation.

2. **Scope:** This approval covers the listed guardrails and phase structure for HYROX-specific training preparation only. It does not authorize use for other sports or populations without additional review.

3. **Safety Responsibility:** The professional approving these rules accepts responsibility for the methodology embedded in the guardrails. Individual athlete clearance and monitoring remain the responsibility of their personal healthcare provider.

4. **Red-Flag Mechanism:** The safety pause mechanism is designed to escalate concerns, not diagnose or treat. Athletes must still seek professional guidance for health issues.

5. **Version Binding:** This approval is valid only for RuleSet Version 1.0. Any modifications require re-approval.

6. **Audit Trail Consent:** The professional consents to having their name and approval timestamp recorded in the system and provided in user-facing audit trails.

**I acknowledge and accept the scope and limitations listed above:**

Approver Signature: ________________________________  
Date: ________________________________  
Printed Name: ________________________________

---

## Section 8: Deployment Checklist (Post-Approval)

Once approved, the product team should:

- [ ] Create RuleSet record in database with `approvedBy: "[Professional Name]"` and `approvedAt: [timestamp]`
- [ ] Create EventStandardSet with `approvedAt: [timestamp]`
- [ ] Log approval event to audit trail
- [ ] Store signed (or scanned) approval form in version control (`/docs/approvals/RULESET_1.0_APPROVAL.pdf`)
- [ ] Add link to approval in `APPROVALS.md` file
- [ ] Enable Phase 3 (Plan Engine) endpoints in production
- [ ] Create professional contact method for escalations (email, phone, support ticket system)
- [ ] Set calendar reminder for approval expiration (typically 12 months out)

---

## Section 9: Contact & Escalation

**For Questions During Review:**  
Product Lead: [Name, Email, Phone]

**For Safety Escalations (Post-Deployment):**  
Professional Review Channel: [Email, Ticket System, Phone]

**For RuleSet Version Updates:**  
Submit change request with rationale to: [Email]

---

**End of Approval Form**

---

### How to Use This Template

1. **Print or Email:** Send this form (printed or PDF) to the accountable professional
2. **Review Meeting:** Discuss each guardrail; invite questions
3. **Signature:** Get signed approval (or email confirmation if digital workflow)
4. **Database Update:** Record approval details in the system
5. **Keep File:** Store signed form for compliance and audit trail
6. **Communicate:** Notify product team that Phase 3 is cleared to deploy

### If Professional Requests Changes

1. Agree on modifications to the guardrail
2. Update the CLAUDE.md file and code comments with new thresholds
3. Re-test affected constraints (e.g., if progression cap changes from 5% to 6%)
4. Resubmit updated form for re-approval
5. Only deploy with approved thresholds

