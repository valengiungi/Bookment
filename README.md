# Bookment

Plataforma multi-tenant para **turnos online**: cada negocio tiene su link público, agenda en el panel y reservas con validación de horarios, bloqueos y profesionales.

Repositorio: [github.com/valengiungi/Bookment](https://github.com/valengiungi/Bookment)

## Stack

- **Next.js** 16 (App Router) · **React** 19 · **TypeScript**
- **PostgreSQL** con **Prisma** 7 y adaptador `pg`
- **Auth.js** (NextAuth v5) con inicio de sesión por credenciales
- **Tailwind CSS** 4

## Requisitos

- Node.js 20+ (recomendado 22)
- Una base **PostgreSQL** accesible (local, Supabase, etc.)

## Configuración

1. Clonar e instalar dependencias:

   ```bash
   git clone https://github.com/valengiungi/Bookment.git
   cd Bookment
   npm install
   ```

2. Crear un archivo **`.env`** en la raíz (no se sube al repositorio). Variables típicas:

   | Variable | Descripción |
   |----------|-------------|
   | `DATABASE_URL` | URL de conexión PostgreSQL |
   | `AUTH_SECRET` | Secreto para firmar sesiones (por ejemplo `openssl rand -hex 16`) |
   | `AUTH_URL` | Origen de la app, ej. `http://localhost:3000` en desarrollo |
   | `DEFAULT_TIMEZONE` | (Opcional) IANA, por defecto `America/Argentina/Buenos_Aires` |

3. Aplicar el esquema a la base de datos:

   ```bash
   npx prisma db push
   ```

4. Arrancar en desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Scripts útiles

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desarrollo en `localhost:3000` |
| `npm run build` / `npm run start` | Compilar y producción local |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerar cliente Prisma |
| `npm run db:push` | Sincronizar esquema sin migraciones |
| `npm run db:migrate` | Migraciones en entornos con historial |
| `npm run db:shift-bookings-month` | Script de mantenimiento para mover turnos entre meses (ver `scripts/shift-bookings-month.ts`) |

Tras `npm install` se ejecuta **`prisma generate`** automáticamente (`postinstall`).

## Estructura (resumen)

- `src/app/` — Rutas: landing, auth, dashboard, onboarding, página pública `/{slug}`, APIs
- `src/components/` — UI compartida (`PublicBooking`, toasts, layout del dashboard, etc.)
- `src/lib/` — Prisma, zona horaria, helpers de calendario
- `src/modules/` — Lógica de negocio (slots, creación de reservas, WhatsApp)
- `prisma/schema.prisma` — Modelos: tenants, usuarios, servicios, staff, reservas, bloqueos, horarios

Los archivos subidos por tenants van a `public/uploads/` (el contenido real suele ignorarse en git; se versiona `.gitkeep`).

## En producción

- Definir las mismas variables de entorno en el hosting (Vercel, Railway, VPS, etc.).
- Usar `npm run build` y `npm run start` (o el comando que exponga el proveedor).
- Asegurar `AUTH_URL` con el dominio público y HTTPS.

## Licencia

Uso personal del autor; si querés open source, definí una licencia explícita en el repo.
