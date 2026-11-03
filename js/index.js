// Flujo de reserva del cliente conectado a la API.
import { configuracion } from "./config.js";
import {
  formatearPrecio,
  formatearDuracion,
  formatearFecha,
  escapar,
} from "./turnos.js";
import {
  cargarDisponibilidad,
  cargarNegocio,
  cargarServicios,
  enviarReserva,
  obtenerSlug,
  urlConSlug,
} from "./api.js";
import { renderEncabezado } from "./components/encabezado.js";
import { renderPiePagina } from "./components/pie.js";
import { tarjetaOpcion } from "./components/tarjeta-servicio.js";
import { renderDias } from "./components/selector-horario.js";

const estado = {
  paso: 0,
  servicioId: null,
  profesionalId: null,
  fecha: null,
  hora: null,
  cliente: "",
  whatsapp: "",
};

const $app = document.getElementById("reserva");
const $resumen = document.getElementById("resumen");
let textos = configuracion.textos;
let servicios = [];
let numeroCargaHorarios = 0;
let errorHorario = "";

function obtenerServicio(id) {
  return servicios.find((servicio) => servicio.id === id);
}

function profesionalesDelServicio(servicio) {
  return servicio?.profesionales ?? [];
}

function obtenerProfesional(id) {
  return servicios
    .flatMap((servicio) => profesionalesDelServicio(servicio))
    .find((profesional) => profesional.id === id);
}

function progreso() {
  return `<ol class="progreso">${textos.pasos
    .map((paso, i) => `<li class="progreso__paso${i === estado.paso ? " es-actual" : ""}${i < estado.paso ? " es-hecho" : ""}"><span>${i + 1}</span>${escapar(paso)}</li>`)
    .join("")}</ol>`;
}

function pasoServicio() {
  return `<h2 class="paso__titulo">¿Qué te querés hacer?</h2>
  <div class="opciones">${servicios
    .map((servicio) => tarjetaOpcion({
      nombre: "servicio",
      valor: servicio.id,
      titulo: servicio.nombre,
      detalle: `${servicio.descripcion ?? ""} · ${formatearDuracion(servicio.duracion)}`,
      extra: `<span class="precio">${formatearPrecio(servicio.precio)}</span>`,
      seleccionada: servicio.id === estado.servicioId,
    }))
    .join("")}</div>`;
}

function pasoProfesional() {
  const servicio = obtenerServicio(estado.servicioId);
  const profesionales = profesionalesDelServicio(servicio);
  return `<h2 class="paso__titulo">¿Con quién?</h2>
  <div class="opciones">
    ${tarjetaOpcion({
      nombre: "profesional",
      valor: "cualquiera",
      titulo: textos.cualquiera,
      detalle: textos.cualquieraDetalle,
      extra: '<span class="avatar avatar--suave">✦</span>',
      seleccionada: estado.profesionalId === "cualquiera",
    })}
    ${profesionales.map((profesional) => tarjetaOpcion({
      nombre: "profesional",
      valor: profesional.id,
      titulo: profesional.nombre,
      detalle: profesional.especialidad,
      extra: `<span class="avatar">${escapar(profesional.nombre[0])}</span>`,
      seleccionada: estado.profesionalId === profesional.id,
    })).join("")}
  </div>`;
}

function pasoHorario() {
  return `<h2 class="paso__titulo">Elegí día y horario</h2>
    ${renderDias(estado.fecha)}
    <div id="horarios"><p class="aviso">Elegí un día para ver los horarios.</p></div>`;
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
const puedeAvanzar = () => [
  estado.servicioId,
  estado.profesionalId,
  estado.fecha && estado.hora,
  true,
][estado.paso];

function renderHorarios(lista, horaSeleccionada) {
  if (errorHorario) {
    const mensaje = `<p class="error" role="alert">${escapar(errorHorario)}</p>`;
    errorHorario = "";
    return mensaje;
  }
  if (!lista.length) {
    return `<p class="aviso">${escapar(textos.sinHorarios)}</p>`;
  }
  return `<div class="horarios">${lista.map(({ hora }) =>
    `<button type="button" class="horario${hora === horaSeleccionada ? " es-seleccionado" : ""}" data-hora="${escapar(hora)}">${escapar(hora)}</button>`
  ).join("")}</div>`;
}

async function cargarHorarios() {
  const contenedor = document.getElementById("horarios");
  const servicioId = estado.servicioId;
  const profesionalId = estado.profesionalId;
  const fecha = estado.fecha;
  if (!contenedor || !servicioId || !profesionalId || !fecha) return;

  const solicitud = ++numeroCargaHorarios;
  contenedor.innerHTML = '<p class="aviso">Buscando horarios disponibles…</p>';

  try {
    const lista = await cargarDisponibilidad({ servicioId, profesionalId, fecha });
    if (solicitud !== numeroCargaHorarios) return;
    contenedor.innerHTML = renderHorarios(lista, estado.hora);
  } catch (error) {
    if (solicitud !== numeroCargaHorarios) return;
    contenedor.innerHTML = `<p class="error" role="alert">${escapar(error.message)}</p>`;
  }
}

function render() {
  $app.innerHTML = `${progreso()}<section class="paso">${pasos[estado.paso]()}</section>
  <div class="acciones">
    ${estado.paso > 0 ? '<button type="button" class="boton boton--secundario" data-accion="atras">Volver</button>' : ""}
    <button type="button" class="boton boton--primario" data-accion="siguiente" ${puedeAvanzar() ? "" : "disabled"}>${estado.paso === 3 ? "Reservar turno" : "Continuar"}</button>
  </div>`;
  renderResumen();
  if (estado.paso === 2) void cargarHorarios();
}

function renderResumen() {
  const servicio = estado.servicioId && obtenerServicio(estado.servicioId);
  const profesional = estado.profesionalId === "cualquiera"
    ? textos.cualquiera
    : obtenerProfesional(estado.profesionalId)?.nombre;
  const fila = (etiqueta, valor) => `<div class="resumen__fila"><dt>${etiqueta}</dt><dd>${valor ? escapar(valor) : "—"}</dd></div>`;
  $resumen.innerHTML = `<h3 class="resumen__titulo">Tu turno</h3><dl>
    ${fila("Servicio", servicio?.nombre)}${fila("Profesional", profesional)}
    ${fila("Día", estado.fecha && formatearFecha(estado.fecha))}${fila("Hora", estado.hora && `${estado.hora} hs`)}
  </dl>${servicio ? `<p class="resumen__total"><span>Total</span><strong>${formatearPrecio(servicio.precio)}</strong></p>` : ""}
  <p class="resumen__nota">${escapar(configuracion.negocio.direccion)}</p>`;
}

function guardarCampos() {
  const formulario = document.getElementById("formulario");
  if (!formulario) return;
  estado.cliente = formulario.elements.cliente.value.trim();
  estado.whatsapp = formulario.elements.whatsapp.value.trim();
}

async function reservar() {
  guardarCampos();
  const $error = document.getElementById("error");
  if (estado.cliente.length < 3) {
    $error.textContent = "Ingresá tu nombre completo.";
    return;
  }
  if (estado.whatsapp.replace(/\D/g, "").length < 8) {
    $error.textContent = "Ingresá un WhatsApp válido (con característica).";
    return;
  }

  const boton = $app.querySelector('[data-accion="siguiente"]');
  boton.disabled = true;
  boton.textContent = "Reservando…";

  try {
    const resultado = await enviarReserva({
      servicioId: estado.servicioId,
      fecha: estado.fecha,
      hora: estado.hora,
      profesionalId: estado.profesionalId,
      cliente: estado.cliente,
      whatsapp: estado.whatsapp,
    });
    sessionStorage.setItem("turnos_reserva_confirmacion", JSON.stringify({
      slug: obtenerSlug(),
      reserva: resultado.reserva,
      negocio: configuracion.negocio,
      textos,
    }));
    window.location.href = urlConSlug("./confirmacion/");
  } catch (error) {
    if (error.status === 409) {
      estado.hora = null;
      estado.paso = 2;
      errorHorario = error.message;
      render();
      return;
    }
    $error.textContent = error.message;
    boton.disabled = false;
    boton.textContent = "Reservar turno";
  }
}

$app.addEventListener("click", (event) => {
  const boton = event.target.closest("button");
  if (!boton || boton.disabled) return;

  if (boton.dataset.servicio) {
    if (estado.servicioId !== boton.dataset.servicio) {
      Object.assign(estado, { profesionalId: null, fecha: null, hora: null });
    }
    estado.servicioId = boton.dataset.servicio;
    estado.paso = 1;
  } else if (boton.dataset.profesional) {
    if (estado.profesionalId !== boton.dataset.profesional) {
      estado.hora = null;
    }
    estado.profesionalId = boton.dataset.profesional;
    estado.paso = 2;
  } else if (boton.dataset.fecha) {
    estado.fecha = boton.dataset.fecha;
    estado.hora = null;
  } else if (boton.dataset.hora) {
    estado.hora = boton.dataset.hora;
  } else if (boton.dataset.accion === "atras") {
    guardarCampos();
    estado.paso--;
  } else if (boton.dataset.accion === "siguiente") {
    if (estado.paso === 3) {
      void reservar();
      return;
    }
    estado.paso++;
  }

  render();
  if (boton.dataset.servicio || boton.dataset.profesional || boton.dataset.accion) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

async function iniciar() {
  if (!obtenerSlug()) {
    $app.innerHTML = '<div class="tarjeta confirmacion__vacia"><h1>Negocio no encontrado</h1><p>Revisá el link de reservas.</p></div>';
    return;
  }

  $app.innerHTML = '<p class="aviso">Cargando…</p>';
  try {
    const [negocio, catalogo] = await Promise.all([cargarNegocio(), cargarServicios()]);
    Object.assign(configuracion.negocio, negocio);
    configuracion.horarios = negocio.horarios;
    configuracion.intervaloMinutos = negocio.intervaloMinutos;
    configuracion.diasParaReservar = negocio.diasParaReservar;
    configuracion.textos = negocio.textos;
    configuracion.reservas = { modo: negocio.modoReserva };
    configuracion.modoDemo = false;
    servicios = catalogo;
    textos = configuracion.textos;

    renderEncabezado(document.getElementById("encabezado"), { raiz: "./" });
    renderPiePagina(document.getElementById("pie"), { raiz: "./" });
    document.title = `${textos.tituloReserva} · ${negocio.nombre}`;
    document.getElementById("titulo").textContent = textos.tituloReserva;
    document.getElementById("subtitulo").textContent = textos.subtituloReserva;
    render();
  } catch (error) {
    if (error.status === 404) {
      $app.innerHTML = '<div class="tarjeta confirmacion__vacia"><h1>Negocio no encontrado</h1><p>Revisá el link de reservas.</p></div>';
      return;
    }
    $app.innerHTML = `<div class="tarjeta confirmacion__vacia"><h1>No pudimos cargar las reservas</h1><p>${escapar(error.message)}</p></div>`;
  }
}

void iniciar();
