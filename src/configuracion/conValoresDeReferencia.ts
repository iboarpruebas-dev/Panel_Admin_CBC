// pone como valor por defecto de cada campo de widget el de valoresDeReferencia ("panel.totalScansCard.width" -> 230),
// que no va en el schema del backend, asi su casilla sale rellena y con volver al original como las demas

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// el valor de una ruta: el suyo si lo trae tal cual, o el objeto que
// forman las claves que cuelgan de ella, como las categorias de un grafico
function referenciaEn(ruta: string, referencias: Record<string, unknown>): unknown {
  if (referencias[ruta] !== undefined) return referencias[ruta];
  const prefijo = ruta + ".";
  const claves = Object.keys(referencias).filter((k) => k.startsWith(prefijo));
  if (claves.length === 0) return undefined;

  const objeto: Record<string, unknown> = {};
  for (const clave of claves) {
    const tramos = clave.slice(prefijo.length).split(".");
    let actual = objeto;
    tramos.slice(0, -1).forEach((t) => {
      if (!esObjeto(actual[t])) actual[t] = {};
      actual = actual[t] as Record<string, unknown>;
    });
    actual[tramos[tramos.length - 1]] = referencias[clave];
  }
  return objeto;
}

export function conValoresDeReferencia(
  esquema: Record<string, unknown>,
  ruta: string[],
  referencias: Record<string, unknown>
): Record<string, unknown> {
  const propiedades = esquema.properties;
  if (!esObjeto(propiedades)) return esquema;

  const nuevas: Record<string, unknown> = {};
  for (const [clave, sub] of Object.entries(propiedades)) {
    if (!esObjeto(sub)) {
      nuevas[clave] = sub;
      continue;
    }
    const rutaCampo = [...ruta, clave];
    if (esObjeto(sub.properties)) {
      nuevas[clave] = conValoresDeReferencia(sub, rutaCampo, referencias);
      continue;
    }
    const valor = referenciaEn(rutaCampo.join("."), referencias);
    nuevas[clave] = valor !== undefined && !("default" in sub) ? { ...sub, default: valor } : sub;
  }
  return { ...esquema, properties: nuevas };
}
