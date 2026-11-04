// Agenda del dueño: día / semana, confirmar, cancelar y bloquear
import { configuracion } from "../config.js";
import { haySesion } from "../sesion.js";
import {
  obtenerTurnos, obtenerBloqueos, obtenerServicio, obtenerProfesional, cambiarEstado, crearBloqueo, quitarBloqueo,
  restablecerDemo, hoyISO, deISO, fechaISO, sumarDias, formatearFecha, formatearPrecio, horarioDelDia, aMinutos, aHora, escapar,
} from "../turnos.js";
import { renderEncabezado } from "../components/encabezado.js";
import { renderServiciosAdmin } from "./servicios-admin.js";
import { renderEquipoAdmin } from "./equipo-admin.js";
import { renderConfiguracionAdmin } from "./configuracion-admin.js";

renderEncabezado(document.getElementById("encabezado"), { raiz: "../", etiqueta: "Panel del negocio", esAdmin: true });
document.title = `Agenda · ${configuracion.negocio.nombre}`;

const vista = { modo: "dia", fecha: hoyISO(), profesional: "todos", seccion: "agenda" };
const $agenda = document.getElementById("agenda");
const $controles = document.getElementById("controles");
const ESTADOS = { pendiente: "Pendiente", confirmado: "Confirmado", cancelado: "Cancelado" };


//verificacion de token
if (!haySesion()) {
  location.replace("../login/")
}
else {
  // La vista semanal siempre está anclada al lunes de la semana seleccionada.
  const lunesDe = (iso) => {
    const fecha = deISO(iso);
    const diasDesdeLunes = (fecha.getDay() + 6) % 7;
    return sumarDias(fecha, -diasDesdeLunes);
  };
  const filtrar = (lista) => lista.filter((x) => vista.profesional === "todos" || x.profesionalId === vista.profesional);

  function itemsDelDia(fecha) {
    const turnos = filtrar(obtenerTurnos().filter((t) => t.fecha === fecha)).map((t) => ({ tipo: "turno", ...t }));
    const bloqueos = filtrar(obtenerBloqueos().filter((b) => b.fecha === fecha)).map((b) => ({ tipo: "bloqueo", ...b }));
    return [...turnos, ...bloqueos].sort((a, b) => a.hora.localeCompare(b.hora));
  }

  function tarjetaItem(x, compacta = false) {
    const p = obtenerProfesional(x.profesionalId);
    const fin = aHora(aMinutos(x.hora) + x.duracion);
    if (x.tipo === "bloqueo") {
      return `<article class="turno turno--bloqueo">
      <div class="turno__hora">${x.hora}<small>${fin}</small></div>
      <div class="turno__info"><strong>Bloqueado${x.motivo ? " · " + escapar(x.motivo) : ""}</strong><span>${escapar(p?.nombre ?? "")}</span></div>
      <div class="turno__acciones"><button class="boton-chico" data-quitar="${x.id}">Quitar</button></div>
    </article>`;
    }
    const s = obtenerServicio(x.servicioId);
    return `<article class="turno turno--${x.estado}">
    <div class="turno__hora">${x.hora}<small>${fin}</small></div>
    <div class="turno__info">
      <strong>${escapar(x.cliente)}</strong>
      <span>${escapar(s?.nombre ?? "Servicio eliminado")} · ${escapar(p?.nombre ?? "")}${compacta ? "" : ` · ${formatearPrecio(s?.precio ?? 0)}`}</span>
      ${compacta ? "" : `<span class="turno__tel">WhatsApp: ${escapar(x.whatsapp)}</span>`}
    </div>
    <span class="estado estado--${x.estado}">${ESTADOS[x.estado]}</span>
    <div class="turno__acciones">
      ${x.estado !== "confirmado" ? `<button class="boton-chico boton-chico--ok" data-confirmar="${x.id}">Confirmar</button>` : ""}
      ${x.estado !== "cancelado" ? `<button class="boton-chico boton-chico--peligro" data-cancelar="${x.id}">Cancelar</button>` : ""}
    </div>
  </article>`;
  }

  function renderControles() {
    const etiqueta = vista.modo === "dia"
      ? formatearFecha(vista.fecha)
      : (() => { const l = lunesDe(vista.fecha); return `Del ${l.getDate()}/${l.getMonth() + 1} al ${sumarDias(l, 6).getDate()}/${sumarDias(l, 6).getMonth() + 1}`; })();
    $controles.innerHTML = `
    <div class="pestanas">
      <button class="pestana${vista.seccion === "agenda" && vista.modo === "dia" ? " es-activa" : ""}" data-modo="dia">Día</button>
      <button class="pestana${vista.seccion === "agenda" && vista.modo === "semana" ? " es-activa" : ""}" data-modo="semana">Semana</button>
      <button class="pestana${vista.seccion === "servicios" ? " es-activa" : ""}" data-seccion="servicios">Servicios</button>
      <button class="pestana${vista.seccion === "equipo" ? " es-activa" : ""}" data-seccion="equipo">Equipo</button>
      <button class="pestana${vista.seccion === "configuracion" ? " es-activa" : ""}" data-seccion="configuracion">Negocio</button>
    </div>
    ${vista.seccion === "agenda" ? `<div class="navegacion">
      <button class="boton-chico" data-mover="-1" aria-label="Anterior">←</button>
      <button class="boton-chico" data-mover="0">Hoy</button>
      <button class="boton-chico" data-mover="1" aria-label="Siguiente">→</button>
      <strong class="navegacion__fecha">${etiqueta}</strong>
      <select id="filtro" class="selector" aria-label="Filtrar por profesional">
        <option value="todos">Todas las profesionales</option>
        ${configuracion.profesionales.filter(p => p.activo !== false).map((p) => `<option value="${p.id}" ${vista.profesional === p.id ? "selected" : ""}>${escapar(p.nombre)}</option>`).join("")}
      </select>
    </div>` : ""}`;
  }

  function resumenDia(fecha) {
    const turnos = filtrar(obtenerTurnos().filter((t) => t.fecha === fecha && t.estado !== "cancelado"));
    const total = turnos.reduce((a, t) => a + (obtenerServicio(t.servicioId)?.precio ?? 0), 0);
    return `<div class="metricas">
    <div class="metrica"><span>Turnos</span><strong>${turnos.length}</strong></div>
    <div class="metrica"><span>Pendientes</span><strong>${turnos.filter((t) => t.estado === "pendiente").length}</strong></div>
    <div class="metrica"><span>Facturación estimada</span><strong>${formatearPrecio(total)}</strong></div>
  </div>`;
  }

  function formularioBloqueo() {
    const opcionesHora = [];
    for (let m = 7 * 60; m <= 21 * 60; m += configuracion.intervaloMinutos) opcionesHora.push(aHora(m));
    return `<details class="tarjeta bloqueo-form">
    <summary>Bloquear un horario</summary>
    <form id="form-bloqueo" class="bloqueo-form__grilla">
      <label class="campo"><span>Profesional</span><select name="profesionalId" class="selector">${configuracion.profesionales.filter(p => p.activo !== false).map((p) => `<option value="${p.id}">${escapar(p.nombre)}</option>`).join("")}</select></label>
      <label class="campo"><span>Día</span><input type="date" name="fecha" value="${vista.fecha}" required></label>
      <label class="campo"><span>Desde</span><select name="hora" class="selector">${opcionesHora.map((h) => `<option ${h === "13:00" ? "selected" : ""}>${h}</option>`).join("")}</select></label>
      <label class="campo"><span>Duración</span><select name="duracion" class="selector">${[30, 60, 90, 120, 180, 240].map((d) => `<option value="${d}">${d} min</option>`).join("")}</select></label>
      <label class="campo campo--ancho"><span>Motivo (opcional)</span><input name="motivo" placeholder="Ej: Trámite, almuerzo, capacitación"></label>
      <button class="boton boton--primario campo--ancho">Bloquear horario</button>
      <p class="error campo--ancho" id="error-bloqueo" role="alert"></p>
    </form>
  </details>`;
  }

  function renderDia() {
    const items = itemsDelDia(vista.fecha);
    const h = horarioDelDia(vista.fecha);
    return `${resumenDia(vista.fecha)}
    <p class="aviso">${h ? `Abierto de ${h.abre} a ${h.cierra} hs` : "Cerrado este día"}</p>
    <div class="lista-turnos">${items.length ? items.map((x) => tarjetaItem(x)).join("") : `<p class="aviso aviso--vacio">No hay turnos para este día.</p>`}</div>
    ${formularioBloqueo()}`;
  }

  function renderSemana() {
    const lunes = lunesDe(vista.fecha);
    const dias = Array.from({ length: 7 }, (_, i) => fechaISO(sumarDias(lunes, i))).filter((iso) => horarioDelDia(iso) || itemsDelDia(iso).length);
    return `<div class="semana">${dias.map((iso) => {
      const items = itemsDelDia(iso);
      return `<section class="semana__dia${iso === hoyISO() ? " es-hoy" : ""}">
      <button class="semana__titulo" data-ir="${iso}">${formatearFecha(iso, { weekday: "long", day: "numeric" })}<small>${((n) => n === 1 ? "1 turno" : n + " turnos")(items.filter((x) => x.tipo === "turno" && x.estado !== "cancelado").length)}</small></button>
      ${items.length ? items.map((x) => tarjetaItem(x, true)).join("") : `<p class="aviso aviso--vacio">Libre</p>`}
    </section>`;
    }).join("")}</div>`;
  }

  function render() {
    renderControles();
    if (vista.seccion === "servicios") return renderServiciosAdmin($agenda);
    if (vista.seccion === "equipo") return renderEquipoAdmin($agenda);
    if (vista.seccion === "configuracion") return renderConfiguracionAdmin($agenda);
    $agenda.innerHTML = vista.modo === "dia" ? renderDia() : renderSemana();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.modo) Object.assign(vista, { modo: d.modo, seccion: "agenda" });
    else if (d.seccion) vista.seccion = d.seccion;
    else if (d.mover !== undefined) {
      const n = Number(d.mover);
      vista.fecha = n === 0 ? hoyISO() : fechaISO(sumarDias(deISO(vista.fecha), n * (vista.modo === "dia" ? 1 : 7)));
    } else if (d.ir) Object.assign(vista, { fecha: d.ir, modo: "dia" });
    else if (d.confirmar) cambiarEstado(d.confirmar, "confirmado");
    else if (d.cancelar) { if (!confirm("¿Cancelar este turno? El horario queda libre.")) return; cambiarEstado(d.cancelar, "cancelado"); }
    else if (d.quitar) quitarBloqueo(d.quitar);
    else if (d.restablecer !== undefined) { if (!confirm("Se borran los cambios y vuelven los datos de ejemplo. ¿Seguimos?")) return; restablecerDemo(); renderEncabezado(document.getElementById("encabezado"), { raiz: "../", etiqueta: "Panel del negocio", esAdmin: true }); }
    else return;
    render();
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "filtro") { vista.profesional = e.target.value; render(); }
  });

  window.addEventListener("configuracion-demo-actualizada", () => {
    document.title = `Agenda · ${configuracion.negocio.nombre}`;
    renderControles();
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id !== "form-bloqueo") return;
    e.preventDefault();
    const f = e.target;
    try {
      crearBloqueo({ profesionalId: f.profesionalId.value, fecha: f.fecha.value, hora: f.hora.value, duracion: Number(f.duracion.value), motivo: f.motivo.value.trim() });
      vista.fecha = f.fecha.value;
      render();
    } catch (err) {
      document.getElementById("error-bloqueo").textContent = err.message;
    }
  });

  render();

}
