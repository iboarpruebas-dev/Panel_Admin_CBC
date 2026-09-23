// lee del texto de ayuda de un campo que pasa si se deja vacio, escrito al
// final igual que el valor por defecto
//
//   (vacio: automatico, se calcula a partir del alto)
//   (vacio: sigue a tema.grey100Light, el gris 100 del tema)
//
// la segunda forma apunta a otro campo de la configuracion: vacio vale lo
// que valga ese, y quien lo lea tiene que ir a buscarlo para ensenar el
// valor de verdad y no el nombre del campo
export interface Vacio {
  valor: string;
  explicacion?: string;
  referencia?: string;
}

export function leerVacio(descripcion: unknown): Vacio | null {
  if (typeof descripcion !== "string") return null;
  const m = descripcion.match(/\(vacio: ([^,)]+)(?:, ([^)]+))?\)\s*$/);
  if (!m) return null;

  const primero = m[1].trim();
  const explicacion = m[2]?.trim();
  const ref = primero.match(/^sigue a (\S+)$/);
  return ref ? { valor: ref[1], explicacion, referencia: ref[1] } : { valor: primero, explicacion };
}
