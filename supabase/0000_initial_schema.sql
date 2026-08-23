begin;

do $$ begin create type user_role as enum ('user', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type studio_form_status as enum ('draft', 'published'); exception when duplicate_object then null; end $$;
do $$ begin create type studio_question_kind as enum ('short_text', 'long_text', 'email', 'phone', 'single_choice', 'multiple_choice', 'consent'); exception when duplicate_object then null; end $$;

create table if not exists users (
  id serial primary key,
  open_id varchar(64) not null unique,
  name text,
  email varchar(320),
  login_method varchar(64),
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_signed_in timestamptz not null default now()
);

create table if not exists applications (
  id serial primary key,
  full_name varchar(150) not null,
  college varchar(200) not null,
  department varchar(160) not null,
  study_year varchar(40) not null,
  whatsapp varchar(32) not null,
  email varchar(320) not null,
  track varchar(80) not null,
  tools text not null,
  focus text not null,
  portfolio_link varchar(1000),
  goal varchar(180) not null,
  workstation varchar(180) not null,
  consent boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists studio_forms (
  id serial primary key,
  owner_id integer not null references users(id) on delete cascade,
  title varchar(180) not null,
  slug varchar(140) not null unique,
  description text,
  status studio_form_status not null default 'draft',
  success_message text not null,
  redirect_url varchar(1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists studio_questions (
  id serial primary key,
  form_id integer not null references studio_forms(id) on delete cascade,
  kind studio_question_kind not null,
  label varchar(300) not null,
  help_text text,
  options text,
  required boolean not null default false,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists studio_responses (
  id serial primary key,
  form_id integer not null references studio_forms(id) on delete cascade,
  answers text not null,
  created_at timestamptz not null default now()
);

create index if not exists applications_created_at_idx on applications (created_at desc);
create index if not exists studio_forms_owner_updated_at_idx on studio_forms (owner_id, updated_at desc);
create index if not exists studio_questions_form_position_idx on studio_questions (form_id, position);
create index if not exists studio_responses_form_created_at_idx on studio_responses (form_id, created_at desc);

commit;
