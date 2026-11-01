// Tarjeta seleccionable reutilizable (servicios y profesionales)
import { escapar } from "../turnos.js";

export function tarjetaOpcion({ valor, titulo, detalle = "", extra = "", seleccionada = false, nombre }) {
  return `
    <button type="button" class="tarjeta-opcion${seleccionada ? " es-seleccionada" : ""}" data-${nombre}="${escapar(valor)}" aria-pressed="${seleccionada}">
      <span class="tarjeta-opcion__cuerpo">
        <strong class="tarjeta-opcion__titulo">${escapar(titulo)}</strong>
        ${detalle ? `<span class="tarjeta-opcion__detalle">${escapar(detalle)}</span>` : ""}
      </span>
      ${extra ? `<span class="tarjeta-opcion__extra">${extra}</span>` : ""}
    </button>`;
}
