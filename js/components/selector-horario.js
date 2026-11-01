// Selector de día (próximos N días) y grilla de horarios
import { configuracion } from "../config.js";
import { fechaISO, sumarDias, deISO, horarioDelDia, horariosDelDia } from "../turnos.js";

export function proximosDias() {
  const hoy = new Date();
  return Array.from({ length: configuracion.diasParaReservar }, (_, i) => fechaISO(sumarDias(hoy, i)));
}

export function renderDias(fechaSeleccionada) {
  return `<div class="dias" role="list">${proximosDias()
    .map((iso) => {
      const d = deISO(iso);
      const cerrado = !horarioDelDia(iso);
      const dia = d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");
      const mes = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
      return `<button type="button" role="listitem" class="dia${iso === fechaSeleccionada ? " es-seleccionado" : ""}" data-fecha="${iso}" ${cerrado ? "disabled" : ""}>
        <span class="dia__semana">${dia}</span>
        <strong class="dia__numero">${d.getDate()}</strong>
        <span class="dia__mes">${cerrado ? configuracion.textos.cerrado : mes}</span>
      </button>`;
    })
    .join("")}</div>`;
}

export function renderHorarios(servicio, profesionalId, fecha, horaSeleccionada) {
  if (!fecha) return `<p class="aviso">Elegí un día para ver los horarios.</p>`;
  const lista = horariosDelDia(servicio, profesionalId, fecha);
  if (!lista.some((h) => h.libre)) return `<p class="aviso">${configuracion.textos.sinHorarios}</p>`;
  return `<div class="horarios">${lista
    .map(
      (h) => `<button type="button" class="horario${h.hora === horaSeleccionada ? " es-seleccionado" : ""}" data-hora="${h.hora}" ${h.libre ? "" : 'disabled aria-label="' + h.hora + ' ocupado"'}>${h.hora}</button>`
    )
    .join("")}</div>`;
}
