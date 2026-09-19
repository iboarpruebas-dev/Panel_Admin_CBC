import { useEffect, useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import type { CategoriaPanel, ModuloPanel, RespuestaConfigSchema } from "./tipos";
import { extraerSchemaModulo } from "./extraerSchemaModulo";

const URL_BASE = "http://localhost:3000";

interface Props {
  clienteId: string | number;
}

// lee, dentro de la configuracion completa, el valor que hay en el punto
// exacto que indica una ruta (ej ["dashboard", "totalScansCard"]), si
// algun tramo de la ruta no existe todavia, devuelve un objeto vacio.
// si el modulo especifica "campos" (los sub-grupos, ej. solo el logo
// dentro de navbar), se queda solo con esos campos -- tiene que
// coincidir exactamente con lo que hace extraerSchemaModulo.ts para el
// schema, si no, el formulario recibe datos que no declara en su propio
// schema y no sabe como mostrarlos
function leerValorEnRuta(configuracion: Record<string, unknown>, modulo: ModuloPanel): Record<string, unknown> {
  let actual: unknown = configuracion;
  for (const clave of modulo.rutaSchema) {
    if (typeof actual !== "object" || actual === null) return {};
    actual = (actual as Record<string, unknown>)[clave];
  }
  const valorCompleto = (actual as Record<string, unknown>) ?? {};

  if (!modulo.campos) {
    return valorCompleto;
  }

  const valorFiltrado: Record<string, unknown> = {};
  for (const campo of modulo.campos) {
    if (campo in valorCompleto) {
      valorFiltrado[campo] = valorCompleto[campo];
    }
  }
  return valorFiltrado;
}

// coloca un valor nuevo en el punto exacto que indica una ruta, dentro
// de una copia de la configuracion (nunca modifica el objeto original),
// combinandolo con lo que ya hubiera en ese punto -- imprescindible
// porque varios modulos pueden compartir la misma ruta, diferenciados
// solo por "campos" (ej. los 7 sub-grupos de un mismo widget), sin esta
// combinacion, reflejar el guardado de uno borraria los demas en
// pantalla
function establecerValorEnRuta(
  configuracion: Record<string, unknown>,
  ruta: string[],
  valor: unknown
): Record<string, unknown> {
  const resultado = { ...configuracion };
  let actual = resultado;
  for (let i = 0; i < ruta.length - 1; i++) {
    const clave = ruta[i];
    actual[clave] = { ...((actual[clave] as Record<string, unknown>) ?? {}) };
    actual = actual[clave] as Record<string, unknown>;
  }
  const claveFinal = ruta[ruta.length - 1];
  actual[claveFinal] = { ...((actual[claveFinal] as Record<string, unknown>) ?? {}), ...(valor as Record<string, unknown>) };
  return resultado;
}

// panel de configuracion de un cliente, dividido en categorias y modulos
// (menu lateral) en vez de un unico JSON gigante. cada modulo genera su
// propio formulario a partir del schema real de Zod, convertido por el
// backend, nunca se edita JSON a mano en ningun punto de este componente
export default function ConfiguracionPanel({ clienteId }: Props) {
  const [categorias, setCategorias] = useState<CategoriaPanel[]>([]);
  const [jsonSchema, setJsonSchema] = useState<Record<string, unknown> | null>(null);
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [moduloActivo, setModuloActivo] = useState<ModuloPanel | null>(null);
  // valores del formulario mientras se editan, separado de "configuracion"
  // (que es lo ya guardado) -- se actualiza en cada cambio via onChange,
  // nunca al enviar un formulario nativo
  const [datosEnEdicion, setDatosEnEdicion] = useState<Record<string, unknown>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // se cargan el schema (una vez, es el mismo para todos los clientes) y
  // la configuracion real de este cliente en paralelo, al entrar
  useEffect(() => {
    async function cargarTodo() {
      setCargando(true);
      const [respuestaSchema, respuestaConfig] = await Promise.all([
        fetch(`${URL_BASE}/config-schema`, { credentials: "include" }),
        fetch(`${URL_BASE}/clientes/${clienteId}/configuracion`, { credentials: "include" }),
      ]);

      const datosSchema: RespuestaConfigSchema = await respuestaSchema.json();
      const datosConfig = await respuestaConfig.json();

      setCategorias(datosSchema.categorias);
      setJsonSchema(datosSchema.jsonSchema);
      setConfiguracion(datosConfig.configuracion ?? {});
      setCargando(false);
    }
    cargarTodo();
  }, [clienteId]);

  async function guardarModulo() {
    if (!moduloActivo) return;
    setGuardando(true);
    setMensaje(null);

    // se manda la ruta completa del modulo, el backend coloca este
    // valor en ese punto exacto de la configuracion ya existente, sin
    // tocar nada mas de ella
    const respuesta = await fetch(`${URL_BASE}/clientes/${clienteId}/configuracion`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ruta: moduloActivo.rutaSchema, valor: datosEnEdicion }),
    });

    setGuardando(false);

    if (!respuesta.ok) {
      setMensaje("error al guardar, revisa los datos e intentalo de nuevo");
      return;
    }

    // refleja el cambio en el estado local, para que si se vuelve a este
    // mismo modulo sin recargar la pagina, se vean los valores guardados
    setConfiguracion((actual) => establecerValorEnRuta(actual, moduloActivo.rutaSchema, datosEnEdicion));
    setMensaje("guardado correctamente");
  }

  if (cargando) {
    return <p>cargando configuracion...</p>;
  }

  if (!jsonSchema) {
    return <p>no se pudo cargar el schema de configuracion</p>;
  }

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      {/* menu lateral: categorias, cada una con sus modulos debajo */}
      <nav style={{ minWidth: "260px" }}>
        {categorias.map((categoria) => (
          <div key={categoria.id} style={{ marginBottom: "16px" }}>
            <strong>{categoria.nombre}</strong>
            <ul style={{ listStyle: "none", paddingLeft: "8px" }}>
              {categoria.modulos.map((modulo) => (
                <li key={modulo.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setModuloActivo(modulo);
                      setDatosEnEdicion(leerValorEnRuta(configuracion, modulo));
                      setMensaje(null);
                    }}
                    style={{
                      fontWeight: moduloActivo?.id === modulo.id ? "bold" : "normal",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    {modulo.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* formulario del modulo seleccionado */}
      <div style={{ flex: 1 }}>
        {!moduloActivo && <p>elige una seccion del menu para empezar</p>}

        {moduloActivo && (
          <div>
            <h3>{moduloActivo.nombre}</h3>
            {/* tagName="div": react-admin ya envuelve toda la pestaña en
            su propio <form>, sin esto, react-jsonschema-form pondria
            otro <form> dentro, HTML no permite formularios anidados.
            onChange en vez de onSubmit: un boton de "enviar" dentro de
            aqui, sin su propio <form>, terminaria disparando el <form>
            de react-admin por fuera (el que guarda nombre_cliente/
            activo), no el guardado de este modulo -- en su lugar, cada
            cambio se guarda en memoria, y el boton de abajo (uno normal,
            fuera de este componente) es quien dispara el guardado real */}
            <Form
              tagName="div"
              schema={extraerSchemaModulo(jsonSchema, moduloActivo)}
              validator={validator}
              formData={datosEnEdicion}
              onChange={({ formData }) => setDatosEnEdicion(formData)}
              disabled={guardando}
            >
              <div />
            </Form>
            <button type="button" onClick={guardarModulo} disabled={guardando}>
              {guardando ? "guardando..." : "guardar cambios"}
            </button>
            {mensaje && <p>{mensaje}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
