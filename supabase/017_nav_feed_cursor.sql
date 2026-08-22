-- Exact NAV feed checkpoint. A timestamp is not a safe cursor because several
-- feed pages can share the same modification time. Keep cursor_time nullable
-- for backwards compatibility, but NAV resumes from cursor_url/page_id.
alter table public.import_cursors
  alter column cursor_time drop not null,
  add column if not exists cursor_url text,
  add column if not exists page_id text,
  add column if not exists etag text,
  add column if not exists last_modified text,
  add column if not exists initialized_at timestamptz;

comment on column public.import_cursors.cursor_url is
  'Exact feed page to request next; for the open tail page this URL is revisited with validators.';
comment on column public.import_cursors.page_id is
  'NAV page identifier for diagnostics; cursor_url remains the authoritative checkpoint.';

