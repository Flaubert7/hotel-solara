-- Agrega estado de pago a reservas (ejecutar una sola vez en SQL Editor)
alter table reservations
  add column if not exists payment_status varchar(20) default 'PENDIENTE',
  add column if not exists invoice_number varchar(50),
  add column if not exists paid_amount_usd decimal(10,2),
  add column if not exists caja_ingreso_id int;
