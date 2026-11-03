import { solicitarAdmin } from "../api.js";
import { escapar } from "../turnos.js";

function opcionesServicios(servicios, elegidos = []) {
  if (!servicios.length) return `<p class="aviso">Primero agregá servicios en la pestaña Servicios.</p>`;
  return `<div class="equipo-admin__servicios">${servicios.map(s => `<label>
    <input type="checkbox" name="servicios" value="${escapar(s.id)}" ${elegidos.includes(s.id) ? "checked" : ""}>
    <span>${escapar(s.nombre)}</span>
  </label>`).join("")}</div>`;
}

function idDesdeNombre(nombre) {
  const base = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profesional";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

function valoresServicios(form) {
  return [...form.querySelectorAll('input[name="servicios"]:checked')].map(input => input.value);
}

export async function renderEquipoAdmin(contenedor) {
  contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Equipo</h2><p class="aviso">Cargando profesionales…</p></section>`;
  try {
    const [{ profesionales }, { servicios }] = await Promise.all([
      solicitarAdmin("/api/admin/equipo"),
      solicitarAdmin("/api/admin/servicios"),
    ]);
    contenedor.innerHTML = `<section class="equipo-admin">
      <form id="crear-profesional" class="tarjeta">
        <h2 class="paso__titulo">Agregar profesional</h2>
        <div class="equipo-admin__datos">
          <label class="campo"><span>Nombre</span><input name="nombre" required minlength="2" maxlength="120"></label>
          <label class="campo"><span>Especialidad</span><input name="especialidad" maxlength="120" placeholder="Ej: Peluquería"></label>
        </div>
        <fieldset class="equipo-admin__fieldset"><legend>Servicios que realiza</legend>${opcionesServicios(servicios)}</fieldset>
        <button type="submit" class="boton boton--primario">Agregar al equipo</button>
        <p class="error" data-error role="alert"></p>
      </form>
      <h2 class="paso__titulo">Profesionales</h2>
      ${profesionales.length ? profesionales.map(p => `<form class="tarjeta equipo-admin__persona" data-profesional-form data-id="${escapar(p.id)}">
        <div class="equipo-admin__datos">
          <label class="campo"><span>Nombre</span><input name="nombre" value="${escapar(p.nombre)}" required minlength="2" maxlength="120"></label>
          <label class="campo"><span>Especialidad</span><input name="especialidad" value="${escapar(p.especialidad || "")}" maxlength="120"></label>
        </div>
        <fieldset class="equipo-admin__fieldset"><legend>Servicios que realiza</legend>${opcionesServicios(servicios, p.servicios)}</fieldset>
        <label class="equipo-admin__activo"><input type="checkbox" name="activo" ${p.activo ? "checked" : ""}> Atiende y aparece en las reservas</label>
        <div class="acciones">
          <button type="submit" class="boton boton--primario">Guardar</button>
          ${p.activo ? `<button type="button" class="boton boton--secundario" data-desactivar="${escapar(p.id)}">Desactivar</button>` : ""}
        </div>
        <p class="exito" data-ok role="status"></p><p class="error" data-error role="alert"></p>
      </form>`).join("") : `<p class="aviso">Todavía no hay profesionales cargados.</p>`}
      <p class="aviso">Al desactivar a alguien, se conserva el historial de sus turnos.</p>
    </section>`;

    contenedor.querySelector("#crear-profesional").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const boton = form.querySelector('button[type="submit"]');
      boton.disabled = true;
      try {
        await solicitarAdmin("/api/admin/profesionales", {
          method: "POST",
          body: JSON.stringify({ id: idDesdeNombre(form.elements.nombre.value), nombre: form.elements.nombre.value.trim(), especialidad: form.elements.especialidad.value.trim(), servicios: valoresServicios(form) }),
        });
        await renderEquipoAdmin(contenedor);
      } catch (error) { form.querySelector("[data-error]").textContent = error.message; }
      finally { boton.disabled = false; }
    });

    contenedor.querySelectorAll("[data-profesional-form]").forEach(form => form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const boton = f.querySelector('button[type="submit"]');
      boton.disabled = true;
      try {
        await solicitarAdmin(`/api/admin/profesionales/${encodeURIComponent(f.dataset.id)}`, {
          method: "PUT",
          body: JSON.stringify({ nombre: f.elements.nombre.value.trim(), especialidad: f.elements.especialidad.value.trim(), activo: f.elements.activo.checked, servicios: valoresServicios(f) }),
        });
        f.querySelector("[data-ok]").textContent = "Cambios guardados.";
      } catch (error) { f.querySelector("[data-error]").textContent = error.message; }
      finally { boton.disabled = false; }
    }));

    contenedor.querySelectorAll("[data-desactivar]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("¿Desactivar a esta persona? Sus turnos existentes se conservan.")) return;
      button.disabled = true;
      try {
        await solicitarAdmin(`/api/admin/profesionales/${encodeURIComponent(button.dataset.desactivar)}`, { method: "DELETE" });
        await renderEquipoAdmin(contenedor);
      } catch (error) {
        button.disabled = false;
        button.closest("form").querySelector("[data-error]").textContent = error.message;
      }
    }));
  } catch (error) {
    contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Equipo</h2><p class="error" role="alert">${escapar(error.message)}</p></section>`;
  }
}
