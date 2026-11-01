// Lógica de turnos + persistencia en localStorage
import { configuracion } from "./config.js";

const CLAVES = {
  turnos: "aurora_turnos",
  bloqueos: "aurora_bloqueos",
  servicios: "aurora_servicios",
  ultimo: "aurora_ultimo_turno",
};

const leer = (clave, porDefecto) => {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch {
    return porDefecto;
  }
};
const guardar = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Fechas y horas ----------
export const aMinutos = (h) => {
  const [a, b] = h.split(":").map(Number);
  return a * 60 + b;
};
export const aHora = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const fechaISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const deISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const sumarDias = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
export const hoyISO = () => fechaISO(new Date());

export const formatearFecha = (iso, opciones = { weekday: "long", day: "numeric", month: "long" }) =>
  deISO(iso).toLocaleDateString("es-AR", opciones);
export const formatearPrecio = (n) => "$" + Number(n).toLocaleString("es-AR");
export const formatearDuracion = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};

export const horarioDelDia = (iso) => configuracion.horarios[deISO(iso).getDay()] || null;

// ---------- Datos de ejemplo ----------
function fechaEjemplo(dias) {
  let d = sumarDias(new Date(), dias);
  if (!configuracion.horarios[d.getDay()]) d = sumarDias(d, 1);
  return fechaISO(d);
}

function sembrar() {
  if (localStorage.getItem(CLAVES.turnos) !== null) return;
  const servicios = configuracion.servicios;
  guardar(
    CLAVES.turnos,
    configuracion.turnosEjemplo.map((t) => ({
      id: nuevoId(),
      fecha: fechaEjemplo(t.dia),
      hora: t.hora,
      duracion: servicios.find((s) => s.id === t.servicioId)?.duracion ?? 30,
      servicioId: t.servicioId,
      profesionalId: t.profesionalId,
      cliente: t.cliente,
      whatsapp: t.whatsapp,
      estado: t.estado,
    }))
  );
  guardar(
    CLAVES.bloqueos,
    configuracion.bloqueosEjemplo.map((b) => ({ id: nuevoId(), fecha: fechaEjemplo(b.dia), hora: b.hora, duracion: b.duracion, profesionalId: b.profesionalId, motivo: b.motivo }))
  );
}
sembrar();

export function restablecerDemo() {
  Object.values(CLAVES).forEach((c) => localStorage.removeItem(c));
  sembrar();
}

// ---------- Servicios y profesionales ----------
export const obtenerServicios = () => leer(CLAVES.servicios, configuracion.servicios);
export const guardarServicios = (lista) => guardar(CLAVES.servicios, lista);
export const obtenerServicio = (id) => obtenerServicios().find((s) => s.id === id);
export const obtenerProfesional = (id) => configuracion.profesionales.find((p) => p.id === id);
export const profesionalesDe = (servicio) =>
  configuracion.profesionales.filter((p) => servicio.profesionales.includes(p.id));

// ---------- Turnos ----------
export const obtenerTurnos = () => leer(CLAVES.turnos, []);
export const obtenerBloqueos = () => leer(CLAVES.bloqueos, []);

const seSuperpone = (inicioA, durA, inicioB, durB) => inicioA < inicioB + durB && inicioB < inicioA + durA;

export function estaOcupado(profesionalId, fecha, inicio, duracion) {
  const turnos = obtenerTurnos().filter((t) => t.fecha === fecha && t.profesionalId === profesionalId && t.estado !== "cancelado");
  const bloqueos = obtenerBloqueos().filter((b) => b.fecha === fecha && b.profesionalId === profesionalId);
  return [...turnos, ...bloqueos].some((x) => seSuperpone(inicio, duracion, aMinutos(x.hora), x.duracion));
}

/** Devuelve todos los horarios del día con su disponibilidad. */
export function horariosDelDia(servicio, profesionalId, fecha) {
  const h = horarioDelDia(fecha);
  if (!h) return [];
  const candidatos = profesionalId === "cualquiera" ? servicio.profesionales : [profesionalId];
  const ahora = new Date();
  const esHoy = fecha === hoyISO();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const lista = [];
  for (let m = aMinutos(h.abre); m + servicio.duracion <= aMinutos(h.cierra); m += configuracion.intervaloMinutos) {
    if (esHoy && m <= minutosAhora) continue;
    const libres = candidatos.filter((p) => !estaOcupado(p, fecha, m, servicio.duracion));
    lista.push({ hora: aHora(m), libre: libres.length > 0, profesionalId: libres[0] ?? null });
  }
  return lista;
}

export function crearTurno({ servicioId, profesionalId, fecha, hora, cliente, whatsapp }) {
  const servicio = obtenerServicio(servicioId);
  if (!servicio) throw new Error("Servicio inexistente");
  const candidatos = profesionalId === "cualquiera" ? servicio.profesionales : [profesionalId];
  const asignado = candidatos.find((p) => !estaOcupado(p, fecha, aMinutos(hora), servicio.duracion));
  if (!asignado) throw new Error("Ese horario ya fue reservado. Elegí otro, por favor.");
  const turno = { id: nuevoId(), fecha, hora, duracion: servicio.duracion, servicioId, profesionalId: asignado, cliente, whatsapp, estado: "pendiente" };
  guardar(CLAVES.turnos, [...obtenerTurnos(), turno]);
  localStorage.setItem(CLAVES.ultimo, turno.id);
  return turno;
}

export const obtenerUltimoTurno = () => {
  const id = localStorage.getItem(CLAVES.ultimo);
  return obtenerTurnos().find((t) => t.id === id) || null;
};

export function cambiarEstado(id, estado) {
  guardar(CLAVES.turnos, obtenerTurnos().map((t) => (t.id === id ? { ...t, estado } : t)));
}

export function crearBloqueo({ fecha, hora, duracion, profesionalId, motivo }) {
  if (estaOcupado(profesionalId, fecha, aMinutos(hora), duracion))
    throw new Error("Ese horario se superpone con un turno o bloqueo existente.");
  guardar(CLAVES.bloqueos, [...obtenerBloqueos(), { id: nuevoId(), fecha, hora, duracion, profesionalId, motivo }]);
}
export const quitarBloqueo = (id) => guardar(CLAVES.bloqueos, obtenerBloqueos().filter((b) => b.id !== id));

// ---------- WhatsApp ----------
export function enlaceWhatsapp(turno) {
  const s = obtenerServicio(turno.servicioId);
  const p = obtenerProfesional(turno.profesionalId);
  const texto = [
    `¡Hola ${configuracion.negocio.nombre}! Quiero confirmar mi turno:`,
    `• Servicio: ${s?.nombre ?? ""} (${formatearDuracion(turno.duracion)})`,
    `• Profesional: ${p?.nombre ?? ""}`,
    `• Día: ${formatearFecha(turno.fecha)}`,
    `• Hora: ${turno.hora} hs`,
    `• Precio: ${formatearPrecio(s?.precio ?? 0)}`,
    `• Nombre: ${turno.cliente}`,
    `• WhatsApp: ${turno.whatsapp}`,
  ].join("\n");
  return `https://wa.me/${configuracion.negocio.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
