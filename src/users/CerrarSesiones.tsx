// boton de la ficha de un usuario: cierra sus sesiones abiertas en la web y en el panel, en todos sus equipos; para volver
// a entrar pide otro codigo

import { useState } from "react";
import { Button, Confirm, useGetIdentity, useLogout, useNotify, useRecordContext } from "react-admin";
import { URL_BASE } from "../providers/urlBase";

// log-out de lucide, el mismo de salir en la barra
const IconoCerrarSesiones = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </svg>
);

export default function CerrarSesiones() {
  const usuario = useRecordContext();
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const salir = useLogout();
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  if (!usuario) return null;
  // si son las propias, despues se sale tambien de este panel
  const propias = identity?.id === usuario.id;

  async function cerrar() {
    setCerrando(true);
    try {
      const respuesta = await fetch(`${URL_BASE}/users/${usuario!.id}/cerrar-sesiones`, { method: "POST", credentials: "include" });
      if (!respuesta.ok) throw new Error();
      setAbierto(false);
      notify(`sesiones de ${usuario!.email} cerradas`, { type: "success" });
      if (propias) salir();
    } catch {
      notify("no se han podido cerrar las sesiones, prueba de nuevo", { type: "error" });
    } finally {
      setCerrando(false);
    }
  }

  return (
    <>
      <Button label="Cerrar sesiones" onClick={() => setAbierto(true)}>
        <IconoCerrarSesiones />
      </Button>
      <Confirm
        isOpen={abierto}
        loading={cerrando}
        title={`Cerrar las sesiones de ${usuario.email}`}
        content={
          propias
            ? "Se cierran todas tus sesiones abiertas en la web y en el panel, en todos tus equipos, también esta. Para volver a entrar tendrás que pedir otro código."
            : "Se cierran todas sus sesiones abiertas en la web y en el panel, en todos sus equipos. Para volver a entrar tendrá que pedir otro código."
        }
        confirm="Cerrar sesiones"
        cancel="Cancelar"
        onConfirm={cerrar}
        onClose={() => setAbierto(false)}
      />
    </>
  );
}
