// boton de eliminar del todo un cliente: enseña antes lo que se borra (sus usuarios y los informes de esos usuarios)
// y pide un codigo que llega al correo del superadmin, para desactivarlo esta el switch activo de la ficha

import { useEffect, useState } from "react";
import { Button, Confirm, useNotify, useRecordContext, useRedirect, useTheme } from "react-admin";
import { URL_BASE } from "../providers/urlBase";

// lo que el servidor deja esperar entre dos codigos
const ESPERA_REENVIO_S = 60;

interface Resumen {
  cliente: string;
  usuarios: { email: string; rol: string }[];
  informes: number;
}

export default function EliminarClienteDefinitivo() {
  const cliente = useRecordContext();
  const notify = useNotify();
  const redirect = useRedirect();
  const [modo] = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [espera, setEspera] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    if (espera <= 0) return;
    const temporizador = setTimeout(() => setEspera(espera - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  if (!cliente) return null;
  const rojo = modo === "dark" ? "#f44336" : "#d32f2f";

  async function abrir() {
    setEnviado(false);
    setCodigo("");
    setEspera(0);
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

  async function pedirCodigo() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`${URL_BASE}/user/codigo-confirmacion`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idioma: "es" }),
      });
      if (!respuesta.ok) {
        setError(respuesta.status === 429 ? "espera un poco antes de pedir otro codigo" : "no se ha podido enviar el codigo, prueba de nuevo");
        return;
      }
      setEnviado(true);
      setCodigo("");
      setEspera(ESPERA_REENVIO_S);
    } catch {
      setError("no se ha podido conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  }

  async function borrar() {
    // sin el resumen delante no se borra nada
    if (!resumen || borrando) return;
    if (!enviado) {
      setError("pide primero el codigo a tu correo");
      return;
    }
    if (codigo.length !== 6) {
      setError("escribe el codigo de 6 cifras que te ha llegado al correo");
      return;
    }
    setBorrando(true);
    setError(null);
    try {
      const respuesta = await fetch(`${URL_BASE}/clientes/${cliente!.id}/definitivo`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(respuesta.status === 403 ? "codigo incorrecto o caducado" : datos.message ?? "no se ha podido borrar el cliente");
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
              : `Tambien se borran sus ${resumen.usuarios.length} usuario(s): ${resumen.usuarios.map((u) => u.email).join(", ")}.`}
            {resumen.informes > 0 && ` Y ${resumen.informes} informe(s) programado(s) de esos usuarios.`}
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>No se puede deshacer.</p>
        </>
      ) : (
        !error && <p style={{ margin: 0 }}>Comprobando que se borraria...</p>
      )}
      {!enviado ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <span>Para confirmarlo te enviaremos un codigo a tu correo.</span>
          <Button label={enviando ? "Enviando..." : "Enviar codigo a mi correo"} onClick={pedirCodigo} disabled={enviando || !resumen} />
        </div>
      ) : (
        <>
          <label htmlFor="codigo-borrado-cliente" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            Codigo de 6 cifras que te ha llegado al correo (caduca en 5 minutos)
            <input
              id="codigo-borrado-cliente"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") borrar(); }}
              style={{ font: "inherit", padding: "8px 10px", borderRadius: 4, border: "1px solid currentColor", background: "transparent", color: "inherit" }}
            />
          </label>
          <div>
            <Button
              label={espera > 0 ? `Reenviar codigo en ${espera} s` : "Reenviar codigo"}
              onClick={pedirCodigo}
              disabled={enviando || espera > 0}
            />
          </div>
        </>
      )}
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
        onClose={() => { if (!borrando) setAbierto(false); }}
      />
    </>
  );
}
