// separa de un modulo lo que hay que escribir y lo que hay que borrar
//
// react-jsonschema-form rellena solo los campos que el schema declara con
// valor por defecto, asi que el formulario llega con valores que nadie ha
// escrito, y guardarlos los dejaria fijados en la fila del cliente
//
// un campo que no se ha tocado no se toca nunca, aunque este guardado
// con el mismo valor que su original: quitarlo seria un cambio que nadie
// ha pedido. se borra solo lo que se devuelve al original con el boton, o
// se vacia a mano, y se escribe lo que trae un valor propio distinto de
// lo guardado
//
// volver al original es quitar lo que el cliente habia puesto, no
// escribir encima el valor de hoy

function sonIguales(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

export interface Cambios {
  valor: Record<string, unknown>;
  // rutas relativas al modulo de los campos que hay que quitar
  borrar: string[][];
}

export function soloLoCambiado(
  datos: Record<string, unknown>,
  guardado: Record<string, unknown>,
  esquema: Record<string, unknown>,
  // rutas, unidas con puntos, de los campos que se han devuelto al
  // original con el boton en esta edicion
  restaurados: Set<string> = new Set(),
  prefijo: string[] = []
): Cambios {
  const propiedades = (esquema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const valor: Record<string, unknown> = {};
  const borrar: string[][] = [];

  // se miran tambien las claves que estaban guardadas y ya no llegan: un
  // campo vaciado puede desaparecer del formulario en vez de llegar vacio
  const claves = new Set([...Object.keys(datos), ...Object.keys(guardado)]);

  for (const clave of claves) {
    const actual = datos[clave];
    const antes = guardado[clave];
    const sub = propiedades[clave];
    const ruta = [...prefijo, clave];

    if (sub?.properties && (esObjeto(actual) || esObjeto(antes))) {
      if (actual === undefined || actual === null) {
        if (antes !== undefined) borrar.push(ruta);
        continue;
      }
      const dentro = soloLoCambiado(
        esObjeto(actual) ? actual : {},
        esObjeto(antes) ? antes : {},
        sub,
        restaurados,
        ruta
      );
      if (Object.keys(dentro.valor).length > 0) valor[clave] = dentro.valor;
      borrar.push(...dentro.borrar);
      continue;
    }

    const estaba = antes !== undefined;
    const tieneDefecto = sub !== undefined && Object.prototype.hasOwnProperty.call(sub, "default");
    const original = tieneDefecto ? sub.default : undefined;
    const vacio = actual === undefined || actual === null;

    // devuelto al original con el boton, y sin tocar despues: se quita
    if (restaurados.has(ruta.join(".")) && (vacio || sonIguales(actual, original))) {
      if (estaba) borrar.push(ruta);
      continue;
    }

    // vaciado a mano
    if (vacio) {
      if (estaba) borrar.push(ruta);
      continue;
    }

    // sin tocar: se queda como esta, sea cual sea su valor
    if (estaba && sonIguales(actual, antes)) continue;

    // vale su original sin estar guardado: lo ha puesto el formulario
    if (!estaba && tieneDefecto && sonIguales(actual, original)) continue;

    // cambiado a mano a su valor original: equivale a volver al original
    if (estaba && tieneDefecto && sonIguales(actual, original)) {
      borrar.push(ruta);
      continue;
    }

    valor[clave] = actual;
  }

  return { valor, borrar };
}
