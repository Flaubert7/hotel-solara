-- Ingresos de caja
create table if not exists caja_ingresos (
  id serial primary key,
  fecha date not null,
  categoria varchar(100),
  nombre varchar(200),
  detalle text,
  forma_pago varchar(100),
  monto_gs decimal(15,2) default 0,
  monto_usd decimal(10,2) default 0,
  nro_cbte varchar(100),
  mes varchar(7) not null,  -- '2026-03'
  created_at timestamptz default now()
);

-- Egresos de caja
create table if not exists caja_egresos (
  id serial primary key,
  fecha date not null,
  nro_recibo varchar(100),
  nro_factura varchar(100),
  detalle text,
  monto_gs decimal(15,2) default 0,
  monto_usd decimal(10,2) default 0,
  mes varchar(7) not null,
  created_at timestamptz default now()
);

-- Retiros administración
create table if not exists caja_administracion (
  id serial primary key,
  fecha date not null,
  retiro_gs decimal(15,2) default 0,
  retiro_usd decimal(10,2) default 0,
  descripcion text,
  mes varchar(7) not null,
  created_at timestamptz default now()
);

-- RLS
alter table caja_ingresos enable row level security;
alter table caja_egresos enable row level security;
alter table caja_administracion enable row level security;

create policy "Admin full access ingresos" on caja_ingresos for all using (
  exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access egresos" on caja_egresos for all using (
  exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access admin" on caja_administracion for all using (
  exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);
