import { configuracion } from "../config.js";
import { obtenerServicios, guardarServicios, guardarConfiguracionDemo, escapar } from "../turnos.js";

function idDesdeNombre(nombre) {
  const base = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profesional";
  const sufijo = Math.random().toString(36).slice(2, 6);
  return `${base}-${sufijo}`;
}

function valoresServicios(form) {
  return [...form.querySelectorAll('input[name="servicios"]:checked')].map(input => input.value);
}

function relacionarServicios(servicios, profesionalId, elegidos) {
  return servicios.map(servicio => {
    const actuales = (servicio.profesionales || []).filter(id => id !== profesionalId);
    if (elegidos.includes(servicio.id)) actuales.push(profesionalId);
    return { ...servicio, profesionales: actuales };
  });
}

function listaServicios(servicios, seleccionados = []) {
  if (!servicios.length) return `<p class="aviso">Primero agregá servicios en la pestaña Servicios.</p>`;
  return `<div class="equipo-admin__servicios">${servicios.map(s => `<label>
    <input type="checkbox" name="servicios" value="${escapar(s.id)}" ${seleccionados.includes(s.id) ? "checked" : ""}>
    <span>${escapar(s.nombre)}</span>
  </label>`).join("")}</div>`;
}

function guardarProfesionales(lista) {
  guardarConfiguracionDemo({ profesionales: lista });
}

export function renderEquipoAdmin(contenedor) {
  const servicios = obtenerServicios();
  const profesionales = configuracion.profesionales;
  contenedor.innerHTML = `<section class="equipo-admin">
    <form id="crear-profesional" class="tarjeta">
      <h2 class="paso__titulo">Agregar profesional</h2>
      <div class="equipo-admin__datos">
        <label class="campo"><span>Nombre</span><input name="nombre" required minlength="2" maxlength="120"></label>
        <label class="campo"><span>Especialidad</span><input name="especialidad" maxlength="120" placeholder="Ej: Peluquería"></label>
      </div>
      <fieldset class="equipo-admin__fieldset"><legend>Servicios que realiza</legend>${listaServicios(servicios)}</fieldset>
      <button type="submit" class="boton boton--primario">Agregar al equipo</button>
      <p class="error" data-error role="alert"></p>
    </form>
    <h2 class="paso__titulo">Equipo</h2>
    ${profesionales.length ? profesionales.map(p => {
      const asignados = servicios.filter(s => (s.profesionales || []).includes(p.id)).map(s => s.id);
      return `<form class="tarjeta equipo-admin__persona" data-profesional-form data-id="${escapar(p.id)}">
        <div class="equipo-admin__datos">
          <label class="campo"><span>Nombre</span><input name="nombre" value="${escapar(p.nombre)}" required minlength="2" maxlength="120"></label>
          <label class="campo"><span>Especialidad</span><input name="especialidad" value="${escapar(p.especialidad || "")}" maxlength="120"></label>
        </div>
        <fieldset class="equipo-admin__fieldset"><legend>Servicios que realiza</legend>${listaServicios(servicios, asignados)}</fieldset>
        <label class="equipo-admin__activo"><input type="checkbox" name="activo" ${p.activo === false ? "" : "checked"}> Atiende y aparece en las reservas</label>
        <div class="acciones"><button type="submit" class="boton boton--primario">Guardar</button></div>
        <p class="exito" data-ok role="status"></p><p class="error" data-error role="alert"></p>
      </form>`;
    }).join("") : `<p class="aviso">Todavía no hay profesionales cargados.</p>`}
    <p class="aviso">Al desactivar a alguien, se conserva en los turnos de muestra anteriores.</p>
  </section>`;

  contenedor.querySelector("#crear-profesional").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const nombre = form.elements.nombre.value.trim();
    const id = idDesdeNombre(nombre);
    const serviciosSeleccionados = valoresServicios(form);
    guardarServicios(relacionarServicios(servicios, id, serviciosSeleccionados));
    guardarProfesionales([...profesionales, { id, nombre, especialidad: form.elements.especialidad.value.trim(), activo: true }]);
    renderEquipoAdmin(contenedor);
  });

  contenedor.querySelectorAll("[data-profesional-form]").forEach(form => form.addEventListener("submit", event => {
    event.preventDefault();
    const id = form.dataset.id;
    const actualizados = configuracion.profesionales.map(p => p.id === id ? {
      ...p, nombre: form.elements.nombre.value.trim(), especialidad: form.elements.especialidad.value.trim(),
      activo: form.elements.activo.checked,
    } : p);
    guardarServicios(relacionarServicios(obtenerServicios(), id, valoresServicios(form)));
    guardarProfesionales(actualizados);
    form.querySelector("[data-ok]").textContent = "Cambios guardados en este navegador.";
  }));
}
