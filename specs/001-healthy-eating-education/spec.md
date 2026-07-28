# Feature Specification: Healthy Eating Education

**Feature Branch**: `001-healthy-eating-education`
**Created**: 2026-07-05
**Last Updated**: 2026-07-05 (added QR-code garden scanning, student Cookbook, teacher/parent assist flows, super-admin QR/library setup)
**Status**: Draft
**Input**: User description: "Build a tablet application to help elementary school children to understand the benefits of healthy eating, what good food can do and how it interacts with our bodies. Audience: kindergarten through second grade (5-8 year olds) students, teachers (admins and educators), parents as guardians and to assist their child, super admin to add plants, recipes and monitor usage." Updated with: "Student will scan QR code to learn about the plant in the garden, directed to recipes about the plant they scanned, can add the recipe to a personal cookbook they can browse/filter/sort, mark 'I made it' and rate it; a separate teacher/admin portion to review recipes and student activity and assist adding to cookbooks; a quick, simple parent login to view/assist their child's cookbook and identified plants; an extremely simple, few-step child login; tablet-based, touch as the main interaction mode; QR scan offers two pathways (learn about the plant, or see recipes); roughly 12-15 plants will have QR codes; teacher/admin can pick from the plant library which QR codes to print as garden labels; super admin sets up the QR codes and plant/recipe library; recipes have an easy-to-follow instruction pathway."

## Clarifications

### Session 2026-07-05

- Q: Shared classroom tablets get passed between students all day. How
  should a student's session end? → A: Both an always-visible "Switch
  Student" icon on every screen AND an idle timeout as a safety net, with
  the idle timeout set to 30 minutes.
- Q: A parent's login code links to their child — some parents have more
  than one child at the school. What happens when one parent has multiple
  children? → A: One code = one child. A parent enters/links each child's
  code separately (at different times, as needed); after login, if more
  than one child is linked to that parent account, they pick which child's
  Cookbook/discoveries to view from a simple picker.
- Q: Should this version explicitly support assistive tech (screen-reader
  labels, captions, switch-access) beyond touch/icon/audio? → A: Out of
  scope for v1; planned as a future follow-up.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Scans a Garden QR Code to Learn About a Plant (Priority: P1)

A K-2 student, standing in the school garden with a tablet, scans a QR code
label next to a plant. The app recognizes the plant and offers exactly two
big, icon-based choices: "Learn About This Plant" or "See Recipes." Choosing
"Learn About This Plant" shows a picture, short spoken narration, and one
simple sentence about what the plant does for their body.

**Why this priority**: The QR scan in the garden is the app's primary
real-world entry point — without it, the rest of the experience (recipes,
cookbook) has no natural starting point for a young child.

**Independent Test**: A student can scan any one of the pre-loaded plant QR
codes (or, offline/indoors, open a plant directly from a browsable list) and
reach the two-choice fork and the plant benefit page — testable with a single
pre-loaded plant and zero teacher/parent setup.

**Acceptance Scenarios**:

1. **Given** the student opens the scan screen and points the camera at a
   known garden QR code, **When** the code is recognized, **Then** the app
   shows a two-choice screen: "Learn About This Plant" and "See Recipes,"
   each with a picture of the plant.
2. **Given** the student is on the two-choice screen, **When** they tap
   "Learn About This Plant," **Then** the app shows the plant's picture,
   narrated audio, and one benefit sentence, with a replay (speaker) icon
   and a large "back" icon.
3. **Given** the student scans a QR code the app doesn't recognize (damaged
   label, wrong code), **When** recognition fails, **Then** the app shows a
   friendly, icon-based message (not a technical error) and offers to try
   again or browse the plant library instead.
4. **Given** the device has no network connection, **When** the student
   scans a QR code for a plant whose content was already loaded before,
   **Then** the plant benefit page still displays fully from cache.

---

### User Story 2 - Student Follows a Recipe from a Scanned Plant (Priority: P1)

From the QR-scan two-choice fork (or by browsing), a student picks "See
Recipes," sees recipes built around that plant, opens one, and steps through
its picture-and-narration instructions at their own pace.

**Why this priority**: Recipes are the second core pathway from every QR
scan and the bridge into the Cookbook (User Story 3); without this, scanning
a plant only ever leads to passive reading.

**Independent Test**: A student can reach a plant's recipe list (via scan or
browse), open a recipe, and step through all instructions to completion —
testable independently of the Cookbook or any adult account.

**Acceptance Scenarios**:

1. **Given** the student taps "See Recipes" on the two-choice fork, **When**
   the recipe list loads, **Then** it shows every published recipe linked to
   that plant, each with a picture and name.
2. **Given** the student opens a recipe, **When** they view a step, **Then**
   they see one picture and one short spoken instruction, with a large
   "next" icon to advance.
3. **Given** the student reaches the final step, **When** they tap "next,"
   **Then** the app shows a celebration animation and offers a single
   large "Add to My Cookbook" button.

---

### User Story 3 - Student Builds and Manages Their Cookbook (Priority: P1)

A student adds recipes they like to a personal Cookbook, then later opens
the Cookbook to browse, filter, and sort everything they've collected. After
cooking a recipe (with an adult's help at home or school), they mark it
"I made it" and give it a simple rating.

**Why this priority**: The Cookbook is what turns a one-time lesson into a
collection a child keeps coming back to — it's the retention loop the whole
feature is built around, and is independently valuable once at least one
recipe can be added.

**Independent Test**: A student can add a recipe to their Cookbook, reopen
the Cookbook later, filter/sort the list, mark an entry "I made it," and
rate it — testable with one student account and no teacher/parent
involvement.

**Acceptance Scenarios**:

1. **Given** a student is viewing a recipe, **When** they tap "Add to My
   Cookbook," **Then** the recipe appears in their Cookbook; tapping it
   again on an already-added recipe shows "Already in your Cookbook"
   instead of adding a duplicate.
2. **Given** a student opens their Cookbook, **When** they choose a filter
   (e.g., by plant, or "made" vs "not made yet") or a sort option (e.g.,
   newest, alphabetical, highest rated), **Then** the list updates to match.
3. **Given** a student opens a Cookbook entry, **When** they tap "I made
   it!," **Then** the entry is marked made and the student is prompted to
   rate it on a simple, icon-based scale (e.g., three faces from "okay" to
   "loved it").
4. **Given** a Cookbook entry has not been marked "I made it," **When** the
   student views it, **Then** no rating control is shown yet (rating
   requires marking made first).

---

### User Story 4 - Teacher Reviews Student Activity and Assists with Cookbooks (Priority: P2)

A teacher signs in, reviews the plant/recipe library, and looks at what
their students have scanned, added, made, and rated. When a student needs
help, the teacher can add a recipe to that student's Cookbook on their
behalf.

**Why this priority**: Supports classroom use and gives teachers a reason to
adopt the app and reinforce lessons, but students can use the app fully
(Stories 1-3) without a teacher present.

**Independent Test**: A teacher account can log in, view a roster of
students with their Cookbook activity (added/made/rated), and add a recipe
to a specific student's Cookbook — testable without parent or super-admin
involvement.

**Acceptance Scenarios**:

1. **Given** a teacher is signed in, **When** they open a student's profile,
   **Then** they see that student's full Cookbook: recipes added, which are
   marked made, and their ratings.
2. **Given** a teacher is viewing a student's profile, **When** they select
   a recipe and choose "Add to [Student]'s Cookbook," **Then** it appears in
   that student's Cookbook exactly as if the student had added it.
3. **Given** a teacher opens the plant/recipe library, **When** they browse
   it, **Then** they see the same content students see, for review purposes.

---

### User Story 5 - Parent Quick-Login to Assist Child's Cookbook (Priority: P2)

A parent, on a shared or personal tablet, logs in with as few steps as
possible, sees the plants their child has discovered and the recipes in
their child's Cookbook, and can add recipes or help mark ones made together.

**Why this priority**: Extends learning and cooking into the home and gives
guardians visibility, but is not required for the core student or classroom
experience (Stories 1-4) to function.

**Independent Test**: A parent can complete the quick login, see their
linked child's discovered plants and Cookbook, and add a recipe to that
Cookbook — testable independently of teacher features.

**Acceptance Scenarios**:

1. **Given** a parent has a valid quick-login code linked to their child,
   **When** they enter it, **Then** they are signed in within a few taps —
   no full account-creation flow required for routine access.
2. **Given** a parent is signed in, **When** they open their child's
   profile, **Then** they see the plants the child has scanned/learned
   about and the child's full Cookbook.
3. **Given** a parent is viewing their child's Cookbook, **When** they add a
   recipe or mark one "I made it," **Then** the change appears identically
   in the child's own Cookbook view.
4. **Given** a parent has linked more than one child (each via that child's
   own code, entered separately), **When** they sign in, **Then** they see a
   simple picker to choose which child's Cookbook/discoveries to view, and
   can switch between their linked children without logging out.

---

### User Story 6 - Super Admin Builds the Plant and Recipe Library (Priority: P3)

A super admin creates and maintains the shared library of plants (picture,
narration, benefit text) and recipes (picture, linked plants, ordered
steps), and monitors overall usage (scans, recipes added/made/rated) across
schools and classes.

**Why this priority**: Necessary to keep content current and operate at
scale, but the app is fully usable with an initial, pre-loaded library
(roughly 12-15 plants) before this role is exercised.

**Independent Test**: A super admin can create a new plant or recipe entry
with all required fields, publish it, and see it appear in the
student-facing library and QR-selection list — testable independently of
student/teacher/parent activity.

**Acceptance Scenarios**:

1. **Given** a super admin is signed in, **When** they submit a new plant
   entry with picture, narration, and benefit text, **Then** it becomes
   available to students and appears in the printable QR-label list after
   publishing.
2. **Given** a super admin opens the usage dashboard, **When** they select a
   date range, **Then** they see aggregate counts of plants scanned, recipes
   added, and recipes marked made across all classes.

---

### User Story 7 - Teacher/Admin Selects Garden Plants and Prints QR Labels (Priority: P3)

A teacher or admin, from the full plant library (~12-15 plants), selects
which plants are physically present in their school garden and generates
printable QR code labels for exactly those plants.

**Why this priority**: Needed to physically set up or update a garden's QR
labels, but is an occasional setup task, not part of a student's daily use
(Stories 1-3 work as soon as at least one label exists).

**Independent Test**: A teacher/admin can select a subset of the published
plant library and produce a printable sheet of QR labels for that subset —
testable independently of any student activity.

**Acceptance Scenarios**:

1. **Given** a teacher/admin opens the garden setup screen, **When** they
   check which plants are in their garden from the full library list,
   **Then** a printable page of QR labels is generated for exactly the
   checked plants.
2. **Given** a printed QR label for a plant, **When** a student scans it in
   the garden, **Then** it resolves to the same plant record the
   teacher/admin selected (User Story 1).

### Edge Cases

- What happens when a student taps rapidly between plants/recipes before
  narration finishes? Narration for the previous item MUST stop immediately
  and the new item's narration MUST start; no overlapping audio.
- What happens when a QR code doesn't match any known plant (damaged label,
  foreign code)? The app MUST show a friendly, icon-based message and offer
  to retry the scan or browse the plant library instead (see User Story 1).
- What happens when a student tries to add a recipe already in their
  Cookbook? The app MUST show "Already in your Cookbook" and MUST NOT create
  a duplicate entry.
- What happens when a student tries to rate a recipe not yet marked "I made
  it"? The rating control MUST be hidden until "I made it" is marked.
- How does the system handle a teacher assigning/adding content to a class
  with no students yet? N/A for Cookbook additions (student-specific), but
  any class-wide content selection MUST still apply automatically to
  students added later.
- What happens when a parent's quick-login code is invalid or expired? The
  app MUST show a friendly message and a way to request a new code (e.g.,
  from their child's teacher), not a technical/security-style error.
- How does the system handle a super admin publishing a plant/recipe with a
  missing required field (e.g., no narration, or a recipe step missing a
  picture)? The publish action MUST be blocked with a clear, specific
  message naming the missing field.
- What happens when the device is offline? Previously loaded/cached plant
  and recipe content, and the student's own Cookbook, MUST remain viewable;
  new Cookbook additions/ratings MUST queue and sync automatically once
  connectivity returns.
- What happens when a teacher/admin selects zero plants on the garden setup
  screen? The print action MUST be disabled with a message asking them to
  select at least one plant.
- What happens when a student walks away from the tablet mid-session? The
  session MUST end automatically after 30 minutes of no touch input (FR-013a),
  independent of the always-visible "Switch Student" control.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a student scan a QR code (device camera) that
  resolves to a specific library Plant and present exactly two choices:
  "Learn About This Plant" and "See Recipes."
- **FR-002**: System MUST show, for "Learn About This Plant," a picture,
  narrated audio, and a single-sentence benefit description for that plant.
- **FR-003**: System MUST show, for "See Recipes," the list of published
  recipes linked to that plant.
- **FR-004**: System MUST let a student browse the full plant/recipe
  library directly (without scanning), for indoor/offline use and for
  teacher/parent review.
- **FR-005**: System MUST let a student step through a recipe's ordered,
  picture-and-narration instructions one step at a time.
- **FR-006**: System MUST let a student add a recipe to their personal
  Cookbook with a single tap, and MUST prevent duplicate entries for the
  same student/recipe pair.
- **FR-007**: System MUST let a student browse their Cookbook and filter
  and sort it (at minimum: by plant, by made/not-made status, and by
  rating or recency).
- **FR-008**: System MUST let a student mark a Cookbook entry "I made it"
  and, only after marking it made, rate it on a simple age-appropriate
  scale.
- **FR-009**: System MUST let a teacher view, for any student in their
  class, the student's full Cookbook (added, made status, ratings).
- **FR-010**: System MUST let a teacher add a recipe directly to a specific
  student's Cookbook on that student's behalf.
- **FR-011**: System MUST provide a parent login flow that requires
  meaningfully fewer steps than the teacher/admin credential login (e.g., a
  short code). Each code links exactly one child; a parent with multiple
  children links each child separately, one code per child, over time.
- **FR-011a**: When a parent account is linked to more than one child,
  System MUST show a simple picker after login to choose which child's
  Cookbook/discoveries to view, and MUST let the parent switch between
  their linked children without logging out.
- **FR-012**: System MUST let a parent view their currently-selected linked
  child's discovered (scanned) plants and full Cookbook, and add to or
  update that Cookbook (add recipes, mark made, rate) with changes
  reflected identically in the child's own view.
- **FR-013**: Student ("child") login MUST require the fewest possible
  steps (e.g., a single tap on their own picture/avatar) and MUST NOT
  require typed credentials.
- **FR-013a**: System MUST show a large, always-visible "Switch Student"
  control on every student-facing screen that immediately ends the current
  student session, and MUST also automatically end an idle student session
  after 30 minutes of no touch input, so a shared tablet never silently
  stays signed in as the previous student.
- **FR-014**: System MUST use touch as the primary interaction mode
  throughout, with no interaction that depends on hover, right-click, or
  fine-motor precision.
- **FR-015**: System MUST provide a super admin capability to create, edit,
  publish, and unpublish Plant and Recipe entries in a shared content
  library.
- **FR-016**: System MUST block publishing of a Plant or Recipe entry
  missing any required field (picture, narration, benefit text for plants;
  picture and narration per step for recipes) and MUST tell the super admin
  which field is missing.
- **FR-017**: System MUST let a teacher or admin select, from the full
  published plant library, which plants are present in their physical
  garden, and generate a printable sheet of QR code labels for exactly the
  selected plants.
- **FR-018**: System MUST resolve a given QR code to the same Plant record
  regardless of which garden/school printed it.
- **FR-019**: System MUST provide a super admin usage dashboard showing
  aggregate counts (plants scanned, recipes added, recipes marked made)
  filterable by date range.
- **FR-020**: System MUST cache previously loaded plant/recipe content and
  the student's own Cookbook for offline viewing, and MUST resynchronize
  new Cookbook actions (adds, made-marks, ratings) automatically once
  connectivity returns.
- **FR-021**: All student-facing text MUST be at or below a 3rd-grade
  reading level and MUST be paired with narrated audio and icon-based
  navigation, per the Elementary Child Focus principle.
- **FR-022**: System MUST require teacher, parent, and super admin
  identities to authenticate (at their respective login-simplicity level)
  before accessing their role's features.

### Key Entities

- **Plant**: A garden plant/food item tied to a QR code; attributes include
  name, picture, narration (audio + script), and a short benefit
  description ("what it does for your body").
- **QR Code**: A scannable code printed as a garden label; resolves to
  exactly one Plant, independent of which garden printed it (FR-018).
- **Recipe**: A simple, child-safe activity linked to one or more Plants;
  attributes include name, picture, and an ordered list of steps (each with
  a picture and short narration).
- **Cookbook Entry**: A link between a Student and a Recipe they've added;
  tracks added date, "made" status, and rating (only settable after made).
- **Student**: A child user (K-2) associated with a class and, optionally,
  a linked parent; owns exactly one Cookbook (the set of their Cookbook
  Entries) and a record of Plants discovered via scanning.
- **Class**: A group of Students managed by one or more Teachers.
- **Teacher**: An educator/admin account that manages one or more Classes,
  reviews student Cookbooks, assists with additions, and selects/prints
  garden QR labels.
- **Parent**: A guardian account linked to one or more Students via a
  quick-login mechanism, able to view/assist that child's Cookbook and
  discovered Plants.
- **Super Admin**: An account with full Plant/Recipe library management,
  QR-code/plant association setup, and cross-class usage-monitoring
  capability.
- **Garden Selection**: The subset of the full Plant library a given
  teacher/admin has chosen as physically present in their garden, used to
  generate printable QR labels (FR-017).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can scan a garden QR code and reach either the
  plant-benefit page or the recipe list within 5 seconds of a successful
  scan.
- **SC-002**: 90% of K-2 students in a usability test can go from scanning
  a QR code to viewing a plant's benefit page using only icon-based
  controls on their first attempt.
- **SC-003**: 90% of students can add a recipe to their Cookbook and mark
  it "I made it" without adult help after one adult demonstration.
- **SC-004**: Teachers can open any student's full Cookbook (added, made,
  rated) in under 1 minute.
- **SC-005**: 90% of parents can complete quick login and reach their
  child's Cookbook in 3 taps or fewer after entering their code.
- **SC-006**: A teacher/admin can select a garden's plants and generate a
  printable QR-label sheet for 12-15 plants in under 5 minutes.
- **SC-007**: Super admins can publish a new plant or recipe entry, with
  all required content, in under 5 minutes.
- **SC-008**: Previously loaded plant/recipe content and a student's own
  Cookbook remain fully viewable with no network connection, for 100% of
  cached items.

## Assumptions

- Each Student is enrolled in exactly one Class at a time; multi-class
  enrollment is out of scope for v1.
- A QR code encodes a stable Plant identifier shared across all
  schools/gardens; only the Garden Selection (which plants a given school
  chooses to print and place) varies per school (FR-017, FR-018).
- Physical printing/lamination/placement of QR labels happens outside the
  app; the app's responsibility ends at generating a printable label sheet.
- The initial library is sized around 12-15 plants and their recipes;
  this scale informs performance/scope but is not a hard limit enforced by
  the system.
- Content is authored and reviewed by Super Admins only; Teachers select
  from and review existing published content, and assist with student
  Cookbooks, but do not author new Plant/Recipe entries in v1.
- Parent quick-login uses a short code (e.g., issued by the teacher or
  shown to the parent at enrollment) rather than a typed email/password,
  since the requirement is "extremely simple, few steps" — distinct from
  the child's no-credential picker login and from the teacher/admin's full
  credential login.
- Rating scale is a simple 3-point, icon-based scale (e.g., three faces)
  appropriate for K-2 comprehension; exact iconography is a design detail,
  not a spec requirement.
- Formal assistive-technology support (screen-reader labels, captions,
  switch-access) beyond the touch/icon/audio design already in this spec
  is out of scope for v1; it is a candidate follow-up feature, not silently
  folded into this release.
- "I made it" reflects a self/adult-reported confirmation only; the app
  does not verify that cooking actually occurred.
- Initial launch supports English-language content only; localization is
  out of scope for v1.
- The app is used on shared classroom tablets as well as personal/home
  tablets; the device camera is available for QR scanning on all target
  tablets.
