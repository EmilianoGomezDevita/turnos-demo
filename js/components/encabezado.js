// Encabezado reutilizable + tema a partir del color de la configuración
import { configuracion } from "../config.js";
import { escapar } from "../turnos.js";
import { cerrarSesion } from "../sesion.js";
import { urlConSlug } from "../api.js";

export function aplicarTema() {
  const negocio = configuracion.negocio;
  document.documentElement.style.setProperty("--primario", negocio.colorPrincipal || "#C2677F");
  document.documentElement.style.setProperty("--fuente-titulos", `"${negocio.fuenteTitulos || "Fraunces"}"`);
  document.documentElement.style.setProperty("--fuente-texto", `"${negocio.fuenteTexto || "Nunito"}"`);

  const linkId = "fuentes-negocio";
  let link = document.getElementById(linkId);
  if (!link) {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  const fuentes = new URLSearchParams();
  fuentes.append("family", negocio.fuenteTitulos || "Fraunces");
  fuentes.append("family", negocio.fuenteTexto || "Nunito");
  fuentes.set("display", "swap");
  link.href = `https://fonts.googleapis.com/css2?${fuentes.toString()}`;
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
  const avisoDemo = configuracion.modoDemo 
    ? `<div class="aviso-demo">${escapar(configuracion.textoDemo || "Modo Demostración")}</div>` 
    : "";


  contenedor.innerHTML = `
    ${avisoDemo}
    <div class="encabezado__contenido">
      <a class="logo" href="${escapar(urlConSlug(raiz))}">
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
      window.location.href = urlConSlug(raiz);
    });
  }
}
