// Edición de servicios (nombre, duración, precio)
import { obtenerServicios, guardarServicios, formatearPrecio, escapar } from "../turnos.js";

export function renderServiciosAdmin(contenedor) {
  const servicios = obtenerServicios();
  contenedor.innerHTML = `<form id="form-servicios" class="tarjeta servicios-admin">
    <h2 class="paso__titulo">Servicios</h2>
    <p class="aviso">Los cambios se ven al instante en la página de reservas.</p>
    <div class="servicios-admin__lista">
      ${servicios.map((s, i) => `<div class="servicios-admin__fila">
        <label class="campo"><span>Nombre</span><input name="nombre-${i}" value="${escapar(s.nombre)}" required></label>
        <label class="campo"><span>Duración (min)</span><input name="duracion-${i}" type="number" min="15" step="5" value="${s.duracion}" required></label>
        <label class="campo"><span>Precio ($)</span><input name="precio-${i}" type="number" min="0" step="100" value="${s.precio}" required></label>
      </div>`).join("")}
    </div>
    <div class="acciones">
      <button type="button" class="boton boton--secundario" data-restablecer>Restablecer datos de demo</button>
      <button class="boton boton--primario">Guardar cambios</button>
    </div>
    <p class="exito" id="mensaje-servicios" role="status"></p>
  </form>`;

  contenedor.querySelector("#form-servicios").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const nuevos = servicios.map((s, i) => ({
      ...s,
      nombre: f[`nombre-${i}`].value.trim() || s.nombre,
      duracion: Math.max(15, Number(f[`duracion-${i}`].value) || s.duracion),
      precio: Math.max(0, Number(f[`precio-${i}`].value) || 0),
    }));
    guardarServicios(nuevos);
    f.querySelector("#mensaje-servicios").textContent = `Guardado. Ej: ${nuevos[0].nombre} ahora cuesta ${formatearPrecio(nuevos[0].precio)}.`;
  });
}
