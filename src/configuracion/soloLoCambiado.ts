// deja de un modulo solo lo que hay que guardar
//
// react-jsonschema-form rellena solo los campos que el schema declara con
// valor por defecto, asi que el formulario llega con valores que nadie ha
// escrito. si se guardara tal cual, esos valores quedarian fijados en la
// fila del cliente, y el dia que se cambiara uno en el codigo el cliente
// se quedaria con el viejo, porque ya no estaria ausente
//
// se descarta un campo en dos casos: si ya vale lo que vale lo guardado,
// porque mandarlo no cambiaria nada, y si no estaba guardado y su valor
// es exactamente el valor por defecto, que es la marca de que nadie lo ha
// tocado
//
// el backend combina lo que recibe con lo que ya hay en esa ruta, asi que
// lo que no se manda se queda como esta

function sonIguales(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function soloLoCambiado(
  datos: Record<string, unknown>,
  guardado: Record<string, unknown>,
  esquema: Record<string, unknown>
): Record<string, unknown> {
  const propiedades = (esquema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const resultado: Record<string, unknown> = {};

  for (const [clave, valor] of Object.entries(datos)) {
    const subEsquema = propiedades[clave];
    const subGuardado = guardado[clave];

    // un objeto anidado se mira campo a campo, y solo se incluye si
    // dentro queda algo que guardar
    if (valor !== null && typeof valor === "object" && !Array.isArray(valor) && subEsquema?.properties) {
      const dentro = soloLoCambiado(
        valor as Record<string, unknown>,
        (subGuardado ?? {}) as Record<string, unknown>,
        subEsquema
      );
      if (Object.keys(dentro).length > 0) resultado[clave] = dentro;
      continue;
    }

    const noEstaba = subGuardado === undefined;

    // ya vale lo que vale lo guardado, no hay nada que cambiar
    if (!noEstaba && sonIguales(valor, subGuardado)) continue;

    // nunca se guardo y vale el valor por defecto: lo ha puesto el
    // formulario, no una persona
    const esElDefecto =
      subEsquema !== undefined &&
      Object.prototype.hasOwnProperty.call(subEsquema, "default") &&
      sonIguales(valor, subEsquema.default);
    if (noEstaba && esElDefecto) continue;

    resultado[clave] = valor;
  }

  return resultado;
}
