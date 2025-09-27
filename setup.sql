-- Create users table
create table if not exists users (
  id text primary key,
  username text not null,
  gamepass text not null,
  created_at timestamp default now()
);

-- Create messages table
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id) on delete cascade,
  sender text not null,
  text text not null,
  created_at timestamp default now()
);

-- Enable Row Level Security (RLS)
alter table users enable row level security;
alter table messages enable row level security;

-- Policies: allow anon (frontend) to read & insert
create policy "Allow anon read users" on users
for select using (true);

create policy "Allow anon insert users" on users
for insert with check (true);

create policy "Allow anon read messages" on messages
for select using (true);

create policy "Allow anon insert messages" on messages
for insert with check (true);
