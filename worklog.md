# Work Log

---
Task ID: 1
Agent: Main Agent
Task: Fix tournament admin features - add admin dropdown, phone field, groups, and tee times display

Work Log:
- Added `isSuperAdmin` field to AppUser interface in admin page
- Fixed Prisma schema for Tournament model - added missing fields:
  - `teeTimeInterval` (Int, default 10)
  - `adminId` (String?, optional)
  - `adminPhone` (String?, optional)
  - `admin` relation to User model
- Fixed Prisma schema for TournamentParticipant model - added missing fields:
  - `groupLetter` (String?, optional)
  - `positionInGroup` (Int?, optional)
  - `teeTime` (String?, optional)
- Added `administeredTournaments` relation to User model
- Updated both schema.prisma and schema.sqlite.prisma files
- Fixed tournaments API route - removed `phone` field from admin select (User model doesn't have phone)
- Updated Tournament interface in both admin page and main page to remove phone from admin object

Stage Summary:
- Tournament admin dropdown and phone field were already implemented in admin panel
- Players menu tournament tab already shows admin info, groups, and tee times
- Fixed Prisma schema synchronization issue - schema.sqlite.prisma needed manual update
- API now returns 200 status for tournaments endpoint
- Version remains at v1.2.82

---
## Task ID: 3 - Side Menu Implementation
### Work Task
Implement a side menu system for the Golf Scorecard application. Replace the logo Link with a button that opens a Sheet (side menu from left), and create dialogs for Repair Shops and About.

### Work Summary
Successfully implemented the side menu system with the following changes:

**1. Import Changes:**
- Added `Wrench` and `Info` icons to the lucide-react import
- Added Sheet component import: `import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'`

**2. State Variables Added:**
- `showSideMenu` - boolean for Sheet open/close state
- `showRepairShopsDialog` - boolean for repair shops dialog
- `showAboutDialog` - boolean for about dialog

**3. Header Modification:**
- Replaced the Link component wrapping the logo with a button element
- Button now triggers `setShowSideMenu(true)` to open the Sheet

**4. Side Menu Content (Sheet from left):**
- Repair Shops - Opens Repair Shops dialog when clicked
- User Guide - Links to `/guide` page
- About - Opens About dialog when clicked
- Each menu item has appropriate icon (Wrench, BookOpen, Info)

**5. Repair Shops Dialog:**
- Placeholder dialog with "Coming Soon" message
- Includes disabled search filter inputs for Country and City
- Shows wrench icon with message about future availability

**6. About Dialog:**
- App name: "Jazel Golf Scorecard"
- Version: "1.4.2"
- Description of the application
- Features list with icons: GPS Range Finder, Score Tracking, Tournament Management, Partner Finder
- Copyright: "© 2025 Jazel Golf"

**7. Footer Update:**
- Updated version badge from "v1.4.1" to "v1.4.2"

**Files Modified:**
- `/src/app/page.tsx`

**Styling:**
- Used existing jazel color scheme (#39638b, #4a7aa8, #8ab0d1, #d6e4ef)
- Consistent with existing UI patterns
- Sheet slides from left side with proper z-index

---
## Task ID: 4 - Repair Shops Full Implementation
### Work Task
Implement the full Repair Shops functionality for the Golf Scorecard application, including:
- State variables for shops and filters
- API fetch function
- Full dialog with search and filter capabilities
- Repair shop detail dialog
- Add Shop button for super admins

### Work Summary
Successfully implemented the complete Repair Shops functionality with the following changes:

**1. Import Changes:**
- Added `Phone` and `Globe` icons to the lucide-react import for contact links

**2. State Variables Added (near line 1236):**
- `repairShops` - array of shop objects from API
- `repairShopFilters` - object with countries and cities arrays for filter dropdowns
- `selectedShopCountry` - string for country filter (default: 'all')
- `selectedShopCity` - string for city filter (default: 'all')
- `shopSearchQuery` - string for text search
- `selectedRepairShop` - selected shop object for detail view
- `showRepairShopDetail` - boolean for detail dialog

**3. Fetch Function Added (near line 1584):**
- `fetchRepairShops` - useCallback function that fetches from `/api/repair-shops` endpoint
- Supports filtering by country, city, and text search query
- Updates both shops list and filter options from API response

**4. Effect Hook Added (near line 1412):**
- useEffect that triggers `fetchRepairShops` when `showRepairShopsDialog` opens
- Includes proper dependency array with `fetchRepairShops`

**5. Repair Shops Dialog (replaced placeholder):**
- Header with Wrench icon and title
- Search input for text search (name, manager, description)
- Two Select dropdowns for Country and City filters
  - Default value: "all" 
  - Placeholder: "All Countries" / "All Cities"
- ScrollArea with list of repair shops as cards showing:
  - Shop image (or Wrench icon placeholder if no image)
  - Shop name in jazel color
  - City, Country with MapPin icon
  - Manager name with User icon (if available)
- Click on card opens detail dialog
- "Add Shop" button visible only for super admins (`user.isSuperAdmin`)

**6. Repair Shop Detail Dialog (new):**
- Shop image (if available) in full width
- Manager name with User icon
- Location (City, Country) with MapPin icon
- Active since date formatted nicely with Calendar icon
- Description in jazel-colored rounded box
- Clickable phone number with Phone icon (tel: link)
- Clickable email with Mail icon (mailto: link)
- Close button with jazel border color

**Styling:**
- Used jazel color palette: #39638b, #4a7aa8, #8ab0d1, #d6e4ef
- ScrollArea for list with 400px height
- Cards with hover effects (border color change)
- Responsive 2-column grid for filters
- Consistent with existing application patterns

**Files Modified:**
- `/src/app/page.tsx`

**API Integration:**
- GET `/api/repair-shops` with query params (country, city, search)
- Returns `{ shops: [...], filters: { countries: [...], cities: [...] } }`
- Each shop has: id, name, manager, city, country, phone, email, description, imageUrl, activeSince, isActive

---
## Task ID: 6 - Admin Page Repair Shops Management
### Work Task
Add Repair Shops management to the admin page for super admins to add/edit/delete repair shops.

### Work Summary
Successfully added Repair Shops management to the admin page with the following changes:

**1. Import Changes:**
- Added `Wrench` icon to the lucide-react import (line 46)

**2. State Variables Added (lines 356-386):**
- `repairShops` - array of shop objects from API
- `repairShopsLoading` - boolean for loading state
- `addRepairShopDialogOpen` - boolean for add dialog
- `editRepairShopDialogOpen` - boolean for edit dialog
- `selectedRepairShop` - selected shop object for editing
- `newRepairShopForm` - form state for adding new shop (name, manager, city, country, phone, email, description, imageUrl, activeSince, isActive)
- `editRepairShopForm` - form state for editing shop

**3. Fetch Function Added (lines 490-502):**
- `fetchRepairShops` - fetches from `/api/repair-shops?search=` endpoint
- Sets shops array from API response

**4. CRUD Functions Added (lines 504-646):**
- `createRepairShop` - POST to /api/repair-shops with validation for name, city, country
- `updateRepairShop` - PUT to /api/repair-shops with validation
- `deleteRepairShop` - DELETE to /api/repair-shops?id=xxx with confirmation
- `openRepairShopEditDialog` - Opens edit dialog and populates form with shop data

**5. useEffect Updated (line 656):**
- Added `fetchRepairShops()` call to fetch shops on authentication

**6. Tab Trigger Added (lines 2442-2450):**
- Added "Repair Shops" tab with Wrench icon
- Only visible for super admins (`adminPermissions?.isSuperAdmin`)
- Positioned after Messages tab, before Settings tab

**7. TabsContent Added (lines 4111-4313):**
- Card with title and "Add Shop" button
- Table view showing: Name, City, Country, Manager, Phone, Status
- Edit and Delete buttons for each shop
- Loading spinner while fetching
- Empty state message when no shops exist
- Add Repair Shop Dialog with all form fields
- Edit Repair Shop Dialog with all form fields

**Form Fields:**
- Shop Name* (required)
- Manager
- City* (required)
- Country* (required, default: Morocco)
- Phone
- Email
- Description (textarea)
- Image URL
- Active Since (date picker)
- Active (switch toggle)

**Styling:**
- Consistent with existing admin page patterns
- Table with max-height scroll area
- Badge for active/inactive status
- Proper grid layouts for form fields

**Files Modified:**
- `/src/app/admin/page.tsx`

**API Integration:**
- GET `/api/repair-shops?search=` - Fetch all shops
- POST `/api/repair-shops` - Create new shop
- PUT `/api/repair-shops` - Update existing shop
- DELETE `/api/repair-shops?id=xxx` - Delete shop
---
Task ID: 1
Agent: Main Agent
Task: Fix Vercel build error and improve score pad UI

Work Log:
- Identified Vercel build failure: `ReferenceError: Cannot access 'dq' before initialization`
- Root cause: `holesPlayed`, `holesType`, `scorecardView` state variables declared at line ~1344 but referenced in `advanceScorePad` useCallback at line ~1335
- Fix: moved the 3 state declarations to before the `advanceScorePad` useCallback (line ~1303)
- Made score number buttons bigger: h-12 → h-14, text-lg → text-xl
- Made "+" button smaller: h-9 w-9 text-base → h-8 w-8 text-sm
- Made "Clear" button smaller: h-9 px-2 text-xs → h-8 px-1.5 text-[10px]
- Horizontal auto-advance was already implemented (strokes → putts → penalties → next hole)
- Bumped version to v1.4.46
- Committed and pushed to both main and master branches

Stage Summary:
- Build error fixed by reordering variable declarations
- Score pad buttons now have better size hierarchy (number buttons prominently larger than +/Clear)
- Vercel deployment should succeed now

---
Task ID: 1
Agent: Main
Task: Complete live tournament scoring system - fix missing schema fields and scoredAt logic

Work Log:
- Discovered entire live tournament scoring was already built in previous sessions
- Found missing `isScorer` and `scoredAt` fields on TournamentParticipant in Prisma schema
- Added both fields to schema.sqlite.prisma, schema.postgresql.prisma
- Ran db:push to sync schema to SQLite DB - verified columns exist via query
- Fixed scoring API (route.ts) to set `scoredAt` on every score save, not just completion
- This enables the LIVE indicator on the leaderboard to activate as soon as scoring starts
- Started WebSocket service on port 3005 (mini-services/tournament-live)
- Ran lint - 0 errors
- Updated version to v1.4.63 across all 4 instances
- Committed and pushed to main + master

Stage Summary:
- Key finding: All live scoring features were already implemented (schema models, APIs, WebSocket, UI components)
- Bug fixed: isScorer field was referenced in code but missing from schema - would crash at runtime
- Bug fixed: scoredAt was never set by the scoring API - LIVE indicator would never activate
- v1.4.63 pushed: aaa9f87
---
Task ID: 1
Agent: Main Agent
Task: Fix "Start Scoring" button doing nothing when clicked

Work Log:
- Investigated the full scoring flow: ScoringActionButton → startTournamentScoring → POST /api/tournaments/scoring
- Found API wasn't including `tees` in the course response (causing scorecard render crash)
- Found `GolfCourse.tees` interface wasn't optional (TypeScript type mismatch)
- Found scorecard rendering accessed `selectedCourse.tees.length` without null check
- Found `resumeTournamentScoring` accessed `activeRound.tournament.course` but GET endpoint doesn't include `tournament` relation (should use `round.course`)
- Fixed all 4 issues plus improved error handling with console logs and toast messages
- Updated version to v1.4.64 across all 4 locations
- Pushed to main and master

Stage Summary:
- Key fixes: API includes tees, tees made optional in interface, safety check in rendering, resume uses round.course
- Better error feedback: every failure path now shows a toast with descriptive message
- Console logging added for debugging scoring flow on browser console
- Version updated to v1.4.64, pushed to GitHub (main + master)
---
Task ID: 1
Agent: Main Agent
Task: Fix tournament tab crash and add error boundary

Work Log:
- Created `/src/components/ErrorBoundary.tsx` - React class component error boundary with fallback UI
- Wrapped JazelApp return content in `<ErrorBoundary>` in `/src/app/page.tsx`
- Removed `/manifest.json` from service worker PRECACHE_ASSETS in `/public/sw.js` (causes 401 on Vercel)
- Added `|| []` safety checks to all `selectedCourse.holes` usages in scorecard rendering (12 occurrences)
- Added `|| []` safety checks to `scores.filter()` calls in scorecard area
- Updated `getCoursePar()` to use local `const holes = selectedCourse.holes || []` variable
- Updated version from 1.4.64 to 1.4.65 in page.tsx (3 instances) and sw.js cache name
- Lint passed: 0 errors, 1 pre-existing warning

Stage Summary:
- Error boundary prevents white-screen crashes when React components throw errors
- Service worker no longer fails precache on Vercel due to manifest.json 401
- All scorecard/tournament .length and .find() calls are now safe against undefined arrays
- Version bumped to v1.4.65
---
Task ID: 2
Agent: Main Agent
Task: Fix tournament save draft - scores not in leaderboard, scorecard not closing

Work Log:
- Investigated save draft flow: page.tsx saveRound() → PUT /api/tournaments/scoring
- Found Bug 1: Upsert `create` payload was missing `roundId` field — if any score record needed creating, Prisma would throw a validation error, causing API 500 which prevented the success branch from executing (scorecard never closed)
- Found Bug 2: `grossScore`/`netScore` on TournamentParticipant were only calculated when `completed: true` (inside `if (completed)` block) — draft saves never updated leaderboard scores
- Fixed upsert create payload to explicitly include all required fields with `roundId`
- Moved gross/net score calculation outside the `if (completed)` check so it runs for both draft and final saves
- Changed `grossScore` to use `null` when totalStrokes is 0 (instead of 0) to show `-` in leaderboard
- Updated version from 1.4.67 → 1.4.68
- Lint check passes (0 errors)

Stage Summary:
- Fixed: Save Draft now properly saves and closes the scorecard
- Fixed: Leaderboard now shows gross/net scores after draft save
- Files changed: src/app/api/tournaments/scoring/route.ts, src/app/page.tsx
---
Task ID: 3
Agent: Main Agent
Task: Fix tournament scoring - leaderboard refresh, continue scoring, live banner, +/- display

Work Log:
- Found Bug 1: fetchTournamentWithParticipants had no cache-busting → browser served stale data
- Found Bug 2: resumeTournamentScoring called GET /api/tournaments/scoring without tournamentId (required param) → 400 error → Continue Scoring button silently failed
- Found Bug 3: loadRoundForEditing never set isLiveScoring/tournamentScoringInfo when opening tournament rounds from history
- Found Bug 4: Net score showed raw number instead of +/- relative to course par
- Fix 1: Added _t=Date.now() and cache: 'no-store' to fetchTournamentWithParticipants
- Fix 2: resumeTournamentScoring now accepts optional tournamentId param, passes it to API
- Fix 3: Continue Scoring button now passes tournament.id to resumeTournamentScoring
- Fix 4: loadRoundForEditing now checks for tournamentId/tournamentGroupLetter and fetches active scoring round
- Fix 5: Leaderboard columns show both raw score AND +/- par (color-coded green/red)
- Fix 6: Tournament API now includes course holes for par calculation

Stage Summary:
- Leaderboard refreshes with fresh data after every save draft
- Continue Scoring button now works (opens scorecard with existing scores)
- Tournament draft rounds in history now show live scoring banner when opened
- Leaderboard shows "72 +2" or "70 -2" or "72 E" format with colors
- Files changed: src/app/page.tsx, src/app/api/tournaments/route.ts

---
Task ID: 2
Agent: Main Agent
Task: Fix save draft scores not persisting on continue scoring - v1.4.74

Work Log:
- Identified root cause: browser/HTTP caching returning stale data when resuming scoring
- Added cache-busting (_t=timestamp) to resumeTournamentScoring GET request (line 2249)
- Added cache: no-store to resumeTournamentScoring fetch (line 2252)
- Added cache-busting to active scoring round check useEffect (line 1396)
- Added fetchRounds() call after tournament draft save to keep history fresh (line 3669)
- Added cache: no-store to loadRoundForEditing tournament check (line 4188)
- Verified build compiles with no errors
- Pushed v1.4.74 to main and master branches

Stage Summary:
- Fixed 4 locations where cache-busting was missing for tournament scoring API calls
- The missing cache-busting caused the browser to return stale GET responses (with all-zero scores from before the draft was saved)
- Now all scoring-related fetches use _t=timestamp and cache: no-store to ensure fresh data

---
Task ID: 1
Agent: Main Agent
Task: Admin lock/unlock group scores system - v1.4.80

Work Log:
- Added lockedAt DateTime? and scoreSnapshot String? to TournamentParticipant schema
- Created /api/tournaments/validate endpoint (POST=lock group, DELETE=unlock group)
- Lock saves current grossScore/netScore as JSON snapshot + sets lockedAt on all group participants
- Unlock clears lockedAt and scoreSnapshot for all group participants
- Updated scoring PUT handler: skips locked participants (if participant.lockedAt, continue)
- Updated recalculate endpoint: skips locked participants (scores preserved from validation)
- Added Lock/Unlock buttons in group card header (Lock only visible when group has scores)
- Added '🔒 Validated' badge on locked group headers
- Added 🔒 icon on locked players in leaderboard
- Added Lock, Unlock icons from lucide-react
- Scorer can delete scorecard after lock — scores remain in TournamentParticipant table
- After unlock, if scorecard wasn't deleted, scorer can continue editing and save will update scores

Stage Summary:
- v1.4.80 deployed with admin group score validation
- Lock prevents score changes via scorecard save AND recalculate
- Unlock re-enables editing if scorecard still exists
- Force pushed to both main and master branches

---
Task ID: 1
Agent: Main Agent
Task: Implement 3 features - Group filter for participants, Live Scoring toggle, Disable scoring when not in progress

Work Log:

### FEATURE 1: Group Filter When Adding Participants to Tournament
- Added state variables: `selectedFilterGroupId`, `groupFilterUserIds`, `groupFilterLoading`, `participantSearchQuery`
- Modified `getAvailableUsers()` to support group filter and search query filtering
- Replaced simple Select dropdown with a full dialog containing:
  - Group filter dropdown (shows all groups with member counts + "All Groups" option)
  - Search input with search icon for filtering by name/email
  - Scrollable user list (max-h-64) with clickable user cards showing name, handicap badge
  - Loading state for group member fetching
  - Reset filters when dialog closes

### FEATURE 2: Live Scoring Toggle + Flashing Indicator
**Schema Changes:**
- Added `liveScoringEnabled Boolean @default(false)` to Tournament model in all 3 schema files:
  - prisma/schema.prisma
  - prisma/schema.sqlite.prisma
  - prisma/schema.postgresql.prisma
- Ran `bun run db:push` to sync schema

**API Changes (src/app/api/tournaments/route.ts):**
- Added `liveScoringEnabled` to destructured body in PUT handler
- Added `if (liveScoringEnabled !== undefined) updateData.liveScoringEnabled = liveScoringEnabled;`

**Admin Page (src/app/admin/page.tsx):**
- Added `liveScoringEnabled?: boolean` to Tournament interface
- Added `liveScoringEnabled: false` to `editTournamentForm` initial state
- Added `liveScoringEnabled: tournament.liveScoringEnabled || false` when populating edit form
- Added `liveScoringEnabled: editTournamentForm.liveScoringEnabled` to `updateTournament` API call
- Added Switch toggle in edit tournament dialog (below Status field) with label and description
- Added quick toggle in tournament detail view (info bar) with:
  - Visual badge showing current state (red pulse when enabled, gray when disabled)
  - Toggle button that directly calls PUT API without opening edit dialog
  - Toast notification on success

**Player Page (src/app/page.tsx):**
- Added `liveScoringEnabled?: boolean` to Tournament interface
- Added flashing "🔴 LIVE SCORING" badge next to group headers when:
  - `tournament.liveScoringEnabled` is true
  - Tournament status is `in_progress`
  - Group has a scorer assigned
- Uses `animate-pulse` class for flashing effect with red dot + bold text

### FEATURE 3: Disable Scoring Button When Tournament Not In Progress
- In `ScoringActionButton` component, added check for `tournament.status !== 'in_progress'`
- Shows a gray disabled message "Tournament is not in progress — scoring unavailable" instead of scoring buttons
- Applied AFTER locked check and AFTER checking loading state
- Affects both "Start Live Scoring" and "Continue Scoring" buttons

Stage Summary:
- All 3 features implemented across 5 files
- Lint passes with 0 errors (1 pre-existing warning in prisma.config.ts)
- Dev server compiles and runs successfully

---
Task ID: 2
Agent: Main Agent
Task: Add Tournament Scorecard Summary feature

Work Log:

### API Endpoint: `/api/tournaments/scorecard/route.ts`
- Created new GET endpoint that accepts `?tournamentId=xxx`
- Fetches tournament with course data, all course holes (par + HCP index), all participants with user info
- Processes TournamentScoringRounds: builds per-player scores from RoundScores grouped by playerIndex
  - playerIndex 0 = scorer (from TournamentScoringRound.scorerId)
  - playerIndex 1,2,3 = other players from Round.playerNames JSON
- Handles standalone Rounds with tournamentId but no TournamentScoringRound (edge case)
- Handles participants with grossScore/netScore but no detailed hole scores
- Calculates net scores using strokes received formula based on hole HCP index
- Sorts players by netScore (nulls last)
- Returns JSON: `{ tournament, holes[], players[] }` where each player has name, handicap, groupLetter, scores (18 values or null), gross, net

### UI: Scorecard Button + Modal in `src/app/page.tsx`
- Added `Fragment` to react imports
- Added `Table2` and `Printer` to lucide-react imports
- Added 3 state variables: `scorecardOpen`, `scorecardData`, `scorecardLoading`
- Added "Scorecard" button with Table2 icon next to the existing Refresh button in the leaderboard header area
  - Only visible when selectedTournament exists
  - Fetches from `/api/tournaments/scorecard?tournamentId=xxx` with cache-busting
- Added full scorecard Dialog modal with:
  - Tournament info header (name, course, city, date, format badge)
  - Responsive scorecard table with horizontal scroll on mobile
  - Sticky left column for player names
  - Hole numbers header row
  - Par row with light gray background
  - HCP row with light blue/gray background
  - Per-player: gross score row (color-coded: green for birdie+, red for bogey+) + net score row (lighter shade)
  - Total column with bold text and +/- par indicators
  - Empty state when no scores recorded
  - Share button (Web Share API with clipboard fallback)
  - Print button (calls window.print())

### Print Styles in `src/app/globals.css`
- Added `@media print` section that hides everything except the modal content
- Forces dialog to be visible and full-width for printing
- Hides all buttons during print
- Enables color printing with `print-color-adjust: exact`
- Page-break settings for table rows

### Files Modified:
- `/src/app/api/tournaments/scorecard/route.ts` (NEW)
- `/src/app/page.tsx` (MODIFIED - added imports, state, button, modal)
- `/src/app/globals.css` (MODIFIED - added print styles)

Stage Summary:
- Lint passes with 0 errors (1 pre-existing warning)
- Dev server compiles and runs successfully
- No existing logic was modified — all changes are additive
---
Task ID: 2
Agent: Main Agent
Task: Fix tee time not showing on player/user side tournament groups

Work Log:
- Investigated why tee time showed in admin panel but not player side
- Found admin panel uses `calculateGroupTeeTime()` as fallback when `teeTime` not stored on participants
- Player side only checked `participants.find(p => p.teeTime)?.teeTime` with no fallback
- Added calculation fallback in player-side group header rendering
- Uses tournament `startTime` and `teeTimeInterval` to compute tee time when not stored
- Updated version to 1.4.95

Stage Summary:
- Fixed tee time display on player/user side tournament tab groups
- Added calculated tee time fallback matching admin panel behavior
- Version bumped to 1.4.95

---
Task ID: 1
Agent: Main Agent
Task: Verify user guide and backup system are up to date with match play changes

Work Log:
- Pulled latest from GitHub origin/main (commit abb5765)
- Reviewed user guide at `/src/app/guide/page.tsx` lines 878-1001
- Confirmed match play section already exists with comprehensive documentation:
  - What match play is, availability (18 holes, 2 players)
  - Getting started steps, score understanding (AS, 1UP, 2UP, 3UP)
  - Scorecard colors (Green=Won, Red=Lost, Amber=Halved)
  - Early match end notation (3&2, 2&1, 1UP)
  - Handicap strokes explanation
  - History banner display
- Audited backup system at `/src/app/api/admin/backup/route.ts`:
  - Line 229: `data.rounds = await db.round.findMany()` — fetches ALL Round fields (no select filter)
  - `matchPlay` (Boolean) and `matchPlayResult` (String?) are automatically included
- Audited restore system at `/src/app/api/admin/restore/route.ts`:
  - Line 342-347: Round upsert uses `filterRecordFields()` with dynamic DMMF schema reading
  - `getModelFields()` reads current Prisma schema at runtime → new fields are automatically included
  - All 27 database tables properly mapped in `TABLE_TO_MODEL` and `TABLE_DEPENDENCIES`
- Backup version is 2.2, admin UI lists all 27 tables correctly

Stage Summary:
- ✅ User guide already updated (commit abb5765 "docs: add match play section to user guide")
- ✅ Backup system is up to date — uses findMany() without select filters, automatically includes all schema fields
- ✅ Restore system is up to date — dynamically reads Prisma DMMF at runtime, handles new fields automatically
- No changes needed — both systems are fully compatible with matchPlay/matchPlayResult fields
