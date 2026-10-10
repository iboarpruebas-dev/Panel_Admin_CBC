// uiSchema del formulario de un modulo: quita la etiqueta repetida de los booleanos y pone de placeholder
// lo que vale un campo vacio

import { leerVacio } from "./leerVacio";

// la casilla de react-jsonschema-form dibuja su descripcion y su etiqueta y el texto saldria dos veces,
// con "ui:label": false se calla y la etiqueta la pone la plantilla de campo, como en los demas

export function construirUiSchema(
  esquema: Record<string, unknown>,
  resolverReferencia?: (ruta: string) => unknown
): Record<string, unknown> {
  const propiedades = esquema.properties as Record<string, unknown> | undefined;
  if (!propiedades) return {};

  const ui: Record<string, unknown> = {};
  for (const [clave, nodo] of Object.entries(propiedades)) {
    const sub = nodo as Record<string, unknown>;
    if (sub.type === "boolean") {
      ui[clave] = { "ui:label": false };
      continue;
    }
    if (sub.type === "object") {
      const anidado = construirUiSchema(sub, resolverReferencia);
      if (Object.keys(anidado).length > 0) ui[clave] = anidado;
      continue;
    }
    // un campo que vacio significa algo lo dice dentro de la propia casilla
    const vacio = leerVacio(sub.description);
    if (vacio) {
      const texto = vacio.referencia && resolverReferencia
        ? String(resolverReferencia(vacio.referencia) ?? vacio.valor)
        : vacio.valor;
      ui[clave] = { "ui:placeholder": texto };
    }
  }
  return ui;
}
