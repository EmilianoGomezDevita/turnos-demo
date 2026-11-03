import { solicitarAdmin } from "../api.js";
import { formatearPrecio, escapar } from "../turnos.js";

export async function renderServiciosAdmin(contenedor) {
  contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Servicios</h2><p class="aviso">Cargando servicios…</p></section>`;
  try {
    const { servicios } = await solicitarAdmin("/api/admin/servicios");
    contenedor.innerHTML = `<form id="form-servicios" class="tarjeta servicios-admin">
      <h2 class="paso__titulo">Servicios</h2>
      <p class="aviso">Los cambios se guardan para este negocio y se reflejan en la reserva.</p>
      <div class="servicios-admin__lista">
        ${servicios.map((s, i) => `<div class="servicios-admin__fila">
          <label class="campo"><span>Nombre</span><input name="nombre-${i}" value="${escapar(s.nombre)}" required maxlength="120"></label>
          <label class="campo"><span>Duración (min)</span><input name="duracion-${i}" type="number" min="5" max="720" value="${s.duracion}" required></label>
          <label class="campo"><span>Precio ($)</span><input name="precio-${i}" type="number" min="0" step="100" value="${s.precio}" required></label>
        </div>`).join("")}
      </div>
      <div class="acciones"><button type="submit" class="boton boton--primario">Guardar cambios</button></div>
      <p class="exito" id="mensaje-servicios" role="status"></p>
      <p class="error" id="error-servicios" role="alert"></p>
    </form>`;

    contenedor.querySelector("#form-servicios").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const boton = f.querySelector('button[type="submit"]');
      const actualizados = servicios.map((s, i) => ({
        id: s.id,
        nombre: f[`nombre-${i}`].value.trim(),
        duracion: Number(f[`duracion-${i}`].value),
        precio: Number(f[`precio-${i}`].value),
      }));
      boton.disabled = true;
      try {
        await solicitarAdmin("/api/admin/servicios", { method: "PUT", body: JSON.stringify({ servicios: actualizados }) });
        f.querySelector("#mensaje-servicios").textContent = "Cambios guardados.";
      } catch (error) { f.querySelector("#error-servicios").textContent = error.message; }
      finally { boton.disabled = false; }
    });
  } catch (error) {
    contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Servicios</h2><p class="error" role="alert">${escapar(error.message)}</p></section>`;
  }
}
