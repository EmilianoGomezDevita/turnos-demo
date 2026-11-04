// Encabezado reutilizable + tema a partir del color de la configuración
import { configuracion } from "../config.js";
import { escapar } from "../turnos.js";
import { cerrarSesion } from "../sesion.js";

export function aplicarTema() {
  const negocio = configuracion.negocio;
  document.documentElement.style.setProperty("--primario", negocio.colorPrincipal || "#C2677F");
  document.documentElement.style.setProperty("--fuente-titulos", `"${negocio.fuenteTitulos || "Fraunces"}"`);
  document.documentElement.style.setProperty("--fuente-texto", `"${negocio.fuenteTexto || "Nunito"}"`);
  let fuentes = document.getElementById("fuentes-negocio");
  if (!fuentes) {
    fuentes = document.createElement("link");
    fuentes.id = "fuentes-negocio";
    fuentes.rel = "stylesheet";
    document.head.appendChild(fuentes);
  }
  const parametros = new URLSearchParams();
  parametros.append("family", negocio.fuenteTitulos || "Fraunces");
  parametros.append("family", negocio.fuenteTexto || "Nunito");
  parametros.set("display", "swap");
  fuentes.href = `https://fonts.googleapis.com/css2?${parametros.toString()}`;
}

export function renderEncabezado(contenedor, {
  raiz = "./",
  etiqueta = "",
  esAdmin = false,
} = {}) {
  aplicarTema();
  const n = configuracion.negocio;
  const logoFuente = n.logoData || n.logoUrl;
  const logo = logoFuente
    ? `<img class="logo__img" src="${escapar(logoFuente)}" alt="">`
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
