import simpleRestProvider from "ra-data-simple-rest";
import { fetchUtils } from "react-admin";

const URL_BASE = "http://localhost:3000";

// ra-data-simple-rest, con un unico ajuste: incluir la cookie de sesion
// en cada peticion (fetch, por defecto, no la manda sola entre puertos
// distintos como localhost:5173 y localhost:3000 en desarrollo local)
const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  return fetchUtils.fetchJson(url, { ...options, credentials: "include" });
};

export const dataProvider = simpleRestProvider(URL_BASE, httpClient);
