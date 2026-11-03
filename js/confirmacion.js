// Resumen de la reserva creada por la API.
import { configuracion } from "./config.js";
import { formatearFecha, formatearPrecio, formatearDuracion, escapar } from "./turnos.js";
import { cargarNegocio, obtenerSlug, urlConSlug } from "./api.js";
import { renderEncabezado } from "./components/encabezado.js";
import { renderPiePagina } from "./components/pie.js";

const $confirmacion = document.getElementById("confirmacion");

function enlaceWhatsapp(reserva, negocio, textos) {
  const mensaje = [
    `Hola ${negocio.nombre}. Quiero consultar por mi turno:`,
    `• Servicio: ${reserva.servicio} (${formatearDuracion(reserva.duracion)})`,
    `• Profesional: ${reserva.profesional}`,
    `• Día: ${formatearFecha(reserva.fecha)}`,
    `• Hora: ${reserva.hora} hs`,
    `• Precio: ${formatearPrecio(reserva.precio)}`,
    `• Nombre: ${reserva.cliente}`,
    `• WhatsApp: ${reserva.whatsapp}`,
    `• Estado: ${reserva.estado}`,
  ].join("\n");

  const boton = textos.botonWhatsapp || "Consultar por WhatsApp";
  return {
    boton,
    href: `https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(mensaje)}`,
  };
}

async function iniciar() {
  if (!obtenerSlug()) {
    $confirmacion.innerHTML = `<div class="tarjeta confirmacion__vacia"><h1>Negocio no encontrado</h1><p>Revisá el link de reservas.</p></div>`;
    return;
  }

  try {
    const negocio = await cargarNegocio();
    Object.assign(configuracion.negocio, negocio);
    configuracion.horarios = negocio.horarios;
    configuracion.intervaloMinutos = negocio.intervaloMinutos;
    configuracion.diasParaReservar = negocio.diasParaReservar;
    configuracion.textos = negocio.textos;
    configuracion.modoDemo = false;
    renderEncabezado(document.getElementById("encabezado"), { raiz: "../" });
    renderPiePagina(document.getElementById("pie"), { raiz: "../" });
    document.title = `Confirmación · ${negocio.nombre}`;

    const guardado = JSON.parse(sessionStorage.getItem("turnos_reserva_confirmacion") || "null");
    const reserva = guardado?.slug === obtenerSlug() ? guardado.reserva : null;
    const textos = negocio.textos || {};

    if (!reserva) {
      $confirmacion.innerHTML = `<div class="tarjeta confirmacion__vacia"><h1>No encontramos tu reserva</h1>
        <p>Puede que hayas abierto esta pantalla sin completar una reserva.</p>
        <a class="boton boton--primario" href="${escapar(urlConSlug("../"))}">Reservar un turno</a></div>`;
      return;
    }

    const confirmada = reserva.estado === "confirmado";
    const titulo = confirmada
      ? (textos.gracias || "¡Tu turno quedó confirmado!")
      : "Recibimos tu solicitud de turno";
    const bajada = confirmada
      ? (textos.graciasDetalle || "Te esperamos. Si necesitás cambiarlo, contactá al local por WhatsApp.")
      : "El local tiene que aprobar el turno. Podés consultar por WhatsApp.";
    const whatsapp = enlaceWhatsapp(reserva, negocio, textos);
    const fila = (etiqueta, valor) => `<div class="resumen__fila"><dt>${etiqueta}</dt><dd>${escapar(valor ?? "")}</dd></div>`;

    $confirmacion.innerHTML = `<div class="tarjeta confirmacion__tarjeta">
      <div class="confirmacion__icono" aria-hidden="true">✓</div>
      <h1 class="confirmacion__titulo">${escapar(titulo)}</h1>
      <p class="confirmacion__bajada">${escapar(bajada)}</p>
      <dl class="resumen confirmacion__resumen">
        ${fila("Servicio", `${reserva.servicio} · ${formatearDuracion(reserva.duracion)}`)}
        ${fila("Profesional", reserva.profesional)}
        ${fila("Día", formatearFecha(reserva.fecha))}
        ${fila("Hora", `${reserva.hora} hs`)}
        ${fila("A nombre de", reserva.cliente)}
        ${fila("WhatsApp", reserva.whatsapp)}
        ${fila("Estado", confirmada ? "Confirmado" : "Pendiente de aprobación")}
      </dl>
      <p class="resumen__total"><span>Total a abonar en el local</span><strong>${formatearPrecio(reserva.precio)}</strong></p>
      <a class="boton boton--whatsapp boton--ancho" href="${escapar(whatsapp.href)}" target="_blank" rel="noopener">${escapar(whatsapp.boton)}</a>
      <a class="boton boton--secundario boton--ancho" href="${escapar(urlConSlug("../"))}">Reservar otro turno</a>
      <p class="resumen__nota">${escapar(negocio.direccion)}</p>
    </div>`;
  } catch (error) {
    $confirmacion.innerHTML = `<div class="tarjeta confirmacion__vacia"><h1>No pudimos cargar la confirmación</h1><p>${escapar(error.message)}</p></div>`;
  }
}

void iniciar();
