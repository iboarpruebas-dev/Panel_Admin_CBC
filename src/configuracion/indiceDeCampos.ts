// el buscador de la configuracion: un indice con cada campo de cada modulo (su seccion, su modulo, su ruta y su
// descripcion) y la busqueda sin mayusculas ni tildes, todo con lo que ya llega de /config-schema

import type { CategoriaPanel, ModuloPanel } from "./tipos";
import { extraerSchemaModulo } from "./extraerSchemaModulo";

export interface CampoDelIndice {
  categoria: CategoriaPanel;
  modulo: ModuloPanel;
  // dentro del modulo, p. ej. ["summaryTable", "cellPadding"]
  ruta: string[];
  descripcion: string;
  textoCampo: string;
  textoModulo: string;
}

export interface ResultadoBusqueda {
  categoria: CategoriaPanel;
  modulo: ModuloPanel;
  // sin campo es el modulo entero, que se abre por arriba
  campo?: CampoDelIndice;
}

export const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

// los campos de un modulo: cada propiedad que no es un objeto (las listas cuentan como un campo)
function camposDelModulo(nodo: Record<string, unknown>, ruta: string[], salida: Array<{ ruta: string[]; descripcion: string }>) {
  const propiedades = nodo.properties;
  if (esObjeto(propiedades)) {
    for (const [clave, hijo] of Object.entries(propiedades)) {
      if (esObjeto(hijo)) camposDelModulo(hijo, [...ruta, clave], salida);
    }
    return;
  }
  if (ruta.length) salida.push({ ruta, descripcion: typeof nodo.description === "string" ? nodo.description : "" });
}

export function construirIndice(jsonSchema: Record<string, unknown>, categorias: CategoriaPanel[]): CampoDelIndice[] {
  const indice: CampoDelIndice[] = [];
  for (const categoria of categorias) {
    for (const modulo of categoria.modulos) {
      if (modulo.aviso) continue;
      let esquema: Record<string, unknown>;
      try {
        esquema = extraerSchemaModulo(jsonSchema, modulo);
      } catch {
        // un modulo que no encaja con el schema tampoco se puede abrir, se queda fuera del buscador
        continue;
      }
      const textoModulo = normalizar(`${categoria.nombre} ${modulo.nombre}`);
      const campos: Array<{ ruta: string[]; descripcion: string }> = [];
      camposDelModulo(esquema, [], campos);
      for (const { ruta, descripcion } of campos) {
        indice.push({ categoria, modulo, ruta, descripcion, textoCampo: normalizar(`${ruta.join(" ")} ${descripcion}`), textoModulo });
      }
    }
  }
  return indice;
}

export const palabrasDe = (consulta: string) => normalizar(consulta).split(/\s+/).filter(Boolean);

// los modulos cuyo nombre o seccion tiene todas las palabras, y los campos que las tienen entre su texto y el de su
// modulo con al menos una en el propio campo; primero los modulos y despues los campos con todo en su propio texto
export function buscar(indice: CampoDelIndice[], categorias: CategoriaPanel[], consulta: string): ResultadoBusqueda[] {
  const palabras = palabrasDe(consulta);
  if (palabras.join("").length < 2) return [];

  const modulos: ResultadoBusqueda[] = [];
  for (const categoria of categorias) {
    for (const modulo of categoria.modulos) {
      const texto = normalizar(`${categoria.nombre} ${modulo.nombre}`);
      if (palabras.every((p) => texto.includes(p))) modulos.push({ categoria, modulo });
    }
  }

  const enElCampo: ResultadoBusqueda[] = [];
  const conSuModulo: ResultadoBusqueda[] = [];
  for (const campo of indice) {
    const propias = palabras.filter((p) => campo.textoCampo.includes(p)).length;
    if (!propias) continue;
    if (propias === palabras.length) enElCampo.push({ categoria: campo.categoria, modulo: campo.modulo, campo });
    else if (palabras.every((p) => campo.textoCampo.includes(p) || campo.textoModulo.includes(p))) {
      conSuModulo.push({ categoria: campo.categoria, modulo: campo.modulo, campo });
    }
  }
  return [...modulos, ...enElCampo, ...conSuModulo];
}

// trozos de un texto con lo que coincide marcado, buscando sin mayusculas ni tildes pero devolviendo el texto tal cual
export function trozosResaltados(texto: string, palabras: string[]): Array<{ texto: string; marcado: boolean }> {
  // cada letra normalizada recuerda de que letra del original sale
  let normal = "";
  const origen: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    for (const letra of normalizar(texto[i])) {
      normal += letra;
      origen.push(i);
    }
  }
  const marcado = new Array<boolean>(texto.length).fill(false);
  for (const palabra of palabras) {
    for (let desde = normal.indexOf(palabra); desde >= 0 && palabra; desde = normal.indexOf(palabra, desde + 1)) {
      for (let j = desde; j < desde + palabra.length; j++) marcado[origen[j]] = true;
    }
  }
  const trozos: Array<{ texto: string; marcado: boolean }> = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = trozos[trozos.length - 1];
    if (ultimo && ultimo.marcado === marcado[i]) ultimo.texto += texto[i];
    else trozos.push({ texto: texto[i], marcado: marcado[i] });
  }
  return trozos;
}
