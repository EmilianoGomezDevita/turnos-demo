import { iniciarSesion } from "../sesion.js";
import { configuracion } from "../config.js";
import { escapar } from "../turnos.js";

let dialogModal = null
let destinoActual = "";

export function abrirLogin({ destino }) {
    destinoActual = destino;
    if (!dialogModal) {
        dialogModal = document.createElement('dialog')
        dialogModal.className = 'modal'

        //APARECE EL AVISO SI ESTA EN MODO DEMO
        const avisoClave = configuracion.modoDemo 
            ? `<p class="aviso-clave">Demo: la clave es ${escapar(configuracion.admin.claveDemo)}</p>` 
            : "";

        dialogModal.innerHTML = `
        <form id="form-login-modal">
            <h3>Acceso restringido</h3>
            ${avisoClave}
            <div class="campo">
                    <label for="input-password-modal">Contraseña</label>
                    <input type="password" id="input-password-modal" required placeholder="Ingresá tu contraseña" />
                </div>
                <p role="alert" hidden class="error-msg"></p>
                <div class="acciones">
                    <button type="button" id="btn-cancelar-modal" class="boton boton--secundario">Cancelar</button>
                    <button type="submit" id="btn-ingresar-modal" class="boton boton--primario">Ingresar</button>
                </div>
        </form>
        `;

        document.body.appendChild(dialogModal)

        const form = dialogModal.querySelector('#form-login-modal');
        const inputPassword = dialogModal.querySelector('#input-password-modal')
        const pError = dialogModal.querySelector('p[role="alert"]')
        const btnCancelar = dialogModal.querySelector('#btn-cancelar-modal')

        btnCancelar.addEventListener('click', () => {
            dialogModal.close()
        })

        dialogModal.addEventListener("close", ()=> {
            inputPassword.value = ''
            pError.textContent = ''
            pError.hidden = true
        })

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const clave = inputPassword.value;
            const esValido = iniciarSesion(clave);

            if (esValido) {
                location.href = destinoActual;
            } else {
                pError.textContent = "Contraseña incorrecta. Intentá de nuevo.";
                pError.hidden = false;
                inputPassword.value = '';
                inputPassword.focus();
            }
        });
    }

    if (!dialogModal.open) dialogModal.showModal();
}
