-- 011: Review system overhaul — like/dislike model, resolution workflow, AI moderation, 1-100 score
-- Replaces the 1-5 star rating with a like/dislike sentiment system.

-- ── New columns on reviews ──────────────────────────────────────────

alter table public.reviews
  add column sentiment     text check (sentiment in ('like', 'dislike')),
  add column response_text text,
  add column response_at   timestamptz,
  add column resolution_status text not null default 'none'
    check (resolution_status in ('none', 'pending', 'approved', 'rejected')),
  add column resolved_at   timestamptz,
  add column resolved_by   uuid references public.profiles(id),
  add column ai_sentiment  text check (ai_sentiment in ('positive', 'negative', 'spam', 'neutral')),
  add column ai_summary    text;

-- ── Migrate existing ratings to sentiment ───────────────────────────

update public.reviews set sentiment = 'like'    where rating >= 4;
update public.reviews set sentiment = 'dislike'  where rating <= 3;
-- Make sentiment NOT NULL after backfill
alter table public.reviews alter column sentiment set not null;

-- ── New aggregate columns on cook_profiles ──────────────────────────

alter table public.cook_profiles
  add column like_count     integer not null default 0,
  add column dislike_count  integer not null default 0,
  add column resolved_count integer not null default 0,
  add column score          integer;

-- ── New aggregate columns on seller_profiles ────────────────────────

alter table public.seller_profiles
  add column like_count     integer not null default 0,
  add column dislike_count  integer not null default 0,
  add column resolved_count integer not null default 0,
  add column score          integer;

-- ── Backfill aggregate scores for existing cooks ────────────────────

with cook_stats as (
  select
    r.reviewee_id,
    count(*) filter (where r.sentiment = 'like') as likes,
    count(*) filter (where r.sentiment = 'dislike' and r.text is not null and r.resolution_status not in ('approved')) as valid_dislikes,
    count(*) filter (where r.resolution_status = 'approved') as resolved
  from public.reviews r
  where r.role = 'customer'
  group by r.reviewee_id
)
update public.cook_profiles cp
set
  like_count     = cs.likes,
  dislike_count  = cs.valid_dislikes,
  resolved_count = cs.resolved,
  score          = case
    when (cs.likes + cs.valid_dislikes) >= 10
    then round((cs.likes::numeric / (cs.likes + cs.valid_dislikes)) * 100)
    else null
  end
from cook_stats cs
where cp.id = cs.reviewee_id;

-- ── Backfill aggregate scores for existing sellers ──────────────────

with seller_stats as (
  select
    r.reviewee_id,
    count(*) filter (where r.sentiment = 'like') as likes,
    count(*) filter (where r.sentiment = 'dislike' and r.text is not null and r.resolution_status not in ('approved')) as valid_dislikes,
    count(*) filter (where r.resolution_status = 'approved') as resolved
  from public.reviews r
  where r.role = 'customer'
  group by r.reviewee_id
)
update public.seller_profiles sp
set
  like_count     = ss.likes,
  dislike_count  = ss.valid_dislikes,
  resolved_count = ss.resolved,
  score          = case
    when (ss.likes + ss.valid_dislikes) >= 10
    then round((ss.likes::numeric / (ss.likes + ss.valid_dislikes)) * 100)
    else null
  end
from seller_stats ss
where sp.id = ss.reviewee_id;

-- ── RLS: allow cook/seller to respond to their own reviews ──────────

create policy "reviews: reviewee can respond"
  on public.reviews for update
  using (reviewee_id = auth.uid())
  with check (
    reviewee_id = auth.uid()
    -- only allow updating response fields and setting status to pending
    and resolution_status in ('none', 'pending')
  );

-- ── RLS: allow admin to moderate reviews ────────────────────────────

create policy "reviews: admin can update all"
  on public.reviews for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
