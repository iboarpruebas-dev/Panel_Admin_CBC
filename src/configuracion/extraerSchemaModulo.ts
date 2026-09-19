import type { ModuloPanel } from "./tipos";

// si "nodo" es una referencia ($ref) a otro punto del documento, la
// resuelve y devuelve el objeto real al que apunta, si no es una
// referencia, la devuelve tal cual
function resolverSiEsReferencia(
  nodo: Record<string, unknown>,
  raiz: Record<string, unknown>
): Record<string, unknown> {
  if (typeof nodo.$ref !== "string") {
    return nodo;
  }
  const partes = nodo.$ref.replace(/^#\//, "").split("/");
  let actual: any = raiz;
  for (const parte of partes) {
    actual = actual?.[parte];
  }
  return actual ?? nodo;
}

// recorre un trozo de schema entero, a cualquier profundidad, y resuelve
// toda referencia ($ref) que encuentre por el camino -- zod-to-json-schema
// deduplica cualquier pieza que se repita exactamente igual en dos
// sitios del documento (desde un widget completo hasta un simple
// "boolean" usado varias veces), sustituyendola por una referencia al
// primer sitio donde aparecio, sin resolver estas referencias en
// profundidad, cualquier campo que sea "la segunda vez que aparece"
// ese tipo se queda sin su definicion real, y el formulario no sabe
// como mostrarlo
function resolverReferenciasProfundo(nodo: unknown, raiz: Record<string, unknown>): unknown {
  if (Array.isArray(nodo)) {
    return nodo.map((elemento) => resolverReferenciasProfundo(elemento, raiz));
  }

  if (nodo === null || typeof nodo !== "object") {
    return nodo;
  }

  const nodoResuelto = resolverSiEsReferencia(nodo as Record<string, unknown>, raiz);

  const resultado: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(nodoResuelto)) {
    resultado[clave] = resolverReferenciasProfundo(valor, raiz);
  }
  return resultado;
}

// saca, del schema completo ya convertido, solo el trozo que corresponde
// a un modulo concreto, siguiendo su rutaSchema (ej ["dashboard",
// "totalScansCard"]) paso a paso, si el modulo no especifica "campos",
// usa el objeto entero al final de la ruta, si especifica "campos", se
// queda solo con esas propiedades dentro de ese objeto (para los objetos
// grandes que se dividen en varios modulos, como los widgets del
// dashboard)
//
// importante: todo el resultado pasa por resolverReferenciasProfundo
// antes de devolverse, para que ninguna referencia interna (a cualquier
// profundidad) quede sin resolver
export function extraerSchemaModulo(
  jsonSchemaCompleto: Record<string, unknown>,
  modulo: ModuloPanel
): Record<string, unknown> {
  const definiciones = jsonSchemaCompleto.definitions as Record<string, unknown>;
  const clientConfig = definiciones.ClientConfig as { properties: Record<string, unknown> };

  let nodoActual = resolverSiEsReferencia(
    clientConfig.properties[modulo.rutaSchema[0]] as Record<string, unknown>,
    jsonSchemaCompleto
  );
  if (!nodoActual) {
    throw new Error(`no se encontro la clave "${modulo.rutaSchema[0]}" en el schema`);
  }

  for (let i = 1; i < modulo.rutaSchema.length; i++) {
    const propiedadesNodo = nodoActual.properties as Record<string, unknown> | undefined;
    const siguienteNodo = propiedadesNodo?.[modulo.rutaSchema[i]] as Record<string, unknown>;
    if (!siguienteNodo) {
      throw new Error(`no se encontro "${modulo.rutaSchema.slice(0, i + 1).join(".")}" en el schema`);
    }
    nodoActual = resolverSiEsReferencia(siguienteNodo, jsonSchemaCompleto);
  }

  let resultado: Record<string, unknown>;

  if (!modulo.campos) {
    // sin "campos": el modulo es el objeto entero al final de la ruta
    resultado = nodoActual;
  } else {
    // con "campos": mismo schema, pero solo con esas propiedades dentro
    const propiedadesCompletas = nodoActual.properties as Record<string, unknown>;
    const propiedadesFiltradas: Record<string, unknown> = {};
    for (const nombreCampo of modulo.campos) {
      if (propiedadesCompletas[nombreCampo]) {
        propiedadesFiltradas[nombreCampo] = propiedadesCompletas[nombreCampo];
      }
    }

    // el "required" original puede exigir un campo (ej. "visible") que
    // no esta en este sub-grupo concreto, eso deja un schema
    // inconsistente, asi que solo se conservan los campos de "required"
    // que de verdad estan presentes en las propiedades ya filtradas
    const requeridoOriginal = (nodoActual.required as string[] | undefined) ?? [];
    const requeridoFiltrado = requeridoOriginal.filter((campo) => campo in propiedadesFiltradas);

    resultado = { ...nodoActual, properties: propiedadesFiltradas, required: requeridoFiltrado };
  }

  const resultadoResuelto = resolverReferenciasProfundo(resultado, jsonSchemaCompleto) as Record<string, unknown>;
  return { ...resultadoResuelto, definitions: definiciones };
}
