// Pantalla de confirmación
import { configuracion } from "./config.js";
import { obtenerUltimoTurno, obtenerServicio, obtenerProfesional, formatearFecha, formatearPrecio, formatearDuracion, enlaceWhatsapp, escapar } from "./turnos.js";
import { renderEncabezado } from "./components/encabezado.js";
import { renderPiePagina } from "./components/pie.js";

renderEncabezado(document.getElementById("encabezado"), { raiz: "../" });
renderPiePagina(document.getElementById("pie"), {raiz: "../"})
document.title = `Confirmación · ${configuracion.negocio.nombre}`;

const $c = document.getElementById("confirmacion");
const turno = obtenerUltimoTurno();
const t = configuracion.textos;

if (!turno) {
  $c.innerHTML = `<div class="tarjeta confirmacion__vacia"><h1>No encontramos tu turno</h1>
    <p>Puede que todavía no hayas reservado.</p><a class="boton boton--primario" href="../">Reservar un turno</a></div>`;
} else {
  const s = obtenerServicio(turno.servicioId);
  const p = obtenerProfesional(turno.profesionalId);
  const fila = (k, v) => `<div class="resumen__fila"><dt>${k}</dt><dd>${escapar(v)}</dd></div>`;
  $c.innerHTML = `<div class="tarjeta confirmacion__tarjeta">
    <div class="confirmacion__icono" aria-hidden="true">✓</div>
    <h1 class="confirmacion__titulo">${t.gracias}</h1>
    <p class="confirmacion__bajada">${t.graciasDetalle}</p>
    <dl class="resumen confirmacion__resumen">
      ${fila("Servicio", `${s?.nombre ?? ""} · ${formatearDuracion(turno.duracion)}`)}
      ${fila("Profesional", p?.nombre ?? "")}
      ${fila("Día", formatearFecha(turno.fecha))}
      ${fila("Hora", turno.hora + " hs")}
      ${fila("A nombre de", turno.cliente)}
      ${fila("WhatsApp", turno.whatsapp)}
    </dl>
    <p class="resumen__total"><span>Total a abonar en el local</span><strong>${formatearPrecio(s?.precio ?? 0)}</strong></p>
    <a class="boton boton--whatsapp boton--ancho" href="${enlaceWhatsapp(turno)}" target="_blank" rel="noopener">${t.botonWhatsapp}</a>
    <a class="boton boton--secundario boton--ancho" href="../">Reservar otro turno</a>
    <p class="resumen__nota">${escapar(configuracion.negocio.direccion)}</p>
  </div>`;
}
