import { solicitarAdmin } from "../api.js";
import { formatearPrecio, escapar } from "../turnos.js";

function idDesdeNombre(nombre) {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "servicio";
}

export async function renderServiciosAdmin(contenedor) {
  contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Servicios</h2><p class="aviso">Cargando servicios…</p></section>`;
  try {
    const { servicios } = await solicitarAdmin("/api/admin/servicios");
    contenedor.innerHTML = `<section class="servicios-admin">
      <form id="crear-servicio" class="tarjeta">
        <h2 class="paso__titulo">Agregar servicio</h2>
        <div class="servicios-admin__nuevo">
          <label class="campo"><span>Nombre</span><input name="nombre" required minlength="2" maxlength="120"></label>
          <label class="campo"><span>Identificador del servicio</span><input name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80" placeholder="corte-de-pelo"></label>
          <label class="campo"><span>Duración (min)</span><input name="duracion" type="number" min="5" max="720" value="30" required></label>
          <label class="campo"><span>Precio ($)</span><input name="precio" type="number" min="0" max="100000000" step="100" required></label>
          <label class="campo campo--ancho"><span>Descripción</span><input name="descripcion" maxlength="500"></label>
        </div>
        <div class="acciones"><button type="submit" class="boton boton--primario">Agregar servicio</button></div>
        <p class="error" id="error-crear-servicio" role="alert"></p>
      </form>

      <form id="form-servicios" class="tarjeta">
        <h2 class="paso__titulo">Servicios activos</h2>
        <p class="aviso">Los cambios se guardan para este negocio. Para relacionarlos con profesionales, usá la pestaña Equipo.</p>
        <div class="servicios-admin__lista">
          ${servicios.length ? servicios.map((s, i) => `<div class="servicios-admin__fila">
            <label class="campo"><span>Nombre</span><input name="nombre-${i}" value="${escapar(s.nombre)}" required maxlength="120"></label>
            <label class="campo"><span>Duración (min)</span><input name="duracion-${i}" type="number" min="5" max="720" value="${s.duracion}" required></label>
            <label class="campo"><span>Precio (${formatearPrecio(s.precio)})</span><input name="precio-${i}" type="number" min="0" max="100000000" step="100" value="${s.precio}" required></label>
            <label class="campo campo--ancho"><span>Descripción</span><input name="descripcion-${i}" value="${escapar(s.descripcion || "")}" maxlength="500"></label>
            <button type="button" class="boton boton--secundario" data-desactivar-servicio="${escapar(s.id)}">Desactivar</button>
          </div>`).join("") : `<p class="aviso">Todavía no hay servicios. Agregá el primero arriba.</p>`}
        </div>
        ${servicios.length ? `<div class="acciones"><button type="submit" class="boton boton--primario">Guardar cambios</button></div>` : ""}
        <p class="exito" id="mensaje-servicios" role="status"></p>
        <p class="error" id="error-servicios" role="alert"></p>
      </form>
    </section>`;

    const crear = contenedor.querySelector("#crear-servicio");
    crear.elements.nombre.addEventListener("input", () => {
      if (!crear.elements.id.dataset.editado) crear.elements.id.value = idDesdeNombre(crear.elements.nombre.value);
    });
    crear.elements.id.addEventListener("input", () => { crear.elements.id.dataset.editado = "1"; });
    crear.addEventListener("submit", async event => {
      event.preventDefault();
      const boton = crear.querySelector('[type="submit"]');
      const error = crear.querySelector("#error-crear-servicio");
      error.textContent = "";
      boton.disabled = true;
      try {
        await solicitarAdmin("/api/admin/servicios", {
          method: "POST",
          body: JSON.stringify({
            id: crear.elements.id.value.trim(),
            nombre: crear.elements.nombre.value.trim(),
            descripcion: crear.elements.descripcion.value.trim(),
            duracion: Number(crear.elements.duracion.value),
            precio: Number(crear.elements.precio.value),
          }),
        });
        await renderServiciosAdmin(contenedor);
      } catch (e) { error.textContent = e.message; }
      finally { boton.disabled = false; }
    });

    const form = contenedor.querySelector("#form-servicios");
    form?.addEventListener("submit", async event => {
      event.preventDefault();
      const boton = form.querySelector('[type="submit"]');
      const actualizados = servicios.map((servicio, i) => ({
        id: servicio.id,
        nombre: form.elements[`nombre-${i}`].value.trim(),
        descripcion: form.elements[`descripcion-${i}`].value.trim(),
        duracion: Number(form.elements[`duracion-${i}`].value),
        precio: Number(form.elements[`precio-${i}`].value),
      }));
      boton.disabled = true;
      try {
        await solicitarAdmin("/api/admin/servicios", { method: "PUT", body: JSON.stringify({ servicios: actualizados }) });
        form.querySelector("#mensaje-servicios").textContent = "Cambios guardados.";
      } catch (e) { form.querySelector("#error-servicios").textContent = e.message; }
      finally { boton.disabled = false; }
    });

    contenedor.querySelectorAll("[data-desactivar-servicio]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("¿Desactivar este servicio? Se conserva en el historial de reservas.")) return;
      button.disabled = true;
      try {
        await solicitarAdmin(`/api/admin/servicios/${encodeURIComponent(button.dataset.desactivarServicio)}`, { method: "DELETE" });
        await renderServiciosAdmin(contenedor);
      } catch (e) {
        button.disabled = false;
        contenedor.querySelector("#error-servicios").textContent = e.message;
      }
    }));
  } catch (error) {
    contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Servicios</h2><p class="error" role="alert">${escapar(error.message)}</p></section>`;
  }
}
