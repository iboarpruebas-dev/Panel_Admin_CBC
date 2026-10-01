import type { AuthProvider } from "react-admin";
import { URL_BASE } from "./urlBase";

// conecta con tu sistema de login real (/user/login, /user/logout,
// /user/profile), usa la cookie httpOnly que ya existe, nunca guarda
// ningun token a mano en el navegador

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const respuesta = await fetch(`${URL_BASE}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // imprescindible para que la cookie se guarde
      body: JSON.stringify({ nombre: username, clave: password }),
    });

    if (!respuesta.ok) {
      throw new Error("usuario o contraseña incorrectos");
    }

    const datos = await respuesta.json();

    // el panel es solo para superadmin, si alguien con otro rol consigue
    // iniciar sesion se le rechaza aqui mismo, antes de entrar
    if (datos.user?.rol !== "superadmin") {
      await fetch(`${URL_BASE}/user/logout`, { method: "POST", credentials: "include" });
      throw new Error("este panel es solo para administradores");
    }
  },

  logout: async () => {
    await fetch(`${URL_BASE}/user/logout`, { method: "POST", credentials: "include" });
  },

  checkAuth: async () => {
    const respuesta = await fetch(`${URL_BASE}/user/profile`, { credentials: "include" });
    if (!respuesta.ok) {
      throw new Error("no autenticado");
    }
  },

  checkError: async (error) => {
    const status = error?.status;
    if (status === 401 || status === 403) {
      throw new Error("sesion no valida");
    }
    // cualquier otro error (500, de red...) no cierra la sesion sola
  },

  getIdentity: async () => {
    const respuesta = await fetch(`${URL_BASE}/user/profile`, { credentials: "include" });
    if (!respuesta.ok) {
      throw new Error("no se pudo obtener el perfil");
    }
    const datos = await respuesta.json();
    return {
      id: datos.user.id,
      fullName: datos.user.nombre,
    };
  },

  getPermissions: async () => {
    const respuesta = await fetch(`${URL_BASE}/user/profile`, { credentials: "include" });
    if (!respuesta.ok) return null;
    const datos = await respuesta.json();
    return datos.user?.rol ?? null;
  },
};
