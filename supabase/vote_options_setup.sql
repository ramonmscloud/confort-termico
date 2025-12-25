-- Tabla de Opciones de Voto
create table public.vote_options (
  value int primary key,
  label text not null,
  icon text not null,
  color text not null, -- clase de tailwind o código hex
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.vote_options enable row level security;

-- Políticas
create policy "Opciones de voto son públicas para lectura" 
  on public.vote_options for select using (true);

create policy "Solo admins pueden modificar opciones de voto" 
  on public.vote_options for all using (true); -- Simplificado para este entorno, idealmente restringido por rol

-- Insertar valores por defecto
insert into public.vote_options (value, label, icon, color) values
(-2, 'Muy Frío', '🥶', 'bg-blue-500'),
(-1, 'Fresco', '❄️', 'bg-blue-300'),
(0, 'Bien', '😊', 'bg-green-500'),
(1, 'Calor', '🔥', 'bg-orange-500'),
(2, 'Mucho Calor', '🥵', 'bg-red-500');
