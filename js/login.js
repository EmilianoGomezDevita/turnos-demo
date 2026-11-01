import { renderEncabezado } from "./components/encabezado.js";
import { configuracion } from "./config.js";
import { iniciarSesion, haySesion } from "./sesion.js";

renderEncabezado(document.getElementById("encabezado"), { raiz: "../", mostrarCandado: false });

if(haySesion()) location.replace("../admin")

const $form = document.getElementById("form-login");
const $clave = document.getElementById("clave");
const $error = document.getElementById("error");

document.getElementById("aviso-demo").textContent = `Acceso de demostracion, no es seguro. Clave: ${configuracion.admin.claveDemo}`

$form.addEventListener("submit", (e) => {
    e.preventDefault()// evita que el formulario recargue la página

    if(iniciarSesion($clave.value)){
        location.href = "../admin"
        return
    }

    $error.textContent = "La clave es incorrecta. Probá de nuevo"
    $error.hidden = false
    $clave.value = ""
    $clave.focus()
})
