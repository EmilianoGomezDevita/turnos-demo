// footer reutilizable + tema a partir del color de la configuración
import { configuracion } from "../config.js";
import { escapar } from "../turnos.js";
import { abrirLogin } from "./modal-login.js";
import { haySesion } from "../sesion.js";
import { urlConSlug } from "../api.js";

export function renderPiePagina(contenedor, {
    raiz = "./",
    mostrarCandado = true,
} = {}) {
    const c = configuracion.creditos
    const botonAccionHTML = mostrarCandado
        ? `<button type="button" class="pie__candado" aria-label="Acceso administrador">🔐</button>`
        : "";

    contenedor.innerHTML = `
    <div class="pie__contenido">
        <span class="creditos">
            <small class="creditos-texto">${escapar(c.texto)}</small>
            ${botonAccionHTML}
        </span>
    </div>`;

  // Enganchamos el evento al botón correspondiente recién renderizado
  if (mostrarCandado) {
    const btnLogin = contenedor.querySelector(".pie__candado");
    btnLogin?.addEventListener("click", () => {
      const destino = urlConSlug(`${raiz}admin/`);
      if (haySesion()) {
        window.location.href = destino;
        return;
      }
      abrirLogin({ destino });
    });
  }
}
