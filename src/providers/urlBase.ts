// direccion del backend: en local, el express de npm run dev; compilado
// para el servidor, vacia, porque el panel se sirve desde el mismo
// dominio que el backend (d.iboardings.net/admin) y las peticiones van
// a rutas relativas. sale de VITE_API_BASE_URL, como en el front
export const URL_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
