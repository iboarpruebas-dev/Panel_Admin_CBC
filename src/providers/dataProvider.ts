// acceso a la api desde el panel con ra-data-simple-rest

import simpleRestProvider from "ra-data-simple-rest";
import { fetchUtils } from "react-admin";
import { URL_BASE } from "./urlBase";

// con la cookie de sesion en cada peticion, fetch no la manda sola entre puertos distintos (5173 y 3000 en local)
const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  return fetchUtils.fetchJson(url, { ...options, credentials: "include" });
};

export const dataProvider = simpleRestProvider(URL_BASE, httpClient);
