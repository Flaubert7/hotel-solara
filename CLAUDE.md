# CLAUDE.md — Sistema de Gestión Hotel Solara

Lee este archivo completo antes de hacer cualquier cosa en este proyecto.

---

## 1. ¿Qué es este proyecto?

Aplicación web de gestión interna para el **Hotel Solara** (Paraguay). No es para clientes — es para el dueño y el personal de recepción. Reemplaza un sistema de Excel (.xlsm) que el hotel usaba hasta ahora.

Existe un segundo hotel (Salar de Uyuni, Bolivia) que se integrará en una fase futura. Por ahora el foco es solo Solara Paraguay.

---

## 2. Stack técnico

- **Frontend:** Next.js + Tailwind CSS
- **Base de datos + Auth:** Supabase (PostgreSQL)
- **Cámaras:** Streams RTSP de cámaras Dahua, convertidos a WebRTC con `go2rtc`
- **Lenguaje:** Todo en español en la UI

---

## 3. Roles de usuario

| Rol | Acceso |
|---|---|
| `admin` | Todo: disposición, reservas, limpieza, inventario, cámaras, reportes |
| `worker` | Disposición, reservas, limpieza, inventario — SIN cámaras ni reportes |

El worker es básicamente la recepción (una sola PC, una sola sesión). El admin es el dueño del hotel.

Auth manejado con Supabase Auth + tabla `user_profiles` que guarda el rol.

---

## 4. El hotel — habitaciones

**24 habitaciones en 4 pisos:**

| Piso | Habitaciones | Tipos |
|---|---|---|
| 1 | 101, 102, 103, 104, 105, 106 | Mini Studio, Studio, Loft, Flat, Studio, Studio |
| 2 | 201, 202, 203, 204, 205, 206 | Mini Studio, Studio, Loft, Flat, Studio, Studio |
| 3 | 301, 302, 303, 304, 305, 306 | Mini Studio, Studio, Loft, Flat, Studio, Studio |
| 4 | 401, 402, 403, 404, 405, 406 | Mini Studio, Studio, Loft, Flat, Studio, Studio |

**Regla de tipos por número:**
- X01 = Mini Studio
- X02 = Studio
- X03 = Loft
- X04 = Flat
- X05 = Studio
- X06 = Flat Plus (también llamado Studio en algunos contextos)

**Tipos de habitación disponibles:** Mini Studio, Studio, Loft, Flat, Flat Plus

**Dos modalidades:**
- `HOTELERIA` — huéspedes normales con reserva
- `COLIVING` — contratos de larga estadía

**Huéspedes de coliving PERMANENTE — NUNCA modificar, NUNCA mover:**
- JACKEWAY → habitación 303
- BROCK AWAY → habitación 304
- THOMAS → habitación 406
- WAYRA → habitación 201 (personal del hotel — dueño y pareja)

> Nota (22/06/2026): THYM dejó de ser coliving permanente. La habitación 405 ya rota con huéspedes normales de hotelería, igual que cualquier otra.

---

## 5. Módulos de la app

### 5.1 Dashboard (home)
- Ocupación del día en porcentaje
- Habitaciones libres / ocupadas / en limpieza / en mantenimiento
- Check-ins de hoy pendientes
- Check-outs de hoy pendientes
- Alertas rápidas

### 5.2 Disposición (vista principal del worker)
- Cuadrícula visual: 4 pisos × 6 habitaciones
- Cada celda muestra el estado de la habitación con color:
  - 🟢 Verde = disponible
  - 🔴 Rojo = ocupada (muestra nombre del huésped)
  - 🟡 Amarillo = en limpieza
  - 🔵 Azul = coliving permanente
  - ⚫ Gris = mantenimiento
- Click en una habitación → panel lateral con detalle (huésped, fechas, info de la reserva)
- Navegación por mes (← →)

### 5.3 Reservas
- Lista de reservas del mes con filtros (estado, agencia, tipo de hab)
- Vista de calendario
- Formulario nueva reserva (ver sección 6 — Reglas de negocio)
- Estados: CONFIRMADO (azul) / CANCELADO (rojo)
- Agencias: Booking, Airbnb, WhatsApp, Directo, Instagram, TikTok

### 5.4 Limpieza
- Lista del día: qué habitaciones tienen check-in o check-out hoy
- Campos: nombre huésped, hab, día entrada, día salida, noches, ETA, PAX, desayuno (SI/NO), tipo de cama, tipo hab, tarifa, total
- El personal de limpieza puede marcar habitaciones como limpias/listas

### 5.5 Inventario
- Stock de insumos de limpieza y activos del hotel
- Items: Trapo de piso, Escurridor, Escoba, Palita de basura, Papel higiénico, Suavizante, Desodorante aerosol, Jabón líquido, Lavandina, Desodorante ambiente, Detergente, Bolsas (varios tipos), Jaboncito, Shampoo, Acondicionador, Paños multiuso, Esponja, Papel secamano
- Activos para prestar: Planchas, Mesa de planchar, Hervidora
- Registro diario de entradas y salidas con stock calculado

### 5.6 Cámaras (solo admin)
- Streams en vivo de cámaras Dahua del hotel
- Sistema actual del cliente: app DMSS (Dahua Mobile Surveillance System)
- Cámaras exponen streams RTSP nativos
- Implementar con `go2rtc` como relay (RTSP → WebRTC) para mostrar en el browser
- Credenciales RTSP: pendiente de obtener del cliente (IP del NVR, usuario, contraseña)
- URL RTSP típica Dahua: `rtsp://admin:PASSWORD@IP:554/cam/realmonitor?channel=1&subtype=0`

### 5.7 Reportes (solo admin)
- Ingresos del mes
- Ocupación por período
- Reservas por agencia (breakdown Booking vs Airbnb vs Directo etc.)
- Exportar a PDF o Excel

---

## 6. Reglas de negocio críticas

Estas reglas existían en el sistema Excel y DEBEN respetarse en la app:

```
❌ NUNCA hacer doble reserva en la misma habitación para fechas superpuestas
❌ NUNCA modificar ni reasignar habitaciones de coliving permanente
❌ NUNCA registrar una reserva en solo 1 ó 2 módulos — SIEMPRE en los 3 (reservas + disposición visual + limpieza)
❌ NUNCA duplicar un huésped en limpieza — 1 sola fila por reserva en la fecha de check-in

✅ SIEMPRE verificar disponibilidad antes de confirmar
✅ SIEMPRE guardar nombres en MAYÚSCULAS
✅ SIEMPRE confirmar número de habitación asignada antes de guardar
✅ Al borrar una reserva: borrar de las 3 tablas (reservations, cleaning, y actualizar el estado visual)
```

---

## 7. Schema de base de datos (Supabase)

```sql
-- Habitaciones
create table rooms (
  id serial primary key,
  number varchar(3) not null,        -- '101', '203', '406'
  floor int not null,                 -- 1, 2, 3, 4
  type varchar(20) not null,          -- 'Mini Studio', 'Studio', 'Loft', 'Flat', 'Flat Plus'
  is_permanent_coliving boolean default false,
  coliving_guest varchar(100)         -- nombre si es coliving fijo
);

-- Reservas
create table reservations (
  id serial primary key,
  room_id int references rooms(id),
  guest_name varchar(200) not null,
  check_in date not null,
  check_out date not null,
  nights int not null,
  status varchar(20) default 'CONFIRMADO',  -- 'CONFIRMADO', 'CANCELADO'
  agency varchar(50),                -- 'Booking', 'Airbnb', 'WhatsApp', 'Directo', 'Instagram', 'TikTok'
  pax int,
  eta varchar(50),
  bed_type varchar(20),              -- 'MATRIMONIAL', 'INDIVIDUALES'
  breakfast boolean default false,
  rate_usd decimal(10,2),
  deposit decimal(10,2),
  phone varchar(50),
  payment_method varchar(100),
  notes text,
  modality varchar(20) default 'HOTELERIA',  -- 'HOTELERIA', 'COLIVING'
  created_at timestamptz default now()
);

-- Limpieza
create table cleaning (
  id serial primary key,
  reservation_id int references reservations(id),
  room_id int references rooms(id),
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
  notes text
);

-- Inventario — items
create table inventory_items (
  id serial primary key,
  name varchar(200) not null,
  code varchar(50),
  initial_stock int default 0,
  category varchar(50)               -- 'LIMPIEZA', 'ACTIVOS'
);

-- Inventario — registros diarios
create table inventory_records (
  id serial primary key,
  item_id int references inventory_items(id),
  date date not null,
  intake int default 0,
  output int default 0,
  stock int default 0
);

-- Perfiles de usuario
create table user_profiles (
  id uuid references auth.users(id) primary key,
  role varchar(20) default 'worker',  -- 'admin', 'worker'
  hotel varchar(100) default 'Solara Paraguay'
);
```

---

## 8. Migración desde Excel

Hay un archivo `SISTEMA_SOLARA_FINAL_2026_ESCRITORIO.xlsm` en la raíz del proyecto con todos los datos históricos del hotel.

**Hojas relevantes del Excel:**
- `MAYO 2026`, `JUNIO 2026`, etc. — Disposición mensual (filas=habitaciones, columnas=días, celdas=nombre huésped)
- `RESERVAS MAY`, `RESERVAS JUN`, etc. — Datos completos de cada reserva
- `LIMP MAY`, `LIMP JUN`, etc. — Registros de limpieza
- `INVENTARIO` — Stock de insumos
- `📋 CONTEXTO CLAUDE` — Documentación completa del sistema original

**Script de migración:** Usar `openpyxl` en Python para leer el .xlsm y poblar Supabase vía su API REST o cliente Python. Migrar en este orden: rooms → reservations → cleaning → inventory_items → inventory_records.

---

## 9. Variables de entorno necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # solo para el script de migración

# Cámaras (completar cuando el cliente provea los datos)
RTSP_USER=admin
RTSP_PASSWORD=pendiente
RTSP_HOST=pendiente
GO2RTC_URL=http://localhost:1984
```

---

## 10. Fases del proyecto

**Fase 1 (actual):**
1. Script de migración Excel → Supabase
2. Auth (login worker / admin)
3. Dashboard
4. Vista de disposición (read-only mientras se migra)
5. Lista de reservas
6. Vista de limpieza
7. Cámaras para admin (cuando lleguen credenciales Dahua)

**Fase 2:**
1. Formulario de nueva reserva (reemplaza el REGISTRO del Excel)
2. Formulario de borrado de reserva
3. Gestión de inventario con edición
4. Reportes y exportación
5. Integración del segundo hotel (Salar de Uyuni, Bolivia)

---

## 11. Contexto adicional

- La **Caja** (ingresos/egresos financieros) está en un archivo separado `CAJA 2026 SOLARA.xlsx` con ~4600 fórmulas. No forma parte de este sistema por ahora.
- El proyecto fue construido y documentado con ayuda de Claude (claude.ai). El CLAUDE.md fue generado a partir de esa conversación.
- El desarrollador es **Andrés Flores Crespo** (Bolivia), Video Editor y Diseñador Gráfico con experiencia en Python, ffmpeg, ExtendScript y automatización de workflows Adobe.

---

*Última actualización: Mayo 2026*
