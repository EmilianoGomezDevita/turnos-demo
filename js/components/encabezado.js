// Encabezado reutilizable + tema a partir del color de la configuración
import { configuracion } from "../config.js";
import { escapar } from "../turnos.js";
import { cerrarSesion } from "../sesion.js";

export function aplicarTema() {
  document.documentElement.style.setProperty("--primario", configuracion.negocio.colorPrincipal);
}

export function renderEncabezado(contenedor, {
  raiz = "./",
  etiqueta = "",
  esAdmin = false,
} = {}) {
  aplicarTema();
  const n = configuracion.negocio;
  const logo = n.logoUrl
    ? `<img class="logo__img" src="${escapar(n.logoUrl)}" alt="">`
    : `<span class="logo__inicial" aria-hidden="true">${escapar(n.inicial)}</span>`;

  const botonAccionHTML = esAdmin
    ? `<button type="button" id="btn-logout" class="boton boton--secundario">Salir 🚪</button>`
    : "";

  contenedor.innerHTML = `
    <div class="encabezado__contenido">
      <a class="logo" href="${raiz}">
        ${logo}
        <span class="logo__textos">
          <strong class="logo__nombre">${escapar(n.nombre)}</strong>
          <small class="logo__bajada">${escapar(n.bajada)}</small>
        </span>
      </a>
      ${etiqueta ? `<span class="encabezado__etiqueta">${escapar(etiqueta)}</span>` : ""}

      ${botonAccionHTML}
    </div>`;

  // Enganchamos el evento al botón correspondiente recién renderizado
  if (esAdmin) {
    const btnLogout = contenedor.querySelector("#btn-logout");
    btnLogout?.addEventListener("click", () => {
      cerrarSesion();
      window.location.href = raiz;
    });
  }
}