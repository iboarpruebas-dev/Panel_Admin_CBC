// lee del texto de ayuda de un campo que pasa si se deja vacio: "(vacio: automatico, ...)" o "(vacio: sigue a
// tema.grey100Light, ...)", en la segunda vale lo que valga ese otro campo y hay que ir a buscarlo

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
