# Implementation plan: avatar equipment fit and GP prices

Track: `avatar_equipment_gp_20261127`. Lane: light. One phase.
The brief is open item 6 of the retired `QUEUE.md` of 2026-11-27.

The archived `avatar_system_20261001` built the base, the fit contract, the pack, and the
composer. This card holds the two results that remain.

## Phase 1: Fit and price

- [ ] Task: Close the 28 `later` rows of `docs/avatar-catalog.tsv`. Each row passes
  `./forge check <piece>` on `avatar-base` with `result ok`, or it moves to `excluded` with its
  reason in `docs/equipment-fit.md`.
- [x] Task: Measure the median weekly GP per active Primary student. (PM 2026-11-27)
  Definition: an active Primary student is a `STUDENT` who has a school and who earned XP in at
  least one of the last 4 full weeks. A student-week is one ISO week of one active student.
  Weekly GP is the XP of that week converted with `GP_WEIGHTS` of
  `packages/domain/src/primary-avatar/gp.ts`: 1 GP per XP, and the three rating types give 0.
  The daily cap of 50 GP is not applied; the ledger shows that the cap never bound.
  Result 2026-11-27: median 28 GP in a week with XP (p25 10, p75 33.5). Across all 60
  student-weeks the median is 0 and p75 is 0.25. 15 active students, 60 student-weeks, 15 with
  XP, 337 GP in total, mean 5.62 GP per student-week, median student total 28 GP per 4 weeks.
  Weeks: 2026-10-26 to 2026-11-01, 11-02 to 11-08, 11-09 to 11-15, 11-16 to 11-22 (Bangkok).
  Caveat: 317 of the 337 GP fell in the week of 11-16, so the number is provisional.
  Source: live `primary_v2`, read-only, aggregates only, 2026-11-27. Tables `xp_logs`, `users`,
  `primary_gp_ledger`. The `primary_gp_ledger` cross-check gives the same 337 GP and the same
  median of 28.
  Query:
  ```sql
  with b as (select timestamp '2026-10-25 17:00:00' ws_utc, timestamp '2026-11-22 17:00:00' we_utc),
  ev as (select l.user_id, l.xp_earned,
    ((l.created_at at time zone 'UTC') at time zone 'Asia/Bangkok')::date bkk_date,
    case when l.activity_type in ('ARTICLE_RATING','STORIES_RATING','CHAPTER_RATING') then 0 else l.xp_earned end gp
    from xp_logs l, b where l.created_at >= b.ws_utc and l.created_at < b.we_utc),
  st as (select e.user_id, date_trunc('week', e.bkk_date::timestamp)::date wk, sum(e.gp)::int gp
    from ev e join users u on u.id = e.user_id where u.role = 'STUDENT' and u.school_id is not null group by 1,2),
  active as (select distinct user_id from st),
  weeks(wk) as (values (date '2026-10-26'),(date '2026-11-02'),(date '2026-11-09'),(date '2026-11-16')),
  grid as (select a.user_id, w.wk, coalesce(s.gp,0)::int gp from active a cross join weeks w left join st s on s.user_id = a.user_id and s.wk = w.wk)
  select (select count(distinct user_id) from active) active_students,
    (select count(*) from grid) student_weeks,
    (select count(*) from grid where gp > 0) nonzero_student_weeks,
    (select sum(gp) from grid) total_gp,
    (select round(avg(gp)::numeric,2) from grid) mean_all,
    (select percentile_cont(0.5) within group (order by gp) from grid) median_all,
    (select percentile_cont(0.75) within group (order by gp) from grid) p75_all,
    (select percentile_cont(0.5) within group (order by gp) from grid where gp > 0) median_nonzero,
    (select percentile_cont(0.25) within group (order by gp) from grid where gp > 0) p25_nonzero,
    (select percentile_cont(0.75) within group (order by gp) from grid where gp > 0) p75_nonzero,
    (select percentile_cont(0.5) within group (order by t) from (select sum(gp) t from grid group by user_id) x) median_student_4wk;
  ```
- [ ] Task: Replace the placeholder slot bases of the GP price with the measured median. It needs
  a price policy decision (how many active weeks one slot base costs) and Daniel's approval of the
  public price. The measured median of 28 GP per active week fits the current tier 1 range of 20 to
  70 GP; a mainhand or a chest piece at a base of 50 GP costs about two active weeks. It also needs
  a new measurement when more than one week holds activity.
- [ ] Task: Hand the PM the item list, the GP prices, and the equip sockets for the Primary
  Advantage shop. No price is public before Daniel approves it.
