// pestaña de configuracion de un cliente: menu de categorias y modulos y un formulario por modulo, generado
// del schema de zod que manda el backend (/config-schema), cada modulo se guarda por separado

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { URL_BASE } from "../providers/urlBase";

interface Props {
  clienteId: string | number;
}

// el valor guardado en la ruta del modulo (vacio si algun tramo no existe) y, si el modulo tiene campos, solo esos:
// tiene que coincidir con extraerSchemaModulo.ts o el formulario recibe datos que su schema no declara
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

// cuantos campos del modulo tiene guardados el cliente y cuantos hay, para ver de un vistazo cuanto esta personalizado
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

// pone el valor en la ruta sobre una copia, sumandolo a lo que habia: varios modulos comparten ruta y se distinguen
// por sus campos, sustituir borraria los demas en pantalla
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

// dice por que ha fallado el guardado, la sesion caducada y un campo mal puesto se arreglan distinto, y el panel y
// la aplicacion comparten la cookie de localhost, asi que entrar en una cierra la otra (un 403 con los datos bien)
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

export default function ConfiguracionPanel({ clienteId }: Props) {
  const [categorias, setCategorias] = useState<CategoriaPanel[]>([]);
  const [jsonSchema, setJsonSchema] = useState<Record<string, unknown> | null>(null);
  const [valoresDeReferencia, setValoresDeReferencia] = useState<Record<string, unknown>>({});
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [moduloActivo, setModuloActivo] = useState<ModuloPanel | null>(null);
  // en pantalla estrecha el formulario va debajo del menu: al elegir un
  // modulo se baja hasta el (el mismo ancho que la regla de index.css)
  const refFormulario = useRef<HTMLDivElement>(null);
  // la categoria desplegada del menu, solo una a la vez para que no crezca, al entrar estan todas cerradas
  const [categoriaAbierta, setCategoriaAbierta] = useState<string | null>(null);
  // valores del formulario mientras se editan, aparte de configuracion (lo guardado), se actualizan en cada onChange
  const [datosEnEdicion, setDatosEnEdicion] = useState<Record<string, unknown>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  // el aviso junto al boton de guardar, en rojo si no se ha guardado
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
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

    // solo lo cambiado, el formulario trae rellenos los campos con valor por defecto (soloLoCambiado.ts)
    const { valor: aGuardar, borrar } = soloLoCambiado(
      datosEnEdicion,
      leerValorEnRuta(configuracion, moduloActivo),
      esquemaModulo,
      restaurados
    );

    if (Object.keys(aGuardar).length === 0 && borrar.length === 0) {
      setMensaje({ texto: "no hay nada que guardar, este apartado esta como estaba", error: false });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    // con la ruta completa del modulo el backend pone el valor en ese punto sin tocar el resto
    const respuesta = await fetch(`${URL_BASE}/clientes/${clienteId}/configuracion`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ruta: moduloActivo.rutaSchema, valor: aGuardar, borrar }),
    });

    setGuardando(false);

    if (!respuesta.ok) {
      setMensaje({ texto: await explicarFallo(respuesta), error: true });
      return;
    }

    // refleja el cambio en el estado local, para que si se vuelve a este
    // mismo modulo sin recargar la pagina, se vean los valores guardados
    setConfiguracion((actual) =>
      quitarEnRuta(establecerValorEnRuta(actual, moduloActivo.rutaSchema, aGuardar), moduloActivo.rutaSchema, borrar)
    );
    setRestaurados(new Set());
    setMensaje({ texto: "guardado correctamente", error: false });
  }

  // el schema del modulo y su recuento se calculan una vez por modulo y no en cada tecla, con el valor de referencia
  // de los widgets ya puesto como valor por defecto
  const esquemaModulo = useMemo(
    () =>
      jsonSchema && moduloActivo && !moduloActivo.aviso
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

  // lo que necesitan las plantillas para distinguir lo guardado de lo que solo se ve por ser el original: el trozo
  // guardado del modulo y su ruta, para rehacer la clave completa de los valores de referencia
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
      {/* menu lateral: categorias desplegables, cada una con sus modulos
          debajo. la del modulo que se edita queda marcada aunque se cierre */}
      <nav className="config-menu">
        {categorias.map((categoria) => {
          const abierta = categoriaAbierta === categoria.id;
          const actual = categoria.modulos.some((modulo) => modulo.id === moduloActivo?.id);
          return (
            <div key={categoria.id} className="config-categoria">
              <button
                type="button"
                className={`config-categoria-nombre ${actual ? "config-categoria-actual" : ""}`}
                aria-expanded={abierta}
                onClick={() => setCategoriaAbierta(abierta ? null : categoria.id)}
              >
                <span>{categoria.nombre} ({categoria.modulos.length})</span>
                <span className="config-categoria-icono" aria-hidden="true">{abierta ? "−" : "+"}</span>
              </button>
              {abierta && (
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
                          if (window.matchMedia("(max-width: 899px)").matches) {
                            requestAnimationFrame(() => refFormulario.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                          }
                        }}
                      >
                        {modulo.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* formulario del modulo seleccionado */}
      <div className="config-formulario" ref={refFormulario}>
        {!moduloActivo && <p className="config-vacio">elige una seccion del menu para empezar</p>}

        {moduloActivo?.aviso && (
          <div>
            <div className="config-cabecera">
              <h3 className="config-titulo">{moduloActivo.nombre}</h3>
            </div>
            <p className="config-aviso">{moduloActivo.aviso}</p>
          </div>
        )}

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
            {/* tagName div: react-admin ya envuelve la pestaña en su <form> y no se pueden anidar, y onChange en vez de onSubmit
            porque un boton de enviar aqui dispararia el form de react-admin, el guardado va con el boton de abajo */}
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
                <span className={mensaje.error ? "config-mensaje-error" : "config-mensaje-ok"}>
                  {mensaje.texto}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
