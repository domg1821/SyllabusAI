# SyllabusAI — Phase 1 Testing Guide

Run automated unit tests first:
```bash
npm test          # single run
npm run test:watch  # watch mode during development
```

Everything below is a manual testing checklist.
Each test includes: **Steps → Expected → Failure indicator → Where to debug**.

---

## 1. Not Signed In

**Context:** Middleware protects `/dashboard` and `/settings`, but the Syllabus tab input
and API routes should also behave correctly when called without auth.

### 1a — Direct URL access while signed out

**Steps:**
1. Sign out completely
2. Navigate directly to `http://localhost:3000/dashboard`

**Expected:** Redirected to `/sign-in` instantly. No flash of dashboard content.

**Failure:** Dashboard loads or shows a blank/broken page.

**Debug:** Check `src/middleware.ts` — verify `/dashboard` is in the guard condition.
Network tab → look for a redirect response to `/sign-in`.

---

### 1b — Session expires mid-session

**Steps:**
1. Sign in and use the dashboard normally
2. In Supabase Dashboard → Authentication → Users → find your user → delete the session
3. Try to save a course or toggle a deadline

**Expected:** The Supabase call fails silently (logged to console). The UI shows the optimistic state but
on next full page reload the user is redirected to `/sign-in`.

**Failure:** App crashes, shows an unhandled error, or silently corrupts state without any log.

**Debug:** Browser console → look for `[useClasses] dbSync error`. Network tab → Supabase 401 responses.

---

### 1c — Checkout requires auth

**Steps:**
1. Sign out
2. Call `POST /api/checkout` directly via `curl -X POST http://localhost:3000/api/checkout`

**Expected:** `401 { "error": "Not authenticated." }`

**Failure:** Returns a Stripe checkout URL to an unauthenticated request.

**Debug:** `src/app/api/checkout/route.ts` — verify `supabase.auth.getUser()` check is present.

---

## 2. Duplicate Course Save

### 2a — Same course code

**Steps:**
1. Analyze the sample syllabus (CS 101)
2. Click "Save to My Courses"
3. Without resetting, click "Save to My Courses" again (or navigate back to Syllabus tab and re-analyze the same text, then try to save)

**Expected:** Amber warning appears: *"This course is already saved. View it in My Courses."*
No duplicate row is created in Supabase.

**Failure:** Two identical courses appear in My Courses tab, or in `courses` table.

**Debug:** Supabase → Table Editor → `courses` → filter by `user_id` → count rows.
The duplicate check is in `handleSaveClass` in `src/app/dashboard/page.tsx`.

---

### 2b — Same name, different code

**Steps:**
1. Save a course named "Intro to CS"
2. Analyze a slightly different syllabus with the same name but no code (or different code)
3. Try to save

**Expected:** Duplicate detected by name match → same amber warning.

**Failure:** Second course saved with same name.

**Debug:** The guard condition: `c.name.toLowerCase() === courseInfo.name.toLowerCase()`.

---

## 3. Edit / Delete Course (Persistence)

### 3a — Grade entry persists across page reload

**Steps:**
1. Go to My Courses → expand a saved course → Grade Tracker
2. Click "+ Add grade" on any assignment → enter `85 / 100` → Save
3. Hard refresh the page (`Ctrl+Shift+R`)

**Expected:** Grade is still showing 85/100. Current grade card shows the correct percentage.

**Failure:** Grade disappears after refresh.

**Debug:** Supabase → `courses` table → find the course row → inspect the `grades` JSONB column.
Should contain `[{ "itemId": "...", "earned": 85, "max": 100 }]`.
Console → look for `[useClasses] setGrade failed`.

---

### 3b — Study task completion persists

**Steps:**
1. My Courses → expand a course → check off a study task
2. Hard refresh

**Expected:** Task remains checked.

**Failure:** Task reverts to unchecked.

**Debug:** Supabase → `courses.study_plan` JSONB column → find the task by id → check `completed: true`.

---

### 3c — Delete course removes it from DB

**Steps:**
1. My Courses → click the delete/trash icon on a course → confirm
2. Course disappears from UI
3. Hard refresh

**Expected:** Course is gone from UI and from Supabase `courses` table.

**Failure:** Course reappears after refresh (deleted from UI state but not from DB).

**Debug:** Supabase → `courses` table → filter by `user_id` → confirm the row is absent.
Console → look for `[useClasses] removeClass failed`.

---

## 4. Optimistic Update Rollback

### 4a — Simulate DB failure on toggle

**Steps:**
1. Open DevTools → Network tab
2. Add a request block rule for `supabase.co` (Chrome: right-click request → Block request domain)
3. Toggle any deadline or study task → observe the checkbox

**Expected:**
- Checkbox checks immediately (optimistic update)
- After ~5 seconds (network timeout), the checkbox reverts to its original state
- Console shows `[useClasses] toggleClassItem rolled back`

**Failure:**
- Checkbox stays checked despite the network being blocked (fake success)
- App crashes or shows an unhandled error

**Debug:** The `onFailure` callback in `toggleClassItem` inside `src/lib/useClasses.ts`.
Remove the network block and verify the toggle works normally again.

---

### 4b — Simulate DB failure on add course

**Steps:**
1. Block Supabase network requests (same as 4a)
2. Analyze a syllabus and click "Save to My Courses"

**Expected:**
- Course appears immediately in My Courses (optimistic)
- After timeout, course disappears (rollback to snapshot)
- Console shows `[useClasses] addClass rolled back`

**Failure:** Course stays in UI after network failure (data loss on reload — course was never saved).

**Debug:** Same as above. Also verify: after unblocking network, save again and confirm the course now persists in Supabase.

---

### 4c — Grade rollback

**Steps:**
1. Block Supabase
2. Add a grade (85/100) to a course item

**Expected:** Grade appears, then disappears when the DB write fails.

**Failure:** Grade stays visible (user thinks it was saved, but it wasn't).

---

## 5. Bad Migration Data

### 5a — Malformed JSON in localStorage

**Steps:**
1. Sign out
2. Open DevTools → Application → Local Storage → `http://localhost:3000`
3. Set `sai_classes` = `{{{not valid json`
4. Remove `sai_migrated` key if it exists
5. Sign back in

**Expected:** App loads normally. No crash. No courses migrated (bad data silently dropped).
`sai_migrated` gets set to `"true"`.

**Failure:** White screen of death, unhandled error, or app stuck loading.

**Debug:** Console → should show no uncaught errors. `loadFromLocalStorage` in `src/lib/courseUtils.ts` wraps `JSON.parse` in try/catch.

---

### 5b — Array with mixed valid and invalid entries

**Steps:**
1. Sign out
2. Set `sai_classes` to this JSON string:
```json
[
  {"id":"","name":"","items":[],"grades":[]},
  null,
  42,
  {"id":"valid-1","name":"Chemistry","items":[],"grades":[],"studyPlan":[],"code":"CHEM101","createdAt":"2025-01-01T00:00:00Z","courseInfo":{"name":"Chemistry","code":"CHEM101","instructor":"","semester":"","credits":3,"schedule":"","officeHours":""}}
]
```
3. Remove `sai_migrated`
4. Sign in

**Expected:** Only the valid entry ("Chemistry") migrates to Supabase.
Invalid entries (empty id, null, number) are silently skipped.

**Failure:** App crashes processing null/42, or saves invalid rows to Supabase.

**Debug:** Supabase → `courses` table → should have exactly 1 row for "Chemistry".
Automated test for this exact scenario: `src/lib/__tests__/courseUtils.test.ts` → "filters out invalid entries from an otherwise valid array".

---

### 5c — Incomplete course (missing studyPlan)

**Steps:**
1. Set `sai_classes` to a course object that's missing `studyPlan`:
```json
[{"id":"x1","name":"Old Course","code":"OLD101","createdAt":"2025-01-01T00:00:00Z","items":[],"grades":[],"courseInfo":{"name":"Old Course","code":"OLD101","instructor":"","semester":"","credits":0,"schedule":"","officeHours":""}}]
```
2. Remove `sai_migrated`, sign in

**Expected:** Course migrates. `studyPlan` defaults to `[]`.

**Failure:** Migration fails or throws on missing `studyPlan`.

**Debug:** `rowToSavedClass` in `courseUtils.ts` defaults `study_plan` to `[]`.

---

## 6. Multi-Device Sync

### 6a — Course appears on second device after save

**Steps:**
1. Open the app on your laptop browser (Session A) — signed in
2. Open the app on your phone or another browser (Session B) — same account, different browser
3. On Session A: analyze and save a course
4. On Session B: hard refresh

**Expected:** The new course appears on Session B after refresh.

**Failure:** Session B doesn't show the course even after refresh.

**Debug:** This is a basic read path test. Supabase → `courses` table → verify the row exists.
Both sessions should read from the same `user_id` partition.

---

### 6b — Grade entered on one device shows on another

**Steps:**
1. Session A: enter a grade (90/100) on a course
2. Session B: hard refresh

**Expected:** Grade shows on Session B.

**Failure:** Grade missing on Session B (only in Session A's UI state, not persisted).

**Debug:** Supabase → `courses.grades` JSONB column → verify the entry is there.
Console (Session A) → look for `[useClasses] setGrade failed`.

---

### 6c — Deletion on one device removes on another

**Steps:**
1. Session A: delete a course
2. Session B: hard refresh

**Expected:** Course is gone on Session B.

**Failure:** Course still shows on Session B (deletion not persisted).

---

## 7. Pro Verification Failure

### 7a — Verify endpoint called after checkout

**Steps:**
1. Start a fresh checkout flow (sign in as free user → Upgrade to Pro)
2. In DevTools Network tab, watch for the request to `/api/checkout/verify`

**Expected:** After Stripe redirects back with `?checkout=success&session_id=cs_xxx`,
a GET to `/api/checkout/verify?session_id=cs_xxx` fires automatically.
If paid, `refreshPro()` is called and the UI switches to Pro.

**Failure:** No verify request fired, or the UI doesn't update to Pro.

**Debug:** `src/app/dashboard/page.tsx` → the `useEffect` that reads URL params.
Network tab → verify the request fired and returned `{ paid: true }`.

---

### 7b — Verify request blocked (fails gracefully)

**Steps:**
1. Block `/api/checkout/verify` in DevTools Network
2. Complete a test Stripe checkout

**Expected:**
- Success banner shows ("You now have Pro access!")
- UI does NOT switch to Pro (verify failed)
- No error message shown to the user (silent failure — user will see Pro on next load once webhook fires)
- On the next page refresh, Pro status loads correctly from Supabase (webhook ran in background)

**Failure:** App crashes, shows an error, or shows Pro incorrectly without DB confirmation.

**Debug:** Console → the `.catch(() => {})` in dashboard's checkout success handler should swallow the error silently.

---

### 7c — Webhook fires after verify

**Steps:**
1. In Stripe dashboard (test mode), find a completed checkout session
2. Resend the `checkout.session.completed` webhook event
3. Check Supabase `profiles` table

**Expected:** `is_pro = true` for the user. If user was already Pro, the upsert is idempotent (no change, no error).

**Failure:** Webhook endpoint returns non-200, or `is_pro` is not updated.

**Debug:** Stripe dashboard → Webhooks → your endpoint → Recent deliveries → check response body and status.
Should return `{ received: true }` with 200.

---

## 8. Webhook Delay

### 8a — Simulated delay between verify and webhook

**Steps:**
1. With Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Complete a checkout
3. Immediately check Supabase `profiles` — `is_pro` should be `true` within ~2 seconds (set by verify route)
4. Check again after a few more seconds — webhook arrives and confirms (idempotent upsert)

**Expected:** `is_pro = true` appears first from the verify route, then the webhook confirms it.
No race condition — both paths call `upsert` which is idempotent.

**Failure:** `is_pro` briefly flips to `false` between verify and webhook (conflict). This would be a bug
in the upsert logic — should not happen since both paths set `is_pro = true`.

---

### 8b — Webhook arrives without verify (verify was blocked)

**Steps:**
1. Block `/api/checkout/verify`
2. Complete a test checkout — UI stays as Free (verify blocked)
3. Stripe CLI fires webhook → `checkout.session.completed`
4. Reload the page

**Expected:** After page reload, `usePro` fetches from DB and user sees Pro.

**Failure:** User permanently stuck as Free. This means the webhook didn't fire or the profile update failed.

**Debug:** Stripe CLI output → look for `200` response from your webhook endpoint.
Supabase `profiles` → check `is_pro` value.

---

## 9. Expired / Cancelled Subscription

### 9a — Cancellation locks Pro features

**Steps:**
1. Sign in as a Pro user
2. In Stripe test dashboard, cancel the subscription for this customer
3. Stripe sends `customer.subscription.deleted` webhook
4. Reload the app

**Expected:**
- `is_pro = false` in Supabase `profiles` table (webhook updated it)
- After reload, UI shows Free tier (no Pro badge, Study Plan locked)
- All saved courses are still present (data is NOT deleted on downgrade)

**Failure:**
- Pro features still accessible after cancellation
- User's courses are deleted (they should not be)

**Debug:** Supabase `profiles.is_pro` = false after webhook.
Supabase `courses` table → all user's courses should still be there.
Stripe dashboard → Webhooks → Recent deliveries → `customer.subscription.deleted` → 200 response.

---

### 9b — Pro reactivation after lapse

**Steps:**
1. Start a new test subscription (user who previously cancelled)
2. `checkout.session.completed` fires

**Expected:** `is_pro = true` again. All previous courses are still there.

**Failure:** Second subscription creates a new profile row (duplicate), or fails to find existing user.

**Debug:** The webhook uses `upsert` with `{ id: userId }` as the conflict key.
Supabase `profiles` should still have exactly 1 row for this user.

---

## 10. Row-Level Security / Data Ownership

### 10a — User B cannot read User A's courses

**Steps:**
1. Sign in as User A, save 2 courses
2. Sign out
3. Sign in as User B (different account)
4. Check My Courses tab

**Expected:** User B sees 0 courses (their own empty state). User A's courses are not visible.

**Failure:** User B can see User A's courses.

**Debug:** Supabase → Table Editor → `courses` → filter by `user_id` = User B's UUID → should return 0 rows.
The RLS policy `"courses: owner full access"` uses `auth.uid() = user_id`.

---

### 10b — Direct Supabase query respects RLS

**Steps:**
1. Note User A's Supabase auth UUID
2. Open Supabase SQL Editor, run as **authenticated user B** (not service role):
```sql
select * from public.courses where user_id = '<user-a-uuid>';
```

**Expected:** 0 rows returned (RLS blocks the cross-user query).

**Failure:** User A's rows are returned.

**Debug:** Verify RLS is enabled on `courses` table: Supabase → Table Editor → `courses` → click the lock icon → Row Level Security should be ON.

---

### 10c — Supabase API key does not bypass RLS

**Steps:**
1. Take your `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the public browser key)
2. Make a direct Supabase request using User B's JWT:
```bash
curl 'https://YOUR_PROJECT.supabase.co/rest/v1/courses?user_id=eq.<user-a-uuid>' \
  -H "apikey: ANON_KEY" \
  -H "Authorization: Bearer USER_B_JWT"
```

**Expected:** Empty array `[]`. RLS blocks cross-user access even with valid anon key.

**Failure:** Returns User A's courses.

**Debug:** RLS policy must be on and correctly written.
The service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS — ensure it is never exposed
in browser code or env vars prefixed with `NEXT_PUBLIC_`.

---

## 11. Mobile Layout

### 11a — Dashboard tab bar on 375px (iPhone SE width)

**Steps:**
1. DevTools → Toggle device toolbar → set width to 375px
2. Open the dashboard

**Expected:**
- Tab bar wraps cleanly or abbreviates to fit
- All 5 tab labels are readable
- No horizontal overflow on the page

**Failure:**
- Tab labels overflow off-screen
- Page scrolls horizontally

**Debug:** `src/app/dashboard/page.tsx` → `ModeToggle` component → the `flex-wrap` class should handle wrapping.
If label text is too long, shorten labels in `TAB_CONFIG` for mobile (Phase 11 polish).

---

### 11b — Course save flow on mobile

**Steps:**
1. On 375px width, analyze the sample syllabus
2. Click "Save to My Courses"

**Expected:** Save button tappable, success banner visible, no overflow.

**Failure:** Button too small to tap, or banner clips off screen.

---

### 11c — Grade entry on mobile

**Steps:**
1. My Courses → a course with items → Grade Tracker
2. Tap "+ Add grade" on any item
3. Fill in the two inputs and tap Save

**Expected:** Inputs are large enough to type in, Save button is reachable without scroll.

**Failure:** Inputs too small, keyboard pushes layout, Save button not visible.

---

## 12. Loading and Empty States

### 12a — First login, no courses

**Steps:**
1. Sign in with a fresh account that has no saved courses
2. Open the This Week tab

**Expected:** Clean empty state: calendar icon, "No courses saved yet", "Add a course" button.
No skeleton visible (loading finished quickly and found 0 courses).

**Failure:** Empty state never shows (stuck on skeleton), or shows garbled content.

**Debug:** `src/components/dashboard/ThisWeekView.tsx` → the `classes.length === 0` early return.

---

### 12b — Loading skeleton appears on slow network

**Steps:**
1. DevTools → Network → Throttle → "Slow 3G"
2. Navigate to `/dashboard`

**Expected:**
- For ~500–2000ms, This Week and My Courses tabs show the pulse skeleton (3 gray bars)
- Once courses load, skeleton disappears and real content shows

**Failure:**
- Empty state ("No courses saved yet") flashes briefly before courses load (skeleton not shown)
- Skeleton never disappears (loading state stuck)

**Debug:** `src/app/dashboard/page.tsx` → the `classesLoading` ternary around `ThisWeekView` and `CoursesDashboard`.
`useClasses.ts` → `setLoading(false)` must be called in all code paths (both happy path and error path).

---

### 12c — Pro status loading does not block course display

**Steps:**
1. Slow 3G, navigate to dashboard

**Expected:** `proLoading` does not affect whether courses display.
Courses should show regardless of whether Pro status has resolved yet.

**Failure:** Courses hidden while Pro status loads (wrong dependency).

**Debug:** In `dashboard/page.tsx`, only `classesLoading` gates the course views.
`proLoading` only affects Pro-gated UI elements (like the Study Plan lock).

---

## Quick Reference: What Breaks What

| Symptom | Most Likely Cause | First Place to Check |
|---|---|---|
| Courses missing after reload | DB write failed silently | Console for `[useClasses]` errors; Supabase `courses` table |
| Pro badge gone after reload | Webhook not firing or failing | Stripe dashboard → Webhooks → Recent deliveries |
| Pro locked out but paid | `profiles.is_pro = false` | Supabase `profiles` table; run verify route manually |
| Other user's data visible | RLS policy missing or wrong | Supabase → Authentication → Policies |
| Optimistic update not reverting | Rollback logic missing | Console for `rolled back` message; check `dbSync` in useClasses |
| Migration not running | `sai_migrated` already set | DevTools → Local Storage → delete `sai_migrated` key |
| Build fails with TS error | Type mismatch in dbSync | Check `PromiseLike` vs `Promise` in useClasses |
| Webhook returns 400 | Missing env var or bad signature | Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard |
