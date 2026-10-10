// login del panel contra /user (login, logout y profile) con la cookie httpOnly del backend, sin guardar
// ningun token en el navegador, solo deja entrar al superadmin

import type { AuthProvider } from "react-admin";
import { URL_BASE } from "./urlBase";

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

    // el panel es solo para el superadmin, otro rol se rechaza aqui mismo y se cierra su sesion
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
