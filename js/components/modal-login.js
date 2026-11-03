import { guardarTokenAdmin, iniciarSesionAdmin, obtenerSlug } from "../api.js";

let dialogModal = null
let destinoActual = "";

export function abrirLogin({ destino }) {
    destinoActual = destino;
    if (!dialogModal) {
        dialogModal = document.createElement('dialog')
        dialogModal.className = 'modal'

        dialogModal.innerHTML = `
        <form id="form-login-modal">
            <h3>Acceso restringido</h3>
            <div class="campo">
                    <label for="input-email-modal">Correo</label>
                    <input type="email" id="input-email-modal" autocomplete="username" required maxlength="254" placeholder="Tu correo" />
                </div>
                <div class="campo">
                    <label for="input-password-modal">Contraseña</label>
                    <input type="password" id="input-password-modal" autocomplete="current-password" required maxlength="256" placeholder="Tu contraseña" />
                    <label class="mostrar-password"><input type="checkbox" id="ver-password-modal" /> Mostrar contraseña</label>
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
        const inputEmail = dialogModal.querySelector('#input-email-modal');
        const inputPassword = dialogModal.querySelector('#input-password-modal')
        const verPassword = dialogModal.querySelector('#ver-password-modal');
        const pError = dialogModal.querySelector('p[role="alert"]')
        const btnCancelar = dialogModal.querySelector('#btn-cancelar-modal')
        const btnIngresar = dialogModal.querySelector('#btn-ingresar-modal')

        btnCancelar.addEventListener('click', () => {
            dialogModal.close()
        })

        dialogModal.addEventListener("close", ()=> {
            inputEmail.value = ''
            inputPassword.value = ''
            inputPassword.type = 'password'
            verPassword.checked = false
            pError.textContent = ''
            pError.hidden = true
        })

        verPassword.addEventListener('change', () => {
            inputPassword.type = verPassword.checked ? 'text' : 'password';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnIngresar.disabled = true;
            pError.hidden = true;
            try {
                const respuesta = await iniciarSesionAdmin({
                    slug: obtenerSlug(),
                    email: inputEmail.value.trim(),
                    password: inputPassword.value,
                });
                guardarTokenAdmin(respuesta.token);
                location.href = destinoActual;
            } catch (error) {
                pError.textContent = error.message;
                pError.hidden = false;
            } finally {
                btnIngresar.disabled = false;
            }
        });
    }

    if (!dialogModal.open) dialogModal.showModal();
}
