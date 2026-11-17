// entrada al panel, solo para el superadmin, en dos pasos: el correo, al que llega un codigo de 6 cifras, y despues ese
// codigo; con la tarjeta de la pagina de mantenimiento y el modo claro u oscuro del panel

import { useEffect, useState, type FormEvent } from "react";
import { useLogin, useTheme } from "react-admin";
import { ErrorEntrada, pedirCodigo } from "./providers/authProvider";
import logoIboardings from "./assets/logoIboardings.png";

// lo que el servidor deja esperar entre dos codigos para el mismo correo
const ESPERA_REENVIO_S = 60;

const mensajeAlPedir = (error: unknown) => {
  const codigo = error instanceof ErrorEntrada ? error.codigo : null;
  if (codigo === 400) return "Escribe un correo válido";
  if (codigo === 429) return "Espera un poco antes de pedir otro código";
  return "No se ha podido enviar el código, prueba de nuevo";
};

const mensajeAlEntrar = (error: unknown) => {
  const codigo = error instanceof ErrorEntrada ? error.codigo : null;
  if (codigo === 400 || codigo === 401) return "Código incorrecto o caducado";
  if (codigo === 429) return "Demasiados intentos, prueba de nuevo más tarde";
  if (codigo === "rol") return "Este panel es solo para administradores";
  return "No se ha podido entrar, prueba de nuevo";
};

export default function Entrada() {
  const entrar = useLogin();
  const [modo] = useTheme();
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  // segundos que faltan para poder reenviar el codigo
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const temporizador = setTimeout(() => setEspera(espera - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  const enviarCodigo = async () => {
    setError("");
    setEnviando(true);
    try {
      await pedirCodigo(email);
      setPaso("codigo");
      setCodigo("");
      setEspera(ESPERA_REENVIO_S);
    } catch (err) {
      setError(mensajeAlPedir(err));
    } finally {
      setEnviando(false);
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (paso === "correo") {
      await enviarCodigo();
      return;
    }
    setError("");
    setEnviando(true);
    try {
      await entrar({ email, codigo });
    } catch (err) {
      setError(mensajeAlEntrar(err));
      setEnviando(false);
    }
  };

  const otroCorreo = () => {
    setPaso("correo");
    setCodigo("");
    setError("");
  };

  return (
    <div className="entrada" data-modo={modo}>
      <form className="entrada-tarjeta" onSubmit={enviar}>
        <img className="entrada-logo" src={logoIboardings} alt="iboardings" />
        <h1>Panel CBC</h1>
        <p className="entrada-suave">Administración · CBC</p>
        {paso === "correo" ? (
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoComplete="email"
              required
              autoFocus
            />
          </label>
        ) : (
          <>
            <p className="entrada-suave">
              Te hemos enviado un código a {email.trim().toLowerCase()}. Caduca en 5 minutos.
            </p>
            <label>
              Código de 6 cifras
              <input
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoFocus
              />
            </label>
          </>
        )}
        {error && (
          <p className="entrada-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
            </svg>
            {error}
          </p>
        )}
        <button type="submit" disabled={enviando || (paso === "codigo" && codigo.length !== 6)}>
          {paso === "correo" ? (enviando ? "Enviando…" : "Enviar código") : enviando ? "Entrando…" : "Entrar"}
        </button>
        {paso === "codigo" && (
          <div className="entrada-enlaces">
            <button type="button" className="entrada-enlace" onClick={otroCorreo} disabled={enviando}>
              Usar otro correo
            </button>
            <button type="button" className="entrada-enlace" onClick={enviarCodigo} disabled={enviando || espera > 0}>
              {espera > 0 ? `Reenviar código en ${espera} s` : "Reenviar código"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
