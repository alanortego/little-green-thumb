<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0
- Modified principles: N/A (initial ratification, template placeholders replaced)
- Added sections: Code Quality, Elementary Child Focus, User Experience Consistency,
  Performance Requirements (Core Principles I-IV); Additional Constraints;
  Development Workflow
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (generic Constitution Check gate, no changes needed)
  - .specify/templates/spec-template.md ✅ (no principle-specific references)
  - .specify/templates/tasks-template.md ✅ (no principle-specific references)
  - .github/copilot-instructions.md ⚠ pending (recommend adding a link to this constitution)
- Follow-up TODOs: none
-->

# Little Green Thumb Constitution

## Core Principles

### I. Code Quality
All code MUST be readable, tested, and reviewed before merge. Every
non-trivial change (branches, loops, parsers, or data-persistence paths)
MUST ship with at least one runnable check (unit test or assertion-based
self-check) that fails if the logic breaks. Linters and formatters
configured for the project MUST pass with no suppressed warnings unless
justified inline. Prefer the simplest correct implementation: no
speculative abstractions, no unused configuration, no dependencies added
without a concrete, current need.
Rationale: This is a small app maintained by few people; low complexity and
verified behavior are cheaper than debugging clever code later.

### II. Elementary Child Focus (NON-NEGOTIABLE)
Every user-facing feature MUST be usable independently by a child in
elementary school (roughly ages 5-11) without adult help for routine tasks.
Concretely: reading levels MUST stay at or below a 3rd-grade vocabulary for
in-app text; instructions MUST rely on icons, pictures, or audio alongside
or instead of text; interactions MUST use large tap targets (minimum 44x44
px) and forgiving input (no fine-motor precision, no double-click/hover
requirements); errors MUST be encouraging and actionable, never blaming or
technical. Any feature that cannot be simplified to this level MUST be
redesigned or cut, not shipped with a "advanced mode" escape hatch.
Rationale: The product's entire value is a young child successfully caring
for a plant; adult-oriented complexity defeats the purpose.

### III. User Experience Consistency
Navigation patterns, iconography, color meaning (e.g., a color always means
the same plant status), and interaction gestures MUST be identical across
every screen. New screens MUST reuse existing components and patterns
before introducing new ones. Terminology for the same concept (e.g.,
"water," "sunlight," "growing") MUST NOT vary between screens or
notifications. Any deviation from an established pattern MUST be justified
in the PR description.
Rationale: Young children rely on repetition and pattern recognition; an
inconsistent UI breaks trust and independent use faster than for adults.

### IV. Performance Requirements
The app MUST remain responsive on low-end/hand-me-down devices typical for
a child's household: interactions MUST respond within 100ms and full
screen transitions MUST complete within 1 second on target hardware.
Screens MUST NOT block on network calls; offline or cached states MUST be
shown immediately with a clear (icon-based) loading indicator. Any
feature depending on background jobs (reminders, notifications, plant-care
schedules) MUST degrade gracefully (e.g., show last-known state) if the
job hasn't run yet.
Rationale: A slow or frozen app reads as "broken" to a child and ends the
task; performance is a usability requirement here, not an optimization.

## Additional Constraints

Technology and content choices MUST support Principles I-IV above all
else. Any new dependency MUST be justified against the "does this need to
exist" test (YAGNI) before being added. Content (text, images, audio) MUST
be reviewed for age-appropriateness and reading level before release.

## Development Workflow

All PRs MUST state which principle(s) the change touches and confirm
compliance (or justify a documented exception) before merge. Reviewers
MUST verify the runnable check required by Principle I is present. Complex
or non-obvious simplifications MUST be marked inline (e.g., a short
comment naming the shortcut and its upgrade path) rather than left
unexplained.

## Governance

This constitution supersedes other informal practices. Amendments require
a documented rationale, an explicit version bump per semantic versioning
(MAJOR: incompatible principle removal/redefinition; MINOR: new principle
or materially expanded guidance; PATCH: clarification/typo fixes), and
propagation of the Sync Impact Report to any dependent templates. All PRs
and reviews MUST verify compliance with this constitution; unjustified
complexity MUST be rejected or simplified during review.

**Version**: 1.0.0 | **Ratified**: 2026-07-05 | **Last Amended**: 2026-07-05
