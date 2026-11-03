import { renderEncabezado } from "./components/encabezado.js";
import { haySesion } from "./sesion.js";
import { cargarNegocio, guardarTokenAdmin, iniciarSesionAdmin, obtenerSlug, urlConSlug } from "./api.js";
import { configuracion } from "./config.js";

renderEncabezado(document.getElementById("encabezado"), { raiz: "../", mostrarCandado: false });

if(haySesion()) location.replace(urlConSlug("../admin/"));

document.querySelector('[data-enlace-inicio]')?.setAttribute("href", urlConSlug("../"));

const $form = document.getElementById("form-login");
const $email = document.getElementById("email");
const $clave = document.getElementById("clave");
const $error = document.getElementById("error");

if (obtenerSlug()) {
    cargarNegocio().then((negocio) => {
        Object.assign(configuracion.negocio, negocio);
        document.title = `Ingresar · ${negocio.nombre}`;
        renderEncabezado(document.getElementById("encabezado"), { raiz: "../", mostrarCandado: false });
    }).catch((error) => {
        $error.textContent = error.message;
        $error.hidden = false;
    });
}

$form.addEventListener("submit", async (e) => {
    e.preventDefault()// evita que el formulario recargue la página
    const boton = $form.querySelector('[type="submit"]');
    boton.disabled = true;
    $error.hidden = true;
    try {
        const respuesta = await iniciarSesionAdmin({ slug: obtenerSlug(), email: $email.value.trim(), password: $clave.value });
        guardarTokenAdmin(respuesta.token);
        location.href = urlConSlug("../admin/");
    } catch (error) {
        $error.textContent = error.message;
        $error.hidden = false;
        $clave.value = "";
        $clave.focus();
    } finally {
        boton.disabled = false;
    }
})
