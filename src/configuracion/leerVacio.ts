// lee del texto de ayuda de un campo que pasa si se deja vacio, escrito al
// final igual que el valor por defecto: "(vacio: automatico, se calcula a
// partir del alto)". sirve para los campos que no pueden llevar un valor
// fijo porque el suyo depende de cada caso
export function leerVacio(descripcion: unknown): { valor: string; explicacion?: string } | null {
  if (typeof descripcion !== "string") return null;
  const m = descripcion.match(/\(vacio: ([^,)]+)(?:, ([^)]+))?\)\s*$/);
  if (!m) return null;
  return { valor: m[1].trim(), explicacion: m[2]?.trim() };
}
