// Flujo de reserva del cliente
import { configuracion } from "./config.js";
import {
  obtenerServicios, obtenerServicio, profesionalesDe, obtenerProfesional,
  formatearPrecio, formatearDuracion, formatearFecha, crearTurno, horariosDelDia, escapar,
} from "./turnos.js";
import { renderEncabezado } from "./components/encabezado.js";
import { renderPiePagina } from "./components/pie.js";
import { tarjetaOpcion } from "./components/tarjeta-servicio.js";
import { renderDias, renderHorarios } from "./components/selector-horario.js";

const t = configuracion.textos;
const estado = { paso: 0, servicioId: null, profesionalId: null, fecha: null, hora: null, cliente: "", whatsapp: "" };

const $app = document.getElementById("reserva");
const $resumen = document.getElementById("resumen");
renderEncabezado(document.getElementById("encabezado"), { raiz: "./" });
renderPiePagina(document.getElementById("pie"), { raiz: "./" });
document.title = `${t.tituloReserva} · ${configuracion.negocio.nombre}`;
document.getElementById("titulo").textContent = t.tituloReserva;
document.getElementById("subtitulo").textContent = t.subtituloReserva;

function progreso() {
  return `<ol class="progreso">${t.pasos
    .map((p, i) => `<li class="progreso__paso${i === estado.paso ? " es-actual" : ""}${i < estado.paso ? " es-hecho" : ""}"><span>${i + 1}</span>${p}</li>`)
    .join("")}</ol>`;
}

function pasoServicio() {
  return `<h2 class="paso__titulo">¿Qué te querés hacer?</h2>
  <div class="opciones">${obtenerServicios()
    .map((s) => tarjetaOpcion({
      nombre: "servicio", valor: s.id, titulo: s.nombre, detalle: `${s.descripcion ?? ""} · ${formatearDuracion(s.duracion)}`,
      extra: `<span class="precio">${formatearPrecio(s.precio)}</span>`, seleccionada: s.id === estado.servicioId,
    }))
    .join("")}</div>`;
}

function pasoProfesional() {
  const s = obtenerServicio(estado.servicioId);
  const pros = profesionalesDe(s);
  return `<h2 class="paso__titulo">¿Con quién?</h2>
  <div class="opciones">
    ${tarjetaOpcion({ nombre: "profesional", valor: "cualquiera", titulo: t.cualquiera, detalle: t.cualquieraDetalle, extra: `<span class="avatar avatar--suave">✦</span>`, seleccionada: estado.profesionalId === "cualquiera" })}
    ${pros.map((p) => tarjetaOpcion({ nombre: "profesional", valor: p.id, titulo: p.nombre, detalle: p.especialidad, extra: `<span class="avatar">${escapar(p.nombre[0])}</span>`, seleccionada: estado.profesionalId === p.id })).join("")}
  </div>`;
}

function pasoHorario() {
  const s = obtenerServicio(estado.servicioId);
  return `<h2 class="paso__titulo">Elegí día y horario</h2>
  ${renderDias(estado.fecha)}
  <div id="horarios">${renderHorarios(s, estado.profesionalId, estado.fecha, estado.hora)}</div>`;
}

function pasoDatos() {
  return `<h2 class="paso__titulo">Tus datos</h2>
  <form id="formulario" class="formulario" novalidate>
    <label class="campo"><span>Nombre y apellido</span>
      <input name="cliente" autocomplete="name" required value="${escapar(estado.cliente)}" placeholder="Ej: Mariana Gómez"></label>
    <label class="campo"><span>WhatsApp</span>
      <input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" required value="${escapar(estado.whatsapp)}" placeholder="Ej: 11 6234-1187"></label>
    <p class="error" id="error" role="alert"></p>
  </form>`;
}

const pasos = [pasoServicio, pasoProfesional, pasoHorario, pasoDatos];
const puedeAvanzar = () => [estado.servicioId, estado.profesionalId, estado.fecha && estado.hora, true][estado.paso];

function render() {
  $app.innerHTML = `${progreso()}<section class="paso">${pasos[estado.paso]()}</section>
  <div class="acciones">
    ${estado.paso > 0 ? `<button type="button" class="boton boton--secundario" data-accion="atras">Volver</button>` : ""}
    <button type="button" class="boton boton--primario" data-accion="siguiente" ${puedeAvanzar() ? "" : "disabled"}>${estado.paso === 3 ? "Reservar turno" : "Continuar"}</button>
  </div>`;
  renderResumen();
}

function renderResumen() {
  const s = estado.servicioId && obtenerServicio(estado.servicioId);
  const pro = estado.profesionalId === "cualquiera" ? t.cualquiera : obtenerProfesional(estado.profesionalId)?.nombre;
  const fila = (k, v) => `<div class="resumen__fila"><dt>${k}</dt><dd>${v ? escapar(v) : "—"}</dd></div>`;
  $resumen.innerHTML = `<h3 class="resumen__titulo">Tu turno</h3><dl>
    ${fila("Servicio", s?.nombre)}${fila("Profesional", pro)}
    ${fila("Día", estado.fecha && formatearFecha(estado.fecha))}${fila("Hora", estado.hora && estado.hora + " hs")}
  </dl>${s ? `<p class="resumen__total"><span>Total</span><strong>${formatearPrecio(s.precio)}</strong></p>` : ""}
  <p class="resumen__nota">${escapar(configuracion.negocio.direccion)}</p>`;
}

$app.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.dataset.servicio) {
    if (estado.servicioId !== b.dataset.servicio) Object.assign(estado, { profesionalId: null, fecha: null, hora: null });
    estado.servicioId = b.dataset.servicio;
    estado.paso = 1;
  } else if (b.dataset.profesional) {
    if (estado.profesionalId !== b.dataset.profesional) estado.hora = null;
    estado.profesionalId = b.dataset.profesional;
    estado.paso = 2;
  } else if (b.dataset.fecha) {
    estado.fecha = b.dataset.fecha;
    estado.hora = null;
  } else if (b.dataset.hora) {
    estado.hora = b.dataset.hora;
  } else if (b.dataset.accion === "atras") {
    guardarCampos();
    estado.paso--;
  } else if (b.dataset.accion === "siguiente") {
    if (estado.paso === 3) return reservar();
    estado.paso++;
  }
  render();
  if (b.dataset.servicio || b.dataset.profesional || b.dataset.accion) window.scrollTo({ top: 0, behavior: "smooth" });
});

function guardarCampos() {
  const f = document.getElementById("formulario");
  if (!f) return;
  estado.cliente = f.cliente.value.trim();
  estado.whatsapp = f.whatsapp.value.trim();
}

function reservar() {
  guardarCampos();
  const $error = document.getElementById("error");
  if (estado.cliente.length < 3) return ($error.textContent = "Ingresá tu nombre completo.");
  if (estado.whatsapp.replace(/\D/g, "").length < 8) return ($error.textContent = "Ingresá un WhatsApp válido (con característica).");
  try {
    crearTurno({ ...estado });
    location.href = "./confirmacion/";
  } catch (err) {
    const s = obtenerServicio(estado.servicioId);
    if (!horariosDelDia(s, estado.profesionalId, estado.fecha).find((h) => h.hora === estado.hora && h.libre)) {
      estado.hora = null;
      estado.paso = 2;
      render();
      document.getElementById("horarios").insertAdjacentHTML("afterbegin", `<p class="error">${escapar(err.message)}</p>`);
    } else $error.textContent = err.message;
  }
}

render();
