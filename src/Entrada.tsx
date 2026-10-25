// entrada al panel, solo para el superadmin, con la tarjeta de la pagina de mantenimiento y el modo claro u oscuro del panel

import { useState, type FormEvent } from "react";
import { useLogin, useTheme } from "react-admin";
import { ErrorEntrada } from "./providers/authProvider";
import logoIboardings from "./assets/logoIboardings.png";

const mensajeDelError = (error: unknown) => {
  const codigo = error instanceof ErrorEntrada ? error.codigo : null;
  if (codigo === 401) return "Usuario o clave incorrectos";
  if (codigo === 403) return "Usuario desactivado, habla con el administrador";
  if (codigo === 429) return "Demasiados intentos, prueba de nuevo más tarde";
  if (codigo === "rol") return "Este panel es solo para administradores";
  return "No se ha podido entrar, prueba de nuevo";
};

export default function Entrada() {
  const entrar = useLogin();
  const [modo] = useTheme();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await entrar({ username: usuario, password: clave });
    } catch (err) {
      setError(mensajeDelError(err));
      setEnviando(false);
    }
  };

  return (
    <div className="entrada" data-modo={modo}>
      <form className="entrada-tarjeta" onSubmit={enviar}>
        <img className="entrada-logo" src={logoIboardings} alt="iboardings" />
        <h1>Panel CBC</h1>
        <p className="entrada-suave">Administración · CBC</p>
        <label>
          Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label>
          Clave
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="entrada-error" role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
