// Sesión de DEMOSTRACIÓN del panel de admin.
// No es seguridad real: la clave está en config.js y cualquiera puede verla.
import { configuracion } from "./config.js";

const CLAVE_SESION = "demo_turnos"

export function iniciarSesion(clave){
    if(clave !== configuracion.admin.claveDemo) return false
    
    sessionStorage.setItem(CLAVE_SESION, "1")
    return true
}

export function haySesion(){
    return sessionStorage.getItem(CLAVE_SESION) === "1"
}

export function cerrarSesion(){
    return sessionStorage.removeItem(CLAVE_SESION)
}