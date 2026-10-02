import { useState } from "react";
import { Button, Confirm, useNotify, useRecordContext, useRedirect, useTheme } from "react-admin";
import { URL_BASE } from "../providers/urlBase";

// borrar de verdad un cliente: enseña antes lo que se va a llevar por
// delante (sus usuarios y los informes programados de esos usuarios) y
// pide otra vez la contraseña del superadmin. para desactivarlo esta el
// switch "activo" de la ficha

interface Resumen {
  cliente: string;
  usuarios: { nombre: string; rol: string }[];
  informes: number;
}

export default function EliminarClienteDefinitivo() {
  const cliente = useRecordContext();
  const notify = useNotify();
  const redirect = useRedirect();
  const [modo] = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  if (!cliente) return null;
  const rojo = modo === "dark" ? "#f44336" : "#d32f2f";

  async function abrir() {
    setClave("");
    setError(null);
    setResumen(null);
    setAbierto(true);
    try {
      const respuesta = await fetch(`${URL_BASE}/clientes/${cliente!.id}/borrado`, { credentials: "include" });
      if (!respuesta.ok) throw new Error();
      setResumen(await respuesta.json());
    } catch {
      setError("no se ha podido saber que se borraria, cierra y vuelve a intentarlo");
    }
  }

  async function borrar() {
    // sin el resumen delante no se borra nada
    if (!resumen || borrando) return;
    if (clave === "") {
      setError("escribe tu contraseña de superadmin");
      return;
    }
    setBorrando(true);
    setError(null);
    try {
      const respuesta = await fetch(`${URL_BASE}/clientes/${cliente!.id}/definitivo`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(respuesta.status === 403 ? "contraseña incorrecta" : datos.message ?? "no se ha podido borrar el cliente");
        return;
      }
      setAbierto(false);
      notify(`cliente ${datos.cliente} borrado, con ${datos.usuarios} usuario(s) y ${datos.informes} informe(s) programado(s)`, { type: "success" });
      redirect("list", "clientes");
    } catch {
      setError("no se ha podido conectar con el servidor");
    } finally {
      setBorrando(false);
    }
  }

  const contenido = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 320 }}>
      {resumen ? (
        <>
          <p style={{ margin: 0 }}>
            Se va a borrar el cliente <b>{resumen.cliente}</b> con su configuracion, sus aerolineas y sus aeropuertos.
          </p>
          <p style={{ margin: 0 }}>
            {resumen.usuarios.length === 0
              ? "No tiene usuarios."
              : `Tambien se borran sus ${resumen.usuarios.length} usuario(s): ${resumen.usuarios.map((u) => u.nombre).join(", ")}.`}
            {resumen.informes > 0 && ` Y ${resumen.informes} informe(s) programado(s) de esos usuarios.`}
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>No se puede deshacer.</p>
        </>
      ) : (
        !error && <p style={{ margin: 0 }}>Comprobando que se borraria...</p>
      )}
      <label htmlFor="clave-borrado-cliente" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Tu contraseña de superadmin
        <input
          id="clave-borrado-cliente"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") borrar(); }}
          style={{ font: "inherit", padding: "8px 10px", borderRadius: 4, border: "1px solid currentColor", background: "transparent", color: "inherit" }}
        />
      </label>
      {error && (
        <span role="alert" style={{ color: rojo, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );

  return (
    <>
      <Button label="Eliminar" onClick={abrir} sx={{ color: rojo }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
      </Button>
      <Confirm
        isOpen={abierto}
        loading={borrando}
        title={`Eliminar definitivamente ${cliente.nombre_cliente}`}
        content={contenido}
        confirm="Eliminar definitivamente"
        confirmColor="warning"
        cancel="Cancelar"
        onConfirm={borrar}
        onClose={() => setAbierto(false)}
      />
    </>
  );
}
