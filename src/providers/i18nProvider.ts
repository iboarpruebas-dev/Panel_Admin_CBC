// idioma del panel: busca cada clave en los textos en español, pone los valores de %{nombre} y elige singular o plural con
// smart_count (1 el de delante de ||||, cualquier otro numero el de detras), sin clave usa el texto que manda react-admin (_)

import type { I18nProvider } from "react-admin";
import { textosEspanol } from "../textosEspanol";

const buscar = (clave: string): unknown =>
  clave.split(".").reduce<unknown>((nivel, parte) => (nivel && typeof nivel === "object" ? (nivel as Record<string, unknown>)[parte] : undefined), textosEspanol);

export const i18nProvider: I18nProvider = {
  translate: (clave, opciones = {}) => {
    const encontrado = buscar(clave);
    let texto: string = typeof encontrado === "string" ? encontrado : typeof opciones._ === "string" ? opciones._ : clave;
    if (texto.includes("||||")) {
      const [singular, plural] = texto.split("||||").map((parte) => parte.trim());
      texto = opciones.smart_count === 1 || opciones.smart_count === undefined ? singular : plural;
    }
    return texto.replace(/%\{(\w+)\}/g, (entero: string, nombre: string) => (opciones[nombre] !== undefined ? String(opciones[nombre]) : entero));
  },
  changeLocale: async () => {},
  getLocale: () => "es",
};
