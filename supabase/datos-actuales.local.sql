-- Datos que tenías en la base local (server/data/tienda.db). Ejecutar UNA vez en Supabase → SQL Editor,
-- después de supabase/migrations/20261009000000_init.sql. No subir a GitHub: contiene datos del negocio.
update public.business set name = 'Mati Ventas', address = 'Villarrica', phone = '-', footer = '¡Gracias por su compra!' where id = 1;
insert into public.products (name, price, code) values
  ('Chirlito suffle Doble', 300, null),
  ('Alfajor Panchito', 400, null),
  ('Chicle Grosso Crunch', 200, null);
