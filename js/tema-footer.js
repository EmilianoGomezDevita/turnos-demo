function hexARgb(hex) {
  let limpio = hex.replace("#", "").trim();
  if (limpio.length === 3) {
    limpio = limpio.split("").map(c => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return null;
  return {
    r: parseInt(limpio.slice(0, 2), 16),
    g: parseInt(limpio.slice(2, 4), 16),
    b: parseInt(limpio.slice(4, 6), 16),
  };
}

function rgbAHex({ r, g, b }) {
  return "#" + [r, g, b]
    .map(c => Math.round(c).toString(16).padStart(2, "0"))
    .join("");
}

function luminosidad({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function mezclar(color, destino, cantidad) {
  return {
    r: color.r + (destino.r - color.r) * cantidad,
    g: color.g + (destino.g - color.g) * cantidad,
    b: color.b + (destino.b - color.b) * cantidad,
  };
}

function variarTono(hex, cantidad = 0.08) {
  const rgb = hexARgb(hex);
  if (!rgb) return null;
  const destino = luminosidad(rgb) < 0.5
    ? { r: 255, g: 255, b: 255 } // oscuro -> se aclara
    : { r: 0, g: 0, b: 0 };      // claro -> se oscurece
  return rgbAHex(mezclar(rgb, destino, cantidad));
}

export function aplicarColorFooter(colorPrincipal) {
  const rgb = hexARgb(colorPrincipal);
  const fondo = variarTono(colorPrincipal);
  if (!rgb || !fondo) return; // si el color es inválido, queda el del SCSS

  const esOscuro = luminosidad(rgb) < 0.5;
  const raiz = document.documentElement.style;
  raiz.setProperty("--color-footer", fondo);
  raiz.setProperty(
    "--color-footer-texto",
    esOscuro ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.7)"
  );
}