import { solicitarAdmin } from "../api.js";
import { configuracion } from "../config.js";
import { renderEncabezado } from "../components/encabezado.js";
import { escapar } from "../turnos.js";
import { logoADataUrl } from "../logo.js";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FUENTES_TITULOS = ["Fraunces", "Playfair Display", "Lora", "DM Serif Display"];
const FUENTES_TEXTO = ["Nunito", "Montserrat", "Open Sans", "Lato"];

function opciones(fuentes, actual) {
  return fuentes.map(fuente => `<option value="${escapar(fuente)}" ${actual === fuente ? "selected" : ""}>${escapar(fuente)}</option>`).join("");
}

function filaHorario(dia, horarios) {
  const horario = horarios?.[dia];
  const cerrado = horario === null || horario === undefined;
  return `<fieldset class="configuracion-admin__horario" data-dia="${dia}">
    <legend>${DIAS[dia]}</legend>
    <label class="configuracion-admin__cerrado"><input type="checkbox" name="cerrado" ${cerrado ? "checked" : ""}> Cerrado</label>
    <label class="campo"><span>Abre</span><input type="time" name="abre" value="${escapar(horario?.abre || "09:00")}" ${cerrado ? "disabled" : "required"}></label>
    <label class="campo"><span>Cierra</span><input type="time" name="cierra" value="${escapar(horario?.cierra || "18:00")}" ${cerrado ? "disabled" : "required"}></label>
  </fieldset>`;
}

export async function renderConfiguracionAdmin(contenedor, negocio) {
  let logoDataActual = negocio.logoData || "";
  let logoUrlActual = negocio.logoUrl || "";
  let logoModificado = false;
  contenedor.innerHTML = `<section class="tarjeta"><h2 class="paso__titulo">Negocio</h2><p class="aviso">Cargando configuración…</p></section>`;
  contenedor.innerHTML = `<form id="form-configuracion-negocio" class="tarjeta configuracion-admin">
    <div><h2 class="paso__titulo">Datos del local</h2><p class="aviso">Estos datos aparecen en la reserva y en el panel.</p></div>
    <div class="configuracion-admin__grilla">
      <label class="campo"><span>Nombre del negocio</span><input name="nombre" required minlength="2" maxlength="120" value="${escapar(negocio.nombre || "")}"></label>
      <label class="campo"><span>Descripción breve</span><input name="bajada" maxlength="180" value="${escapar(negocio.bajada || "")}"></label>
      <label class="campo"><span>Zona / localidad</span><input name="zona" maxlength="120" value="${escapar(negocio.zona || "")}"></label>
      <label class="campo"><span>Dirección</span><input name="direccion" maxlength="240" value="${escapar(negocio.direccion || "")}"></label>
      <label class="campo"><span>WhatsApp internacional</span><input name="whatsapp" required inputmode="tel" placeholder="54911..." value="${escapar(negocio.whatsapp || "")}"></label>
      <label class="campo"><span>Zona horaria</span><input name="zonaHoraria" required maxlength="80" value="${escapar(negocio.zonaHoraria || "America/Argentina/Buenos_Aires")}"></label>
    </div>

    <div><h2 class="paso__titulo">Identidad visual</h2><p class="aviso">Elegí una imagen de tu celular o computadora. Se achica automáticamente; también podés dejar la inicial.</p></div>
    <div class="configuracion-admin__grilla">
      <label class="campo"><span>Color principal</span><input name="colorPrincipal" type="color" value="${/^#[0-9a-f]{6}$/i.test(negocio.colorPrincipal || "") ? negocio.colorPrincipal : "#C2677F"}"></label>
      <label class="campo"><span>Inicial del logo</span><input name="inicial" maxlength="1" value="${escapar(negocio.inicial || negocio.nombre?.[0] || "?")}"></label>
      <div class="campo campo--ancho logo-editor">
        <span>Logo del negocio</span>
        <div class="logo-editor__contenido">
          <img id="logo-preview" class="logo-editor__preview" alt="Vista previa del logo" ${logoDataActual || logoUrlActual ? `src="${escapar(logoDataActual || logoUrlActual)}"` : "hidden"}>
          <p id="logo-sin-imagen" class="aviso" ${logoDataActual || logoUrlActual ? "hidden" : ""}>Se mostrará la inicial del negocio.</p>
          <div class="logo-editor__acciones">
            <label class="boton boton--secundario logo-editor__elegir">Elegir imagen<input id="archivo-logo" type="file" accept="image/png,image/jpeg,image/webp"></label>
            <button id="quitar-logo" class="boton boton--secundario" type="button" ${logoDataActual || logoUrlActual ? "" : "disabled"}>Quitar logo</button>
          </div>
          <small>PNG, JPG o WebP. Máximo 10 MB; se guarda una versión pequeña.</small>
          <p id="error-logo" class="error" role="alert"></p>
        </div>
      </div>
      <label class="campo"><span>Tipografía de títulos</span><select name="fuenteTitulos">${opciones(FUENTES_TITULOS, negocio.fuenteTitulos || "Fraunces")}</select></label>
      <label class="campo"><span>Tipografía de texto</span><select name="fuenteTexto">${opciones(FUENTES_TEXTO, negocio.fuenteTexto || "Nunito")}</select></label>
    </div>

    <div><h2 class="paso__titulo">Reservas y horarios</h2></div>
    <div class="configuracion-admin__grilla">
      <label class="campo"><span>Modo de reserva</span><select name="modoReserva">
        <option value="directa" ${negocio.modoReserva === "directa" ? "selected" : ""}>Confirmación automática</option>
        <option value="con_aprobacion" ${negocio.modoReserva === "con_aprobacion" ? "selected" : ""}>Requiere aprobación</option>
      </select></label>
      <label class="campo"><span>Intervalo de turnos (minutos)</span><input name="intervaloMinutos" type="number" min="5" max="120" step="5" required value="${Number(negocio.intervaloMinutos) || 30}"></label>
      <label class="campo"><span>Días disponibles para reservar</span><input name="diasParaReservar" type="number" min="1" max="90" required value="${Number(negocio.diasParaReservar) || 14}"></label>
    </div>
    <div class="configuracion-admin__horarios">${DIAS.map((_, dia) => filaHorario(dia, negocio.horarios)).join("")}</div>
    <div class="acciones"><button type="submit" class="boton boton--primario">Guardar configuración</button></div>
    <p class="exito" id="configuracion-guardada" role="status"></p>
    <p class="error" id="error-configuracion" role="alert"></p>
  </form>`;

  const form = contenedor.querySelector("#form-configuracion-negocio");
  const archivoLogo = form.querySelector("#archivo-logo");
  const previewLogo = form.querySelector("#logo-preview");
  const sinImagen = form.querySelector("#logo-sin-imagen");
  const botonQuitarLogo = form.querySelector("#quitar-logo");
  archivoLogo.addEventListener("change", async () => {
    const archivo = archivoLogo.files?.[0];
    if (!archivo) return;
    const errorLogo = form.querySelector("#error-logo");
    errorLogo.textContent = "";
    try {
      logoDataActual = await logoADataUrl(archivo);
      logoUrlActual = "";
      logoModificado = true;
      previewLogo.src = logoDataActual;
      previewLogo.hidden = false;
      sinImagen.hidden = true;
      botonQuitarLogo.disabled = false;
    } catch (error) {
      archivoLogo.value = "";
      errorLogo.textContent = error.message;
    }
  });
  botonQuitarLogo.addEventListener("click", () => {
    logoDataActual = "";
    logoUrlActual = "";
    logoModificado = true;
    previewLogo.removeAttribute("src");
    previewLogo.hidden = true;
    sinImagen.hidden = false;
    botonQuitarLogo.disabled = true;
    archivoLogo.value = "";
  });

  form.querySelectorAll('[name="cerrado"]').forEach(casilla => casilla.addEventListener("change", () => {
    const fila = casilla.closest("fieldset");
    fila.querySelector('[name="abre"]').disabled = casilla.checked;
    fila.querySelector('[name="cierra"]').disabled = casilla.checked;
    fila.querySelector('[name="abre"]').required = !casilla.checked;
    fila.querySelector('[name="cierra"]').required = !casilla.checked;
  }));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const boton = form.querySelector('[type="submit"]');
    const error = form.querySelector("#error-configuracion");
    const exito = form.querySelector("#configuracion-guardada");
    error.textContent = "";
    exito.textContent = "";
    const horarios = Object.fromEntries([...form.querySelectorAll("[data-dia]")].map(fila => {
      if (fila.querySelector('[name="cerrado"]').checked) return [fila.dataset.dia, null];
      return [fila.dataset.dia, {
        abre: fila.querySelector('[name="abre"]').value,
        cierra: fila.querySelector('[name="cierra"]').value,
      }];
    }));
    const datos = {
      nombre: form.elements.nombre.value.trim(),
      bajada: form.elements.bajada.value.trim(),
      zona: form.elements.zona.value.trim(),
      zonaHoraria: form.elements.zonaHoraria.value.trim(),
      direccion: form.elements.direccion.value.trim(),
      whatsapp: form.elements.whatsapp.value.trim(),
      colorPrincipal: form.elements.colorPrincipal.value,
      inicial: form.elements.inicial.value.trim() || form.elements.nombre.value.trim()[0],
      fuenteTitulos: form.elements.fuenteTitulos.value,
      fuenteTexto: form.elements.fuenteTexto.value,
      modoReserva: form.elements.modoReserva.value,
      intervaloMinutos: Number(form.elements.intervaloMinutos.value),
      diasParaReservar: Number(form.elements.diasParaReservar.value),
      horarios,
    };
    if (logoModificado) datos.logoData = logoDataActual || null;
    boton.disabled = true;
    try {
      const respuesta = await solicitarAdmin("/api/admin/configuracion", {
        method: "PUT", body: JSON.stringify({ negocio: datos }),
      });
      Object.assign(configuracion.negocio, respuesta.negocio);
      configuracion.horarios = respuesta.negocio.horarios;
      configuracion.intervaloMinutos = respuesta.negocio.intervaloMinutos;
      configuracion.diasParaReservar = respuesta.negocio.diasParaReservar;
      configuracion.reservas = { modo: respuesta.negocio.modoReserva };
      renderEncabezado(document.getElementById("encabezado"), { raiz: "../", etiqueta: "Panel del negocio", esAdmin: true });
      exito.textContent = "Configuración guardada.";
    } catch (e) {
      error.textContent = e.message;
    } finally {
      boton.disabled = false;
    }
  });
}
