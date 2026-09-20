// el widget de casilla de verificacion de react-jsonschema-form dibuja
// por su cuenta la descripcion del campo y la etiqueta al lado de la
// casilla, asi que en un campo booleano el texto de ayuda salia dos
// veces: una puesta por la plantilla de campo y otra por el propio widget
//
// el widget se calla las dos cosas cuando recibe "ui:label": false, asi
// que se recorre el schema del modulo y se le pone esa marca a todos los
// booleanos -- la plantilla de campo sigue poniendo la etiqueta, para que
// un booleano se lea igual que los demas campos

export function construirUiSchema(esquema: Record<string, unknown>): Record<string, unknown> {
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
      const anidado = construirUiSchema(sub);
      if (Object.keys(anidado).length > 0) ui[clave] = anidado;
    }
  }
  return ui;
}
