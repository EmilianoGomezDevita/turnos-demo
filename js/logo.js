const LOGO_MAX_BYTES = 150 * 1024;

function dataUrlABytes(dataUrl) {
  const base64 = dataUrl.split(",", 2)[1] || "";
  return Math.floor(base64.length * 3 / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

async function decodificarImagen(archivo) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(archivo); } catch { /* usa Image como alternativa del navegador */ }
  }
  const url = URL.createObjectURL(archivo);
  try {
    return await new Promise((resolve, reject) => {
      const imagen = new Image();
      imagen.onload = () => resolve(imagen);
      imagen.onerror = () => reject(new Error("No se pudo abrir la imagen."));
      imagen.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function logoADataUrl(archivo, maximo = 256) {
  const tiposPermitidos = new Set(["image/webp", "image/png", "image/jpeg"]);
  if (!tiposPermitidos.has(archivo.type)) {
    throw new Error("Elegí una imagen PNG, JPG o WebP. No se admiten archivos SVG.");
  }
  if (archivo.size > 10 * 1024 * 1024) throw new Error("La imagen original debe pesar menos de 10 MB.");

  const imagen = await decodificarImagen(archivo);
  try {
    if (!imagen.width || !imagen.height) throw new Error("La imagen no tiene dimensiones válidas.");
    const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("El navegador no pudo preparar la imagen.");
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

    for (const calidad of [0.85, 0.72, 0.58]) {
      const dataUrl = canvas.toDataURL("image/webp", calidad);
      if (!/^data:image\/(webp|png|jpeg);base64,/.test(dataUrl)) continue;
      if (dataUrlABytes(dataUrl) <= LOGO_MAX_BYTES) return dataUrl;
    }
    throw new Error("La imagen no se pudo comprimir lo suficiente. Probá con otra imagen más simple.");
  } finally {
    imagen.close?.();
  }
}
