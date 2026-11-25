-- Jalankan di Supabase: SQL Editor > New query > Run.
-- Jika tabel "transactions" sudah ada dengan kolom berbeda, perbaiki dulu strukturnya
-- (mis. hapus tabel lama bila isinya belum penting: drop table public.transactions;).

create table if not exists public.transactions (
  id         bigint generated always as identity primary key,
  room       text   not null,
  type       text   not null check (type in ('in','out')),
  amt        bigint not null check (amt > 0),
  cat        text   not null,
  date       date   not null,
  note       text   not null default '',
  created_at timestamptz not null default now()
);

create index if not exists transactions_room_date_idx
  on public.transactions (room, date desc);

alter table public.transactions enable row level security;

drop policy if exists "anon baca"   on public.transactions;
drop policy if exists "anon tambah" on public.transactions;
drop policy if exists "anon hapus"  on public.transactions;

create policy "anon baca"   on public.transactions for select to anon using (true);
create policy "anon tambah" on public.transactions for insert to anon with check (true);
create policy "anon hapus"  on public.transactions for delete to anon using (true);

-- Aktifkan Realtime untuk tabel ini
do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null;
end $$;
