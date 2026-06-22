-- ============================================================
-- Hotel Solara — Schema completo
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Habitaciones
create table if not exists rooms (
  id serial primary key,
  number varchar(3) not null unique,
  floor int not null,
  type varchar(20) not null,
  is_permanent_coliving boolean default false,
  coliving_guest varchar(100)
);

-- Reservas
create table if not exists reservations (
  id serial primary key,
  room_id int references rooms(id) on delete restrict,
  guest_name varchar(200) not null,
  check_in date not null,
  check_out date not null,
  nights int not null,
  status varchar(20) default 'CONFIRMADO',
  agency varchar(50),
  pax int,
  eta varchar(50),
  bed_type varchar(20),
  breakfast boolean default false,
  rate_usd decimal(10,2),
  deposit decimal(10,2),
  phone varchar(50),
  payment_method varchar(100),
  notes text,
  modality varchar(20) default 'HOTELERIA',
  payment_status varchar(20) default 'PENDIENTE',  -- 'PENDIENTE', 'PAGADO'
  invoice_number varchar(50),
  paid_amount_usd decimal(10,2),
  caja_ingreso_id int,  -- referencia al ingreso generado en caja_ingresos, si existe
  created_at timestamptz default now()
);

-- Limpieza
create table if not exists cleaning (
  id serial primary key,
  reservation_id int references reservations(id) on delete cascade,
  room_id int references rooms(id) on delete restrict,
  guest_name varchar(200),
  check_in_date date,
  check_out_date date,
  nights int,
  eta varchar(50),
  pax int,
  breakfast boolean,
  bed_type varchar(20),
  room_type varchar(20),
  rate_usd decimal(10,2),
  total_usd decimal(10,2),
  notes text,
  is_clean boolean default false
);

-- Inventario — items
create table if not exists inventory_items (
  id serial primary key,
  name varchar(200) not null,
  code varchar(50),
  initial_stock int default 0,
  category varchar(50)
);

-- Inventario — registros diarios
create table if not exists inventory_records (
  id serial primary key,
  item_id int references inventory_items(id) on delete cascade,
  date date not null,
  intake int default 0,
  output int default 0,
  stock int not null
);

-- Perfiles de usuario
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role varchar(20) default 'worker',
  hotel varchar(100) default 'Solara Paraguay'
);

-- ============================================================
-- Poblar habitaciones (24 hab, 4 pisos × 6)
-- ============================================================
insert into rooms (number, floor, type, is_permanent_coliving, coliving_guest) values
  ('101', 1, 'Mini Studio',  false, null),
  ('102', 1, 'Studio',       false, null),
  ('103', 1, 'Loft',         false, null),
  ('104', 1, 'Flat',         false, null),
  ('105', 1, 'Studio',       false, null),
  ('106', 1, 'Flat Plus',    false, null),
  ('201', 2, 'Mini Studio',  false, null),
  ('202', 2, 'Studio',       false, null),
  ('203', 2, 'Loft',         false, null),
  ('204', 2, 'Flat',         false, null),
  ('205', 2, 'Studio',       false, null),
  ('206', 2, 'Flat Plus',    false, null),
  ('301', 3, 'Mini Studio',  false, null),
  ('302', 3, 'Studio',       false, null),
  ('303', 3, 'Loft',         true,  'JACKEWAY'),
  ('304', 3, 'Flat',         true,  'BROCK AWAY'),
  ('305', 3, 'Studio',       false, null),
  ('306', 3, 'Flat Plus',    false, null),
  ('401', 4, 'Mini Studio',  false, null),
  ('402', 4, 'Studio',       false, null),
  ('403', 4, 'Loft',         false, null),
  ('404', 4, 'Flat',         false, null),
  ('405', 4, 'Studio',       true,  'THYM'),
  ('406', 4, 'Flat Plus',    true,  'THOMAS')
on conflict (number) do nothing;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table rooms enable row level security;
alter table reservations enable row level security;
alter table cleaning enable row level security;
alter table inventory_items enable row level security;
alter table inventory_records enable row level security;
alter table user_profiles enable row level security;

-- Usuarios autenticados pueden leer/escribir todo (el rol se controla en la app)
create policy "authenticated_all" on rooms for all to authenticated using (true) with check (true);
create policy "authenticated_all" on reservations for all to authenticated using (true) with check (true);
create policy "authenticated_all" on cleaning for all to authenticated using (true) with check (true);
create policy "authenticated_all" on inventory_items for all to authenticated using (true) with check (true);
create policy "authenticated_all" on inventory_records for all to authenticated using (true) with check (true);
create policy "own_profile" on user_profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
