// Panel conectado a la API; el servidor define el negocio desde el token.
import { configuracion } from "../config.js";
import { haySesion, cerrarSesion } from "../sesion.js";
import { cargarNegocio, solicitarAdmin, urlConSlug } from "../api.js";
import { renderEncabezado } from "../components/encabezado.js";
import { renderServiciosAdmin } from "./servicios-admin.js";
import { renderEquipoAdmin } from "./equipo-admin.js";
import { renderConfiguracionAdmin } from "./configuracion-admin.js";
import { hoyISO, deISO, fechaISO, sumarDias, formatearFecha, formatearPrecio, aMinutos, aHora, escapar } from "../turnos.js";

renderEncabezado(document.getElementById("encabezado"), { raiz: "../", etiqueta: "Panel del negocio", esAdmin: true });
const $agenda = document.getElementById("agenda");
const $controles = document.getElementById("controles");
const vista = { modo: "dia", fecha: hoyISO(), profesional: "todos", seccion: "agenda" };
let profesionales = [];
let items = [];
let renderSeq = 0;
const ESTADOS = { pendiente: "Pendiente", confirmado: "Confirmado", cancelado: "Cancelado" };

function cerrarPorSesionVencida(error) {
  if (error.status === 401) {
    cerrarSesion();
    location.replace(urlConSlug("../login/"));
    return true;
  }
  return false;
}

if (!haySesion()) location.replace(urlConSlug("../login/"));
else iniciar();

async function iniciar() {
  try {
    const [negocio, respuesta] = await Promise.all([cargarNegocio(), solicitarAdmin("/api/admin/profesionales")]);
    Object.assign(configuracion.negocio, negocio);
    configuracion.horarios = negocio.horarios;
    document.title = `Agenda · ${negocio.nombre}`;
    renderEncabezado(document.getElementById("encabezado"), { raiz: "../", etiqueta: "Panel del negocio", esAdmin: true });
    profesionales = respuesta.profesionales;
    await render();
  } catch (error) {
    if (cerrarPorSesionVencida(error)) return;
    mostrarError(error.message);
  }
}

function lunesDe(iso) {
  const fecha = deISO(iso);
  return sumarDias(fecha, -((fecha.getDay() + 6) % 7));
}

function rangoActual() {
  if (vista.modo === "dia") return { desde: vista.fecha, hasta: vista.fecha };
  const lunes = lunesDe(vista.fecha);
  return { desde: fechaISO(lunes), hasta: fechaISO(sumarDias(lunes, 6)) };
}

function filtrar(lista) { return lista.filter(x => vista.profesional === "todos" || x.profesionalId === vista.profesional); }
function finDe(x) { return aHora(aMinutos(x.hora) + Number(x.duracion)); }

function tarjetaItem(x, compacta = false) {
  const esBloqueo = x.tipo === "bloqueo";
  if (esBloqueo) return `<article class="turno turno--bloqueo">
    <div class="turno__hora">${escapar(x.hora)}<small>${finDe(x)}</small></div>
    <div class="turno__info"><strong>Bloqueado${x.cliente ? ` · ${escapar(x.cliente)}` : ""}</strong><span>${escapar(x.profesional)}</span></div>
    <div class="turno__acciones"><button class="boton-chico" data-quitar="${escapar(x.id)}">Quitar</button></div>
  </article>`;
  return `<article class="turno turno--${escapar(x.estado)}">
    <div class="turno__hora">${escapar(x.hora)}<small>${finDe(x)}</small></div>
    <div class="turno__info"><strong>${escapar(x.cliente)}</strong>
      <span>${escapar(x.servicio)} · ${escapar(x.profesional)}${compacta ? "" : ` · ${formatearPrecio(x.precio)}`}</span>
      ${compacta ? "" : `<span class="turno__tel">WhatsApp: ${escapar(x.whatsapp)}</span>`}
    </div>
    <span class="estado estado--${escapar(x.estado)}">${ESTADOS[x.estado] || escapar(x.estado)}</span>
    <div class="turno__acciones">
      ${x.estado !== "confirmado" && x.estado !== "cancelado" ? `<button class="boton-chico boton-chico--ok" data-confirmar="${escapar(x.id)}">Confirmar</button>` : ""}
      ${x.estado !== "cancelado" ? `<button class="boton-chico boton-chico--peligro" data-cancelar="${escapar(x.id)}">Cancelar</button>` : ""}
    </div>
  </article>`;
}

function renderControles() {
  const etiqueta = vista.modo === "dia" ? formatearFecha(vista.fecha) : (() => {
    const l = lunesDe(vista.fecha), d = sumarDias(l, 6);
    return `Del ${l.getDate()}/${l.getMonth() + 1} al ${d.getDate()}/${d.getMonth() + 1}`;
  })();
  $controles.innerHTML = `<div class="pestanas">
    <button class="pestana${vista.seccion === "agenda" && vista.modo === "dia" ? " es-activa" : ""}" data-modo="dia">Día</button>
    <button class="pestana${vista.seccion === "agenda" && vista.modo === "semana" ? " es-activa" : ""}" data-modo="semana">Semana</button>
    <button class="pestana${vista.seccion === "servicios" ? " es-activa" : ""}" data-seccion="servicios">Servicios</button>
    <button class="pestana${vista.seccion === "equipo" ? " es-activa" : ""}" data-seccion="equipo">Equipo</button>
    <button class="pestana${vista.seccion === "configuracion" ? " es-activa" : ""}" data-seccion="configuracion">Negocio</button>
  </div>${vista.seccion === "agenda" ? `<div class="navegacion">
    <button class="boton-chico" data-mover="-1" aria-label="Anterior">←</button>
    <button class="boton-chico" data-mover="0">Hoy</button>
    <button class="boton-chico" data-mover="1" aria-label="Siguiente">→</button>
    <strong class="navegacion__fecha">${etiqueta}</strong>
    <select id="filtro" class="selector" aria-label="Filtrar por profesional">
      <option value="todos">Todas las profesionales</option>
      ${profesionales.map(p => `<option value="${escapar(p.id)}" ${vista.profesional === p.id ? "selected" : ""}>${escapar(p.nombre)}</option>`).join("")}
    </select>
  </div>` : ""}`;
}

function resumenDia(fecha, lista) {
  const turnos = filtrar(lista).filter(t => t.tipo === "reserva" && t.estado !== "cancelado");
  return `<div class="metricas"><div class="metrica"><span>Turnos</span><strong>${turnos.length}</strong></div>
    <div class="metrica"><span>Pendientes</span><strong>${turnos.filter(t => t.estado === "pendiente").length}</strong></div>
    <div class="metrica"><span>Facturación estimada</span><strong>${formatearPrecio(turnos.reduce((sum, t) => sum + Number(t.precio), 0))}</strong></div></div>`;
}

function formularioBloqueo() {
  const horas = [];
  for (let m = 7 * 60; m <= 21 * 60; m += 30) horas.push(aHora(m));
  return `<details class="tarjeta bloqueo-form"><summary>Bloquear un horario</summary>
    <form id="form-bloqueo" class="bloqueo-form__grilla">
      <label class="campo"><span>Profesional</span><select name="profesionalId" class="selector" required>${profesionales.map(p => `<option value="${escapar(p.id)}">${escapar(p.nombre)}</option>`).join("")}</select></label>
      <label class="campo"><span>Día</span><input type="date" name="fecha" value="${vista.fecha}" required></label>
      <label class="campo"><span>Desde</span><select name="hora" class="selector">${horas.map(h => `<option ${h === "13:00" ? "selected" : ""}>${h}</option>`).join("")}</select></label>
      <label class="campo"><span>Duración</span><select name="duracion" class="selector">${[30, 60, 90, 120, 180, 240].map(d => `<option value="${d}">${d} min</option>`).join("")}</select></label>
      <label class="campo campo--ancho"><span>Motivo (opcional)</span><input name="motivo" maxlength="120" placeholder="Ej: Descanso, vacaciones"></label>
      <button type="submit" class="boton boton--primario campo--ancho">Bloquear horario</button><p class="error campo--ancho" id="error-bloqueo" role="alert"></p>
    </form></details>`;
}

function renderDia(lista) {
  const delDia = filtrar(lista).filter(x => x.fecha === vista.fecha).sort((a, b) => a.hora.localeCompare(b.hora));
  const horarios = configuracion.horarios[deISO(vista.fecha).getDay()];
  return `${resumenDia(vista.fecha, lista)}<p class="aviso">${horarios ? `Abierto de ${horarios.abre} a ${horarios.cierra} hs` : "Horario de atención"}</p>
    <div class="lista-turnos">${delDia.length ? delDia.map(x => tarjetaItem(x)).join("") : `<p class="aviso aviso--vacio">No hay turnos para este día.</p>`}</div>${formularioBloqueo()}`;
}

function renderSemana(lista) {
  const lunes = lunesDe(vista.fecha);
  return `<div class="semana">${Array.from({ length: 7 }, (_, i) => fechaISO(sumarDias(lunes, i))).map(iso => {
    const delDia = filtrar(lista).filter(x => x.fecha === iso).sort((a, b) => a.hora.localeCompare(b.hora));
    return `<section class="semana__dia${iso === hoyISO() ? " es-hoy" : ""}">
      <button class="semana__titulo" data-ir="${iso}">${formatearFecha(iso, { weekday: "long", day: "numeric" })}<small>${delDia.filter(x => x.tipo === "reserva" && x.estado !== "cancelado").length} turnos</small></button>
      ${delDia.length ? delDia.map(x => tarjetaItem(x, true)).join("") : `<p class="aviso aviso--vacio">Sin actividad</p>`}
    </section>`;
  }).join("")}</div>${formularioBloqueo()}`;
}

function mostrarError(mensaje) { $agenda.innerHTML = `<div class="tarjeta"><p class="error" role="alert">${escapar(mensaje)}</p></div>`; }

async function render() {
  const id = ++renderSeq;
  renderControles();
  if (vista.seccion === "servicios") { await renderServiciosAdmin($agenda); return; }
  if (vista.seccion === "equipo") { await renderEquipoAdmin($agenda); return; }
  if (vista.seccion === "configuracion") { await renderConfiguracionAdmin($agenda, configuracion.negocio); return; }
  $agenda.innerHTML = `<p class="aviso">Cargando agenda…</p>`;
  const { desde, hasta } = rangoActual();
  try {
    const query = new URLSearchParams({ desde, hasta });
    if (vista.profesional !== "todos") query.set("profesionalId", vista.profesional);
    const respuesta = await solicitarAdmin(`/api/admin/agenda?${query}`);
    if (id !== renderSeq) return;
    items = respuesta.items;
    $agenda.innerHTML = vista.modo === "dia" ? renderDia(items) : renderSemana(items);
  } catch (error) {
    if (!cerrarPorSesionVencida(error)) mostrarError(error.message);
  }
}

document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  if (d.modo) { vista.modo = d.modo; vista.seccion = "agenda"; }
  else if (d.seccion) vista.seccion = d.seccion;
  else if (d.mover !== undefined) {
    const n = Number(d.mover);
    vista.fecha = n === 0 ? hoyISO() : fechaISO(sumarDias(deISO(vista.fecha), n * (vista.modo === "dia" ? 1 : 7)));
  } else if (d.ir) { vista.fecha = d.ir; vista.modo = "dia"; }
  else if (d.confirmar || d.cancelar) {
    const estado = d.confirmar ? "confirmado" : "cancelado";
    if (estado === "cancelado" && !confirm("¿Cancelar este turno? El horario quedará libre.")) return;
    try { await solicitarAdmin(`/api/admin/reservas/${encodeURIComponent(d.confirmar || d.cancelar)}`, { method: "PATCH", body: JSON.stringify({ estado }) }); }
    catch (error) { if (!cerrarPorSesionVencida(error)) alert(error.message); }
  } else if (d.quitar) {
    if (!confirm("¿Quitar este bloqueo? El horario volverá a estar disponible.")) return;
    try { await solicitarAdmin(`/api/admin/bloqueos/${encodeURIComponent(d.quitar)}`, { method: "DELETE" }); }
    catch (error) { if (!cerrarPorSesionVencida(error)) alert(error.message); }
  } else return;
  await render();
});

document.addEventListener("change", e => {
  if (e.target.id === "filtro") { vista.profesional = e.target.value; render(); }
});

document.addEventListener("submit", async (e) => {
  if (e.target.id !== "form-bloqueo") return;
  e.preventDefault();
  const f = e.target;
  const boton = f.querySelector('button[type="submit"]');
  boton.disabled = true;
  try {
    await solicitarAdmin("/api/admin/bloqueos", { method: "POST", body: JSON.stringify({ profesionalId: f.profesionalId.value, fecha: f.fecha.value, hora: f.hora.value, duracion: Number(f.duracion.value), motivo: f.motivo.value.trim() }) });
    vista.fecha = f.fecha.value;
    await render();
  } catch (error) {
    if (!cerrarPorSesionVencida(error)) document.getElementById("error-bloqueo").textContent = error.message;
  } finally { boton.disabled = false; }
});
