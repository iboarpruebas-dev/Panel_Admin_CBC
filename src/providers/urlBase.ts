// direccion del backend (VITE_API_BASE_URL, como en el front): en local el de npm run dev, compilado vacia
// porque el panel se sirve desde el mismo dominio (d.iboardings.net/admin) y usa rutas relativas

export const URL_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
