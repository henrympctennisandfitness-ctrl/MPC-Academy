-- supabase/tests/local/12_post_0011_data_moved.sql
--
-- LOCAL TEST HARNESS ONLY — NEVER RUN THIS ON A SUPABASE PROJECT.
--
-- Proves 0011 moved legacy notes verbatim, kept review timestamps, and did not
-- publish anything on a coach's behalf.

do $$
declare n record;
begin
  select * into n from public.coach_review_private_notes
    where review_id = '42000000-0000-4000-a000-000000000001';
  if not found or n.body <> 'legacy private note' then
    raise exception 'DATA-MOVE note was not copied verbatim';
  end if;
  if n.author_id <> '40000000-0000-4000-a000-000000000002' then
    raise exception 'DATA-MOVE note author was not preserved';
  end if;
  if exists (select 1 from public.coach_review_private_notes
             where review_id = '42000000-0000-4000-a000-000000000002') then
    raise exception 'DATA-MOVE created a note for a review that had none';
  end if;
  if exists (select 1 from public.coach_reviews where coach_notes is not null) then
    raise exception 'DATA-MOVE old column was not cleared';
  end if;
  if exists (select 1 from public.coach_reviews
             where id::text like '42000000-%' and updated_at <> '2026-01-02T00:00:00Z') then
    raise exception 'DATA-MOVE review updated_at changed';
  end if;
  if exists (select 1 from public.coach_reviews
             where id::text like '42000000-%' and (feedback is null or published_at is not null)) then
    raise exception 'DATA-MOVE legacy feedback lost, or published without a coach decision';
  end if;
  raise notice 'PASS 0011 data move';
end $$;
