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
        ? `<button type="button" class="pie__candado" aria-label="Acceso administrador">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock preview-icon"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </button>`
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
