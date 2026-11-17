// entrada al panel con la de la aplicacion (/user/codigo, /user/entrar, /user/logout, /user/sesion) y su cookie httpOnly,
// sin guardar ningun token

import type { AuthProvider } from "react-admin";
import { URL_BASE } from "./urlBase";

interface Perfil {
  id: number;
  email: string;
  rol: "superadmin" | "admin";
}

// react-admin comprueba la sesion en cada cambio de pagina y cada vez que la pestaña vuelve a estar visible, asi que la
// respuesta vale un minuto y las comprobaciones que coinciden comparten la peticion; una sesion que caduca entre medias
// la descubre igual la siguiente peticion de datos (checkError)
const VIGENCIA_MS = 60 * 1000;
let perfilVigente: { promesa: Promise<Perfil | null>; hasta: number } | null = null;

// /user/sesion trae solo id, correo y rol, /user/profile trae ademas toda la configuracion del cliente
function leerPerfil(): Promise<Perfil | null> {
  if (perfilVigente && Date.now() < perfilVigente.hasta) return perfilVigente.promesa;
  const promesa = fetch(`${URL_BASE}/user/sesion`, { credentials: "include" })
    .then((respuesta) => (respuesta.ok ? (respuesta.json() as Promise<Perfil>) : null))
    .catch((error) => {
      // un fallo de red no se guarda, la siguiente comprobacion vuelve a preguntar
      perfilVigente = null;
      throw error;
    });
  perfilVigente = { promesa, hasta: Date.now() + VIGENCIA_MS };
  return promesa;
}

const olvidarPerfil = () => {
  perfilVigente = null;
};

async function cerrarSesion(): Promise<void> {
  await fetch(`${URL_BASE}/user/logout`, { method: "POST", credentials: "include" });
  olvidarPerfil();
}

// error al pedir el codigo o al entrar con el estado del servidor (400, 401, 429...) o "rol" si el usuario no es
// superadmin, la entrada elige el mensaje con el
export class ErrorEntrada extends Error {
  codigo: number | "rol";
  constructor(codigo: number | "rol") {
    super("no se ha podido entrar");
    this.codigo = codigo;
  }
}

// el servidor contesta lo mismo este o no dado de alta el correo, el codigo llega en español
export async function pedirCodigo(email: string): Promise<void> {
  const respuesta = await fetch(`${URL_BASE}/user/codigo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, idioma: "es" }),
  });
  if (!respuesta.ok) {
    throw new ErrorEntrada(respuesta.status);
  }
}

export const authProvider: AuthProvider = {
  login: async ({ email, codigo }) => {
    const respuesta = await fetch(`${URL_BASE}/user/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // para que se guarde la cookie
      body: JSON.stringify({ email, codigo }),
    });

    if (!respuesta.ok) {
      throw new ErrorEntrada(respuesta.status);
    }

    // lo guardado era de antes de entrar; el panel es solo para superadmin, pero a otro usuario no se le cierra la sesion
    // (salir se la cerraria tambien en la aplicacion, en todos sus equipos) y checkAuth no le deja pasar de la entrada
    olvidarPerfil();
    const datos = (await respuesta.json().catch(() => null)) as { user?: { rol?: string } } | null;
    if (datos?.user?.rol !== "superadmin") {
      throw new ErrorEntrada("rol");
    }
  },

  // la cookie es la misma que la de la aplicacion: solo se cierra si es de un superadmin, a un cliente se le manda al login
  // del panel sin sacarle de la aplicacion
  logout: async () => {
    const perfil = await leerPerfil();
    if (perfil?.rol === "superadmin") await cerrarSesion();
  },

  // sin sesion lleva a la entrada sin aviso, la entrada ya dice lo que hay que hacer
  checkAuth: async () => {
    const perfil = await leerPerfil();
    if (perfil?.rol !== "superadmin") {
      throw { message: false };
    }
  },

  checkError: async (error) => {
    const status = error?.status;
    if (status === 401 || status === 403) {
      olvidarPerfil();
      throw new Error("sesion no valida");
    }
    // cualquier otro error (500, de red...) no cierra la sesion sola
  },

  getIdentity: async () => {
    const perfil = await leerPerfil();
    if (!perfil) {
      throw new Error("no se pudo obtener el perfil");
    }
    return { id: perfil.id, fullName: perfil.email };
  },

  getPermissions: async () => {
    const perfil = await leerPerfil();
    return perfil?.rol ?? null;
  },
};
