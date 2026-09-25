import { useCallback, useEffect, useMemo, useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import type { CategoriaPanel, ModuloPanel, RespuestaConfigSchema } from "./tipos";
import { extraerSchemaModulo } from "./extraerSchemaModulo";
import { useTheme } from "react-admin";
import {
  PlantillaCampo,
  PlantillaElementoLista,
  PlantillaLista,
  PlantillaObjeto,
  type ContextoConfig,
} from "./PlantillaCampo";
import { construirUiSchema } from "./construirUiSchema";
import { soloLoCambiado } from "./soloLoCambiado";
import { conValoresDeReferencia } from "./conValoresDeReferencia";

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

// cuenta cuantos campos del modulo tiene guardados este cliente, y
// cuantos hay en total -- sirve para decir de un vistazo cuanto de este
// apartado esta personalizado y cuanto viene tal cual del valor original
function contarCampos(
  esquemaModulo: Record<string, unknown>,
  guardado: Record<string, unknown>
): { total: number; guardados: number } {
  let total = 0;
  let guardados = 0;

  function recorrer(nodo: Record<string, unknown>, valor: unknown) {
    const propiedades = nodo.properties as Record<string, unknown> | undefined;
    if (propiedades) {
      for (const [clave, subNodo] of Object.entries(propiedades)) {
        const subValor =
          valor !== null && typeof valor === "object"
            ? (valor as Record<string, unknown>)[clave]
            : undefined;
        recorrer(subNodo as Record<string, unknown>, subValor);
      }
      return;
    }
    total++;
    if (valor !== undefined) guardados++;
  }

  recorrer(esquemaModulo, guardado);
  return { total, guardados };
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
  actual[claveFinal] = combinarProfundo((actual[claveFinal] as Record<string, unknown>) ?? {}, valor as Record<string, unknown>);
  return resultado;
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// el panel manda solo lo que cambia, asi que un objeto anidado llega a
// medias y tiene que sumarse a lo que habia, no sustituirlo
function combinarProfundo(base: Record<string, unknown>, cambios: Record<string, unknown>): Record<string, unknown> {
  const resultado = { ...base };
  for (const [clave, valor] of Object.entries(cambios)) {
    resultado[clave] = esObjeto(valor) && esObjeto(resultado[clave])
      ? combinarProfundo(resultado[clave] as Record<string, unknown>, valor)
      : valor;
  }
  return resultado;
}

// lo mismo que hace el backend al guardar, para que el estado local no se
// quede diciendo algo distinto de lo que hay en la base
function quitarEnRuta(configuracion: Record<string, unknown>, ruta: string[], borrar: string[][]): Record<string, unknown> {
  const resultado = JSON.parse(JSON.stringify(configuracion));
  for (const relativa of borrar) {
    const completa = [...ruta, ...relativa];
    let actual: unknown = resultado;
    for (let i = 0; i < completa.length - 1; i++) {
      actual = esObjeto(actual) ? actual[completa[i]] : undefined;
    }
    if (esObjeto(actual)) delete actual[completa[completa.length - 1]];
  }
  return resultado;
}

// dice por que ha fallado el guardado en vez de echarle la culpa a los
// datos siempre: la sesion caducada y un campo mal puesto se arreglan de
// formas distintas, y con un unico mensaje no hay manera de saber cual de
// las dos es
//
// el panel y la aplicacion comparten la cookie de localhost, asi que
// entrar en una cierra la sesion de la otra: es un 403 con los datos
// perfectamente bien
async function explicarFallo(respuesta: Response): Promise<string> {
  if (respuesta.status === 401) {
    return "error: se ha cerrado la sesion, vuelve a entrar y repite el cambio";
  }
  if (respuesta.status === 403) {
    return "error: esta sesion no es de superadmin, comprueba con que usuario has entrado";
  }

  let detalle = "";
  try {
    const cuerpo = await respuesta.json();
    // una configuracion que no valida trae el motivo de cada fallo aparte,
    // y ese motivo es lo unico que le sirve a quien esta rellenando
    if (cuerpo && Array.isArray(cuerpo.detalles) && cuerpo.detalles.length > 0) {
      return "no se ha guardado: " + cuerpo.detalles.map((d: { mensaje?: unknown }) => String(d.mensaje)).join(", ");
    }
    if (cuerpo && typeof cuerpo.message === "string") detalle = ": " + cuerpo.message;
  } catch {
    // respuesta sin json, se queda solo el codigo
  }
  return `error al guardar (${respuesta.status})${detalle}`;
}

// panel de configuracion de un cliente, dividido en categorias y modulos
// (menu lateral) en vez de un unico JSON gigante. cada modulo genera su
// propio formulario a partir del schema real de Zod, convertido por el
// backend, nunca se edita JSON a mano en ningun punto de este componente
export default function ConfiguracionPanel({ clienteId }: Props) {
  const [categorias, setCategorias] = useState<CategoriaPanel[]>([]);
  const [jsonSchema, setJsonSchema] = useState<Record<string, unknown> | null>(null);
  const [valoresDeReferencia, setValoresDeReferencia] = useState<Record<string, unknown>>({});
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [moduloActivo, setModuloActivo] = useState<ModuloPanel | null>(null);
  // valores del formulario mientras se editan, separado de "configuracion"
  // (que es lo ya guardado) -- se actualiza en cada cambio via onChange,
  // nunca al enviar un formulario nativo
  const [datosEnEdicion, setDatosEnEdicion] = useState<Record<string, unknown>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  // campos devueltos al original con el boton en esta edicion
  const [restaurados, setRestaurados] = useState<Set<string>>(new Set());
  // el modo claro u oscuro que se elige en la cabecera de react-admin: los
  // colores del panel salen de el (ver index.css)
  const [modo] = useTheme();

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
      setValoresDeReferencia(datosSchema.valoresDeReferencia ?? {});
      setConfiguracion(datosConfig.configuracion ?? {});
      setCargando(false);
    }
    cargarTodo();
  }, [clienteId]);

  async function guardarModulo() {
    if (!moduloActivo || !esquemaModulo) return;

    // no se manda el formulario entero: react-jsonschema-form rellena
    // solo los campos con valor por defecto, y guardarlos fijaria en la
    // fila del cliente valores que nadie ha escrito
    const { valor: aGuardar, borrar } = soloLoCambiado(
      datosEnEdicion,
      leerValorEnRuta(configuracion, moduloActivo),
      esquemaModulo,
      restaurados
    );

    if (Object.keys(aGuardar).length === 0 && borrar.length === 0) {
      setMensaje("no hay nada que guardar, este apartado esta como estaba");
      return;
    }

    setGuardando(true);
    setMensaje(null);

    // se manda la ruta completa del modulo, el backend coloca este
    // valor en ese punto exacto de la configuracion ya existente, sin
    // tocar nada mas de ella
    const respuesta = await fetch(`${URL_BASE}/clientes/${clienteId}/configuracion`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ruta: moduloActivo.rutaSchema, valor: aGuardar, borrar }),
    });

    setGuardando(false);

    if (!respuesta.ok) {
      setMensaje(await explicarFallo(respuesta));
      return;
    }

    // refleja el cambio en el estado local, para que si se vuelve a este
    // mismo modulo sin recargar la pagina, se vean los valores guardados
    setConfiguracion((actual) =>
      quitarEnRuta(establecerValorEnRuta(actual, moduloActivo.rutaSchema, aGuardar), moduloActivo.rutaSchema, borrar)
    );
    setRestaurados(new Set());
    setMensaje("guardado correctamente");
  }

  // el schema del modulo activo y su recuento de campos se calculan una
  // sola vez por modulo, no en cada tecla que se pulse en el formulario;
  // lleva ya como valor por defecto el de referencia de los widgets
  const esquemaModulo = useMemo(
    () =>
      jsonSchema && moduloActivo
        ? conValoresDeReferencia(extraerSchemaModulo(jsonSchema, moduloActivo), moduloActivo.rutaSchema, valoresDeReferencia)
        : null,
    [jsonSchema, moduloActivo, valoresDeReferencia]
  );

  // lo que vale ahora cualquier campo para este cliente: el guardado, o si
  // no esta, su valor por defecto del schema
  const resolverReferencia = useCallback(
    (ruta: string): unknown => {
      const partes = ruta.split(".");
      const guardado = partes.reduce<unknown>((a, k) => (esObjeto(a) ? a[k] : undefined), configuracion);
      if (guardado !== undefined) return guardado;
      let nodo: unknown = (jsonSchema?.definitions as Record<string, unknown> | undefined)?.ClientConfig;
      for (const p of partes) nodo = esObjeto(nodo) && esObjeto(nodo.properties) ? nodo.properties[p] : undefined;
      return esObjeto(nodo) ? nodo.default : undefined;
    },
    [configuracion, jsonSchema]
  );

  const uiSchema = useMemo(
    () => (esquemaModulo ? construirUiSchema(esquemaModulo, resolverReferencia) : {}),
    [esquemaModulo, resolverReferencia]
  );

  const recuento = useMemo(
    () => (esquemaModulo && moduloActivo ? contarCampos(esquemaModulo, leerValorEnRuta(configuracion, moduloActivo)) : null),
    [esquemaModulo, moduloActivo, configuracion]
  );

  // lo que necesitan las plantillas para distinguir un valor que este
  // cliente guardo de uno que solo se ve porque es el valor original --
  // se les pasa ya el trozo guardado de este modulo, asi que las rutas de
  // los campos cuelgan directamente de ahi y rutaModulo va vacia
  // los valores de referencia vienen con la ruta completa como clave
  // ("panel.totalScansCard.width"), y las rutas que da el formulario son
  // relativas al modulo, asi que se le pasa la ruta del modulo para que
  // pueda reconstruir la clave
  const contexto: ContextoConfig | undefined = moduloActivo
    ? {
        rutaModulo: moduloActivo.rutaSchema,
        configuracionGuardada: leerValorEnRuta(configuracion, moduloActivo),
        valoresDeReferencia,
        resolverReferencia,
        marcarRestaurado: (ruta: string) => setRestaurados((antes) => new Set(antes).add(ruta)),
      }
    : undefined;

  if (cargando) {
    return <p>cargando configuracion...</p>;
  }

  if (!jsonSchema) {
    return <p>no se pudo cargar el schema de configuracion</p>;
  }

  return (
    <div className="config-disposicion" data-modo={modo}>
      {/* menu lateral: categorias, cada una con sus modulos debajo */}
      <nav className="config-menu">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="config-categoria">
            <p className="config-categoria-nombre">{categoria.nombre}</p>
            <ul className="config-modulos">
              {categoria.modulos.map((modulo) => (
                <li key={modulo.id}>
                  <button
                    type="button"
                    className={`config-modulo ${moduloActivo?.id === modulo.id ? "config-modulo-activo" : ""}`}
                    onClick={() => {
                      setModuloActivo(modulo);
                      setDatosEnEdicion(leerValorEnRuta(configuracion, modulo));
                      setRestaurados(new Set());
                      setMensaje(null);
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
      <div className="config-formulario">
        {!moduloActivo && <p className="config-vacio">elige una seccion del menu para empezar</p>}

        {moduloActivo && esquemaModulo && (
          <div>
            <div className="config-cabecera">
              <h3 className="config-titulo">{moduloActivo.nombre}</h3>
              <span className="config-ruta">{moduloActivo.rutaSchema.join(" › ")}</span>
            </div>
            {recuento && (
              <p className="config-recuento">
                {recuento.total} campos, {recuento.guardados}{" "}
                {recuento.guardados === 1 ? "lo tiene guardado" : "los tiene guardados"} este cliente
              </p>
            )}
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
              schema={esquemaModulo}
              uiSchema={uiSchema}
              validator={validator}
              formData={datosEnEdicion}
              onChange={({ formData }) => setDatosEnEdicion(formData)}
              disabled={guardando}
              templates={{
                FieldTemplate: PlantillaCampo,
                ObjectFieldTemplate: PlantillaObjeto,
                ArrayFieldTemplate: PlantillaLista,
                ArrayFieldItemTemplate: PlantillaElementoLista,
              }}
              formContext={contexto}
            >
              <div />
            </Form>
            <div className="config-acciones">
              <button type="button" className="config-guardar" onClick={guardarModulo} disabled={guardando}>
                {guardando ? "guardando..." : "guardar cambios"}
              </button>
              {mensaje && (
                <span className={mensaje.startsWith("error") ? "config-mensaje-error" : "config-mensaje-ok"}>
                  {mensaje}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
