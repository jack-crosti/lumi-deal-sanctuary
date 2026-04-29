
-- Extend activity_event enum with the missing event types
alter type public.activity_event add value if not exists 'dashboard_view';
alter type public.activity_event add value if not exists 'hero_view';
alter type public.activity_event add value if not exists 'documents_section_view';
alter type public.activity_event add value if not exists 'lease_view';
alter type public.activity_event add value if not exists 'call_request';

-- Capture device type per event (mobile / tablet / desktop)
alter table public.buyer_activity
  add column if not exists device_type text;

create index if not exists buyer_activity_buyer_business_idx
  on public.buyer_activity (buyer_id, business_id, created_at desc);

create index if not exists buyer_activity_event_type_idx
  on public.buyer_activity (event_type);
