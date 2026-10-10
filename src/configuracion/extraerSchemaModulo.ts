// saca del json schema completo el trozo de un modulo del panel, con todas sus referencias resueltas

import type { ModuloPanel } from "./tipos";

// si nodo es un $ref a otro punto del documento devuelve el objeto al que apunta, si no lo devuelve tal cual
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

// resuelve los $ref a cualquier profundidad: zod-to-json-schema puede cambiar por una referencia un trozo repetido
// (de un widget entero a un simple boolean) y sin resolverlos el formulario no sabe pintar esos campos
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

// el trozo de un modulo siguiendo su rutaSchema paso a paso: el objeto entero o, con campos, solo esas
// propiedades (objetos grandes repartidos en varios modulos), todo con las referencias resueltas
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

    // el required original puede pedir un campo que no esta en este modulo, asi que solo quedan los que si estan
    const requeridoOriginal = (nodoActual.required as string[] | undefined) ?? [];
    const requeridoFiltrado = requeridoOriginal.filter((campo) => campo in propiedadesFiltradas);

    resultado = { ...nodoActual, properties: propiedadesFiltradas, required: requeridoFiltrado };
  }

  const resultadoResuelto = resolverReferenciasProfundo(resultado, jsonSchemaCompleto) as Record<string, unknown>;
  return { ...resultadoResuelto, definitions: definiciones };
}
