// query-string 9 (forzado en package.json: la 7 que pide react-admin trae decode-uri-component con un fallo) solo
// exporta por defecto, y react-admin lo importa con nombre (import { parse, stringify }); vite.config.ts manda aqui
// los imports de "query-string" y este modulo da las dos formas. Se carga por su ruta para no volver a pasar por el alias
import queryString from "../../node_modules/query-string/index.js";

export const { parse, stringify, extract, parseUrl, stringifyUrl, pick, exclude } = queryString;
export default queryString;
