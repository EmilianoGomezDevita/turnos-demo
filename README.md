# Demo de turnos online
https://emilianogomezdevita.github.io/turnos-demo/

Demo de un sistema de turnos para peluquerías y centros de estética. Está hecha en HTML, SCSS y JavaScript puro, sin backend: todo se guarda en el navegador (localStorage).
Para entrar al panel del dueño, tocá el candado del pie de la página.
Clave de demostración: `demoTurnos`.

## Pantallas
| URL | Qué es |
|---|---|
| `/` | El cliente reserva su turno: servicio, profesional, día y hora, y sus datos |
| `/confirmacion/` | Resumen del turno y botón **Confirmar por WhatsApp** |
|`/admin/` | Agenda del dueño (requiere clave de demo): confirmar, cancelar, bloquear horarios y editar servicios |
| `/login/` | Pantalla de ingreso alternativa al modal del candado |

## Cómo correrla
```bash
pnpm install
pnpm compilar   # compila scss → css/estilos.css (ya viene compilado)
pnpm servir     # abre http://localhost:3000
```
> Usa módulos de JavaScript, así que tiene que abrirse desde un servidor (no con doble clic en el archivo). También funciona subida tal cual a Netlify, Vercel, GitHub Pages o cualquier hosting estático.

Mientras editás estilos podés usar `pnpm dev`, que recompila solo cada vez que guardás.

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

## Acceso al panel (demo)
El candado del pie abre una ventana que pide la clave. La clave se define en `admin.claveDemo` de `js/config.js` y la sesión se guarda en `sessionStorage` (se cierra al cerrar la pestaña). "Salir" está arriba, en el panel.

> Es un acceso de demostración y **no es seguridad real**: la clave está en el código y cualquiera puede verla. Un sistema con clientes reales necesita un login verificado en un servidor.

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
js/sesion.js                  sesión de demo (iniciar, comprobar, cerrar)
js/login.js
js/components/                encabezado, pie, modal de login, tarjetas, selector de horario
scss/                    estilos fuente (base, componentes, páginas)
css/estilos.css          compilado
```

## Límites de la demo
- Los datos se guardan solo en el navegador de cada persona (localStorage): un turno reservado en un celular no aparece en otro dispositivo.
- No envía mails ni recordatorios.
- Próximos pasos para un sistema real: backend con Express y Supabase, login verificado en el servidor y recordatorios por WhatsApp.

## Reglas de reserva
- Turnos cada 30 minutos dentro del horario de atención. El servicio tiene que terminar antes del cierre.
- Un horario está ocupado si se superpone con otro turno no cancelado o con un bloqueo de esa profesional.
- Con "Cualquiera", el turno se asigna a la primera profesional libre.
- Al reservar se vuelve a revisar la disponibilidad, así no se puede tomar un horario ya ocupado.
