# Instrucciones

1. Ejecuta `supabase.sql` en el SQL Editor de Supabase.
2. `npm install qrcode` y `npm install -D @types/qrcode`
3. Copia las carpetas `app/`, `components/` y `lib/` sobre tu proyecto (respetan rutas).
   Sobrescriben: ArtistDashboard.tsx, ArtistSmartLinks.tsx, AdminDashboard.tsx, AdminArtistAccounts.tsx, SendDemo.tsx
   y `app/api/admin/release-submissions/route.ts` (ahora tiene GET + PATCH).
4. Opcional: variable `RESEND_FROM` (si no existe usa noreply@loyalfoxrecords.com) para el aviso de cambio de método de pago.
5. En la home (`app/page.tsx`) añade, donde quieras:
   import ProcessSteps from "@/components/ProcessSteps";
   import SocialProof from "@/components/SocialProof";
   ...  <ProcessSteps />  <SocialProof />
6. Pendiente a mano: en `ArtistContracts.tsx` aplica la corrección de coordenadas de la firma en móvil
   (en getPos multiplica por canvas.width/rect.width y canvas.height/rect.height).
