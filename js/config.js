// ============================================================
//  CONFIGURACIÓN DEL NEGOCIO
//  Para adaptar la demo a otro negocio, editá SOLO este archivo.
// ============================================================

export const configuracion = {
  negocio: {
    nombre: "Demo Sist. Turnos",
    bajada: "Peluquería y centro de estética",
    zona: "Gran Buenos Aires",
    inicial: "D", // letra que se muestra en el logo circular
    logoUrl: "", // opcional: ruta a una imagen; si está vacío se usa la inicial
    colorPrincipal: "#C2677F",
    whatsapp: "5491155550000", // formato internacional, sin + ni espacios
    direccion: "Av. Rivadavia 18.250, Morón",
  },

  // 0 = domingo, 1 = lunes ... 6 = sábado. null = cerrado.
  horarios: {
    0: null,
    1: { abre: "09:00", cierra: "19:00" },
    2: { abre: "09:00", cierra: "19:00" },
    3: { abre: "09:00", cierra: "19:00" },
    4: { abre: "09:00", cierra: "19:00" },
    5: { abre: "09:00", cierra: "19:00" },
    6: { abre: "09:00", cierra: "14:00" },
  },

  intervaloMinutos: 30,
  diasParaReservar: 14,

  profesionales: [
    { id: "lucia", nombre: "Lucía", especialidad: "Peluquería" },
    { id: "camila", nombre: "Camila", especialidad: "Uñas y estética" },
  ],

  servicios: [
    { id: "corte", nombre: "Corte de pelo", duracion: 45, precio: 12000, profesionales: ["lucia"], descripcion: "Lavado, corte y peinado." },
    { id: "brushing", nombre: "Brushing", duracion: 40, precio: 9000, profesionales: ["lucia"], descripcion: "Secado con cepillo, liso o con ondas." },
    { id: "color", nombre: "Color completo", duracion: 120, precio: 38000, profesionales: ["lucia"], descripcion: "Coloración de raíz a puntas con matizado." },
    { id: "manicura", nombre: "Manicura", duracion: 45, precio: 8500, profesionales: ["camila"], descripcion: "Limado, cutículas y esmaltado tradicional." },
    { id: "esculpidas", nombre: "Uñas esculpidas", duracion: 90, precio: 20000, profesionales: ["camila"], descripcion: "Esculpidas en gel o acrílico, con diseño simple." },
    { id: "facial", nombre: "Limpieza facial", duracion: 60, precio: 18000, profesionales: ["camila"], descripcion: "Limpieza profunda, extracción e hidratación." },
  ],

  // Turnos de ejemplo. "dia" = días desde hoy (si cae domingo, pasa al lunes).
  turnosEjemplo: [
    { dia: 0, hora: "10:00", servicioId: "corte", profesionalId: "lucia", cliente: "Mariana Gómez", whatsapp: "11 6234-1187", estado: "confirmado" },
    { dia: 0, hora: "11:00", servicioId: "manicura", profesionalId: "camila", cliente: "Florencia Ruiz", whatsapp: "11 5821-4410", estado: "confirmado" },
    { dia: 0, hora: "12:00", servicioId: "brushing", profesionalId: "lucia", cliente: "Agustina Pereyra", whatsapp: "11 3398-2201", estado: "pendiente" },
    { dia: 1, hora: "09:30", servicioId: "color", profesionalId: "lucia", cliente: "Silvia Martínez", whatsapp: "11 4477-9012", estado: "confirmado" },
    { dia: 1, hora: "10:00", servicioId: "facial", profesionalId: "camila", cliente: "Romina Acosta", whatsapp: "11 2290-7735", estado: "pendiente" },
    { dia: 1, hora: "12:00", servicioId: "esculpidas", profesionalId: "camila", cliente: "Julieta Sosa", whatsapp: "11 6612-0048", estado: "cancelado" },
    { dia: 2, hora: "09:00", servicioId: "corte", profesionalId: "lucia", cliente: "Lorena Benítez", whatsapp: "11 5009-3321", estado: "pendiente" },
    { dia: 2, hora: "11:30", servicioId: "esculpidas", profesionalId: "camila", cliente: "Carolina Díaz", whatsapp: "11 3145-8876", estado: "confirmado" },
    { dia: 3, hora: "10:30", servicioId: "brushing", profesionalId: "lucia", cliente: "Natalia Fernández", whatsapp: "11 4870-2219", estado: "pendiente" },
    { dia: 4, hora: "09:00", servicioId: "manicura", profesionalId: "camila", cliente: "Paula Romero", whatsapp: "11 6081-5543", estado: "confirmado" },
  ],

  bloqueosEjemplo: [
    { dia: 1, hora: "13:00", duracion: 60, profesionalId: "lucia", motivo: "Almuerzo" },
    { dia: 3, hora: "09:00", duracion: 90, profesionalId: "camila", motivo: "Capacitación" },
  ],

  textos: {
    tituloReserva: "Reservá tu turno",
    subtituloReserva: "En cuatro pasos, sin llamadas ni esperas.",
    pasos: ["Servicio", "Profesional", "Día y hora", "Tus datos"],
    cualquiera: "Cualquiera",
    cualquieraDetalle: "Te asignamos quien esté libre",
    sinHorarios: "No quedan horarios libres este día. Probá con otro.",
    cerrado: "Cerrado",
    gracias: "¡Listo! Ya casi tenés tu turno",
    graciasDetalle: "Mandanos el resumen por WhatsApp para dejarlo confirmado.",
    botonWhatsapp: "Confirmar por WhatsApp",
  },
  reservas: {
    modo: "directa" //"directa" | "con_aprobacion"
  },

  admin: {
    claveDemo: "demoTurnos" // TODO: clave de ejemplo
  },

  creditos : {
    texto: "Sistema por..." //Nombre de local
  }
};

