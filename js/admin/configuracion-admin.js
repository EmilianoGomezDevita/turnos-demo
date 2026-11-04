import { configuracion } from "../config.js";
import { guardarConfiguracionDemo, escapar } from "../turnos.js";
import { renderEncabezado } from "../components/encabezado.js";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FUENTES_TITULOS = ["Fraunces", "Playfair Display", "Lora", "DM Serif Display"];
const FUENTES_TEXTO = ["Nunito", "Montserrat", "Open Sans", "Lato"];
const MAX_LOGO = 150 * 1024;

const opciones = (lista, actual) => lista.map(f => `<option value="${escapar(f)}" ${f === actual ? "selected" : ""}>${escapar(f)}</option>`).join("");

async function imagenADataUrl(archivo) {
  if (!new Set(["image/png", "image/jpeg", "image/webp"]).has(archivo.type)) throw new Error("Elegí una imagen PNG, JPG o WebP.");
  if (archivo.size > 10 * 1024 * 1024) throw new Error("La imagen original debe pesar menos de 10 MB.");
  let imagen;
  if (typeof createImageBitmap === "function") {
    try { imagen = await createImageBitmap(archivo); } catch { /* alternativa para el navegador */ }
  }
  if (!imagen) {
    const url = URL.createObjectURL(archivo);
    try {
      imagen = await new Promise((resolve, reject) => {
        const elemento = new Image();
        elemento.onload = () => resolve(elemento);
        elemento.onerror = () => reject(new Error("No se pudo abrir la imagen."));
        elemento.src = url;
      });
    } finally { URL.revokeObjectURL(url); }
  }
  try {
    const escala = Math.min(1, 256 / Math.max(imagen.width, imagen.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no pudo preparar la imagen.");
    ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    for (const calidad of [0.85, 0.72, 0.58]) {
      const data = canvas.toDataURL("image/webp", calidad);
      const base64 = data.split(",")[1] || "";
      const bytes = Math.floor(base64.length * 3 / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
      if (/^data:image\/(webp|png|jpeg);base64,/.test(data) && bytes <= MAX_LOGO) return data;
    }
    throw new Error("No se pudo achicar el logo lo suficiente. Probá con otra imagen.");
  } finally { imagen.close?.(); }
}

function filaHorario(dia) {
  const h = configuracion.horarios[dia];
  const cerrado = !h;
  return `<fieldset class="configuracion-admin__horario" data-dia="${dia}">
    <legend>${DIAS[dia]}</legend>
    <label class="configuracion-admin__cerrado"><input type="checkbox" name="cerrado" ${cerrado ? "checked" : ""}> Cerrado</label>
    <label class="campo"><span>Abre</span><input type="time" name="abre" value="${escapar(h?.abre || "09:00")}" ${cerrado ? "disabled" : "required"}></label>
    <label class="campo"><span>Cierra</span><input type="time" name="cierra" value="${escapar(h?.cierra || "18:00")}" ${cerrado ? "disabled" : "required"}></label>
  </fieldset>`;
}

export function renderConfiguracionAdmin(contenedor) {
  let logoData = configuracion.negocio.logoData || "";
  let logoModificado = false;
  const n = configuracion.negocio;
  contenedor.innerHTML = `<form id="form-configuracion-negocio" class="tarjeta configuracion-admin">
    <div><h2 class="paso__titulo">Datos del local</h2><p class="aviso">Esta demo guarda los cambios solo en este navegador.</p></div>
    <div class="configuracion-admin__grilla">
      <label class="campo"><span>Nombre del negocio</span><input name="nombre" required minlength="2" maxlength="120" value="${escapar(n.nombre)}"></label>
      <label class="campo"><span>Descripción breve</span><input name="bajada" maxlength="180" value="${escapar(n.bajada)}"></label>
      <label class="campo"><span>Zona / localidad</span><input name="zona" maxlength="120" value="${escapar(n.zona)}"></label>
      <label class="campo"><span>Dirección</span><input name="direccion" maxlength="240" value="${escapar(n.direccion)}"></label>
      <label class="campo"><span>WhatsApp internacional</span><input name="whatsapp" required inputmode="tel" value="${escapar(n.whatsapp)}"></label>
    </div>
    <div><h2 class="paso__titulo">Identidad visual</h2></div>
    <div class="configuracion-admin__grilla">
      <label class="campo"><span>Color principal</span><input name="colorPrincipal" type="color" value="${escapar(n.colorPrincipal || "#C2677F")}"></label>
      <label class="campo"><span>Inicial del logo</span><input name="inicial" maxlength="1" value="${escapar(n.inicial || n.nombre[0])}"></label>
      <div class="campo campo--ancho logo-editor"><span>Logo</span>
        <div class="logo-editor__contenido">
          <img id="logo-preview" class="logo-editor__preview" alt="Vista previa del logo" ${logoData || n.logoUrl ? `src="${escapar(logoData || n.logoUrl)}"` : "hidden"}>
          <p id="logo-sin-imagen" class="aviso" ${logoData || n.logoUrl ? "hidden" : ""}>Se mostrará la inicial del negocio.</p>
          <div class="logo-editor__acciones">
            <label class="boton boton--secundario logo-editor__elegir">Elegir imagen<input id="archivo-logo" type="file" accept="image/png,image/jpeg,image/webp"></label>
            <button id="quitar-logo" class="boton boton--secundario" type="button" ${logoData || n.logoUrl ? "" : "disabled"}>Quitar logo</button>
          </div>
          <small>PNG, JPG o WebP; máximo 10 MB. Se guarda una versión pequeña en este navegador.</small>
          <p id="error-logo" class="error" role="alert"></p>
        </div>
      </div>
      <label class="campo"><span>Tipografía de títulos</span><select name="fuenteTitulos">${opciones(FUENTES_TITULOS, n.fuenteTitulos || "Fraunces")}</select></label>
      <label class="campo"><span>Tipografía de texto</span><select name="fuenteTexto">${opciones(FUENTES_TEXTO, n.fuenteTexto || "Nunito")}</select></label>
    </div>
    <div><h2 class="paso__titulo">Reservas y horarios</h2></div>
    <div class="configuracion-admin__grilla">
      <label class="campo"><span>Modo de reserva</span><select name="modoReserva">
        <option value="directa" ${configuracion.reservas.modo === "directa" ? "selected" : ""}>Confirmación automática</option>
        <option value="con_aprobacion" ${configuracion.reservas.modo === "con_aprobacion" ? "selected" : ""}>Requiere aprobación</option>
      </select></label>
      <label class="campo"><span>Intervalo entre horarios (minutos)</span><input name="intervaloMinutos" type="number" min="5" max="120" step="5" required value="${configuracion.intervaloMinutos}"></label>
      <label class="campo"><span>Días disponibles para reservar</span><input name="diasParaReservar" type="number" min="1" max="90" required value="${configuracion.diasParaReservar}"></label>
    </div>
    <div class="configuracion-admin__horarios">${DIAS.map((_, dia) => filaHorario(dia)).join("")}</div>
    <div class="acciones"><button type="submit" class="boton boton--primario">Guardar configuración</button></div>
    <p id="guardado-configuracion" class="exito" role="status"></p><p id="error-configuracion" class="error" role="alert"></p>
  </form>`;

  const form = contenedor.querySelector("#form-configuracion-negocio");
  const preview = form.querySelector("#logo-preview");
  const sinImagen = form.querySelector("#logo-sin-imagen");
  const quitar = form.querySelector("#quitar-logo");
  const archivo = form.querySelector("#archivo-logo");
  archivo.addEventListener("change", async () => {
    if (!archivo.files?.[0]) return;
    try {
      logoData = await imagenADataUrl(archivo.files[0]);
      logoModificado = true;
      preview.src = logoData;
      preview.hidden = false;
      sinImagen.hidden = true;
      quitar.disabled = false;
      form.querySelector("#error-logo").textContent = "";
    } catch (error) {
      form.querySelector("#error-logo").textContent = error.message;
      archivo.value = "";
    }
  });
  quitar.addEventListener("click", () => {
    logoData = "";
    logoModificado = true;
    preview.removeAttribute("src");
    preview.hidden = true;
    sinImagen.hidden = false;
    quitar.disabled = true;
    archivo.value = "";
  });
  form.querySelectorAll('[name="cerrado"]').forEach(c => c.addEventListener("change", () => {
    const fila = c.closest("fieldset");
    fila.querySelector('[name="abre"]').disabled = c.checked;
    fila.querySelector('[name="cierra"]').disabled = c.checked;
    fila.querySelector('[name="abre"]').required = !c.checked;
    fila.querySelector('[name="cierra"]').required = !c.checked;
  }));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const negocio = {
      nombre: form.elements.nombre.value.trim(), bajada: form.elements.bajada.value.trim(),
      zona: form.elements.zona.value.trim(), direccion: form.elements.direccion.value.trim(),
      whatsapp: form.elements.whatsapp.value.trim(), colorPrincipal: form.elements.colorPrincipal.value,
      inicial: form.elements.inicial.value.trim() || form.elements.nombre.value.trim()[0],
      fuenteTitulos: form.elements.fuenteTitulos.value, fuenteTexto: form.elements.fuenteTexto.value,
      logoUrl: logoModificado ? "" : n.logoUrl || "",
      ...(logoModificado ? { logoData } : {}),
    };
    const horarios = Object.fromEntries([...form.querySelectorAll("[data-dia]")].map(fila => [fila.dataset.dia,
      fila.querySelector('[name="cerrado"]').checked ? null : {
        abre: fila.querySelector('[name="abre"]').value,
        cierra: fila.querySelector('[name="cierra"]').value,
      }]));
    guardarConfiguracionDemo({ negocio, horarios,
      intervaloMinutos: Number(form.elements.intervaloMinutos.value),
      diasParaReservar: Number(form.elements.diasParaReservar.value),
      reservas: { modo: form.elements.modoReserva.value },
    });
    renderEncabezado(document.getElementById("encabezado"), { raiz: "../", etiqueta: "Panel del negocio", esAdmin: true });
    window.dispatchEvent(new Event("configuracion-demo-actualizada"));
    form.querySelector("#guardado-configuracion").textContent = "Configuración guardada en este navegador.";
  });
}
