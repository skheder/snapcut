-- SnapCut Database Schema
-- Go to: Supabase Dashboard → SQL Editor → paste this → Run

create table users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique not null,
  password_hash       text not null,
  name                text not null,
  phone               text,
  role                text not null check (role in ('customer','barber')),
  stripe_customer_id  text,
  referral_code       text unique default substr(md5(random()::text), 1, 8),
  referral_credits    numeric(10,2) default 0,
  created_at          timestamptz default now()
);

create table barbers (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid references users(id) on delete cascade,
  specialty                  text not null default 'General',
  status                     text default 'offline' check (status in ('available','busy','offline')),
  rating                     numeric(3,2) default 0,
  review_count               int default 0,
  total_cuts                 int default 0,
  is_featured                boolean default false,
  base_price                 numeric(10,2) not null default 35,
  lat                        double precision,
  lng                        double precision,
  location_updated_at        timestamptz,
  eta_minutes                int default 10,
  stripe_account_id          text,
  stripe_onboarding_complete boolean default false,
  created_at                 timestamptz default now()
);

create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid unique references users(id) on delete cascade,
  plan                   text not null check (plan in ('basic','pro','vip')),
  status                 text default 'active' check (status in ('active','cancelled','past_due')),
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  cancel_at_period_end   boolean default false,
  current_period_end     timestamptz,
  created_at             timestamptz default now()
);

create table bookings (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid references users(id),
  barber_id         uuid references barbers(id),
  service_id        text not null,
  addon_ids         text[] default '{}',
  status            text default 'pending' check (status in (
                      'pending','accepted','en_route','arrived',
                      'in_progress','completed','cancelled')),
  base_price        numeric(10,2) not null,
  surge_amount      numeric(10,2) default 0,
  addon_amount      numeric(10,2) default 0,
  tip_amount        numeric(10,2) default 0,
  total_amount      numeric(10,2) not null,
  platform_fee      numeric(10,2) not null,
  address           text,
  payment_intent_id text,
  review_rating     int check (review_rating between 1 and 5),
  review_text       text,
  created_at        timestamptz default now(),
  completed_at      timestamptz
);

create index on barbers(status);
create index on barbers(is_featured);
create index on bookings(customer_id);
create index on bookings(barber_id);
create index on bookings(status);
create index on subscriptions(user_id);
