create table if not exists app_users (
  id text primary key,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  status text not null default 'recording' check (status in ('recording', 'paused', 'stopped')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists events (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  type text not null,
  url text,
  domain text,
  title text,
  query text,
  engine text,
  referrer text,
  transition text,
  tab_id integer,
  occurred_at timestamptz not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists events_user_session_idx on events(user_id, session_id, occurred_at);
create index if not exists events_user_type_idx on events(user_id, type);
create index if not exists events_domain_idx on events(domain);

create table if not exists rabbit_holes (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  title text not null,
  description text not null,
  topics jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  entities jsonb not null default '[]'::jsonb,
  page_ids jsonb not null default '[]'::jsonb,
  confidence double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists rabbit_holes_user_session_idx on rabbit_holes(user_id, session_id, created_at desc);
