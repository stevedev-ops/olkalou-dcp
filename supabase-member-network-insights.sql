-- Precompute hierarchical insights for member detail panels.
create or replace function public.member_network_insights(member_id int)
returns table (
  member_id int,
  tier int,
  network_depth int,
  network_size int,
  direct_invites int,
  lineage jsonb,
  direct_inviter jsonb,
  top_mobilizer jsonb
)
stable language sql as $$
with recursive lineage_cte(ordering, id, full_name, ward, polling_station, referral_code, yob, referred_by) as (
  select 0, id, full_name, ward, polling_station, referral_code, yob, referred_by
  from public.dcp_members
  where id = member_id
  union all
  select lineage_cte.ordering + 1, parent.id, parent.full_name, parent.ward, parent.polling_station, parent.referral_code, parent.yob, parent.referred_by
  from public.dcp_members parent
  join lineage_cte on parent.id = lineage_cte.referred_by
),
downline as (
  select id, referred_by, 1 as depth
  from public.dcp_members
  where referred_by = member_id
  union all
  select child.id, child.referred_by, downline.depth + 1
  from public.dcp_members child
  join downline on child.referred_by = downline.id
  where downline.depth < 10
)
select
  member_id,
  coalesce((select max(ordering) from lineage_cte), 0) + 1 as tier,
  coalesce((select max(depth) from downline), 0) as network_depth,
  coalesce((select count(*) from downline), 0) as network_size,
  coalesce((select count(*) from downline where depth = 1), 0) as direct_invites,
  (select jsonb_agg(jsonb_build_object(
      'id', id,
      'full_name', full_name,
      'ward', ward,
      'polling_station', polling_station,
      'referral_code', referral_code,
      'yob', yob
    ) order by ordering asc) from lineage_cte) as lineage,
  (select jsonb_build_object(
      'id', id,
      'full_name', full_name,
      'ward', ward,
      'polling_station', polling_station,
      'referral_code', referral_code,
      'yob', yob
    )
    from lineage_cte
    where ordering = 1
    limit 1
  ) as direct_inviter,
  (select jsonb_build_object(
      'id', id,
      'full_name', full_name,
      'ward', ward,
      'polling_station', polling_station,
      'referral_code', referral_code,
      'yob', yob
    )
    from lineage_cte
    order by ordering desc
    limit 1
  ) as top_mobilizer;
$$;
