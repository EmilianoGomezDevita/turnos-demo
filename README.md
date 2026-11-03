# Demo de turnos online
https://emilianogomezdevita.github.io/turnos-demo/

Demo de un sistema de turnos para peluquerías y centros de estética, hecha en HTML, SCSS y JavaScript puro.
La rama `main` es una demo localStorage. La rama `api` conecta reservas y panel a una API privada con PostgreSQL.

## Pantallas
| URL | Qué es |
|---|---|
| `/` | El cliente reserva su turno: servicio, profesional, día y hora, y sus datos |
| `/confirmacion/` | Resumen del turno y botón **Confirmar por WhatsApp** |
|`/admin/?n=slug` | Agenda del dueño: turnos, bloqueos y servicios (rama `api`, requiere cuenta) |
| `/login/?n=slug` | Ingreso del dueño en la rama `api` |

## Cómo correrla
```bash
pnpm install
pnpm compilar   # compila scss → css/estilos.css (ya viene compilado)
pnpm servir     # abre http://localhost:3000
```
> Usa módulos de JavaScript, así que tiene que abrirse desde un servidor (no con doble clic en el archivo). También funciona subida tal cual a Netlify, Vercel, GitHub Pages o cualquier hosting estático.

Mientras editás estilos podés usar `pnpm dev`, que recompila solo cada vez que guardás.

## Rama conectada a la API

La rama `api` conecta reserva, confirmación, login y panel a `turnos-backend`. En un sitio publicado se conecta a `https://turnos-api-4id3.onrender.com`; en `localhost` conserva la conexión a `http://localhost:3001`. Para probarla localmente, abrí `/?n=demo-turnos`, levantá el backend y serví el frontend con `pnpm servir`. Las pantallas internas conservan el parámetro `n`. El dueño inicia sesión con correo y contraseña creados en el backend; el panel toma el negocio desde el token. En el panel se administran agenda, bloqueos, servicios y profesionales; los profesionales se desactivan para preservar el historial de turnos.

## Pruebas E2E

Las pruebas usan Chromium en `http://localhost:3000`. Primero, desde `turnos-backend`, prepará el negocio de prueba con `pnpm seed:e2e` y arrancá la API con `pnpm dev:e2e`; ese modo permite por CORS solo `http://localhost:3000` y usa la rama Neon `test-turnos`. Después ejecutá `pnpm test:e2e` desde este repositorio. Playwright arranca `pnpm servir` si el puerto 3000 está libre. No uses la configuración normal `pnpm dev` del backend para estas pruebas.

## Cambiar de negocio
Editá **solo** `js/config.js`:
- `negocio`: nombre, bajada, inicial o `logoUrl`, `colorPrincipal`, número de WhatsApp (formato `549...` sin `+`) y dirección.
- `horarios`: apertura y cierre por día (`null` = cerrado).
- `profesionales` y `servicios`: duración en minutos, precio en pesos y quién hace cada servicio.
- `turnosEjemplo` y `bloqueosEjemplo`: datos de muestra, con fechas relativas a hoy.
- `textos`: los textos principales de la interfaz.
- admin: la clave de demo
- creditos: el texto del pie de pagina.

Todos los colores suaves se calculan a partir de `colorPrincipal`.

Para ver tus cambios de ejemplo, entrá a `/admin` → **Servicios** → **Restablecer datos de demo**. Ese botón borra lo guardado en el navegador.

## Acceso al panel
En `main`, el candado conserva el acceso de demostración local. En `api`, el candado abre el login del servidor; la sesión usa un token temporal en `sessionStorage` y se cierra desde el panel.

## Estructura
```
index.html               reservar turno
confirmacion/index.html  confirmación
admin/index.html         agenda del dueño
js/config.js             ← toda la personalización
js/turnos.js             lógica de turnos + localStorage
js/index.js              flujo de reserva
js/confirmacion.js
js/components/           encabezado, tarjetas, selector de horario
js/admin/                agenda y edición de servicios
login/index.html              ingreso alternativo al panel
js/sesion.js                  sesión del panel conectado
js/login.js
js/components/                encabezado, pie, modal de login, tarjetas, selector de horario
scss/                    estilos fuente (base, componentes, páginas)
css/estilos.css          compilado
```

## Límites de la demo
- Los datos se guardan solo en el navegador de cada persona (localStorage): un turno reservado en un celular no aparece en otro dispositivo.
- No envía mails ni recordatorios.
- La rama `api` requiere el backend privado y una base PostgreSQL activa para ofrecer persistencia compartida.

## Reglas de reserva
- Turnos cada 30 minutos dentro del horario de atención. El servicio tiene que terminar antes del cierre.
- Un horario está ocupado si se superpone con otro turno no cancelado o con un bloqueo de esa profesional.
- Con "Cualquiera", el turno se asigna a la primera profesional libre.
- Al reservar se vuelve a revisar la disponibilidad, así no se puede tomar un horario ya ocupado.
