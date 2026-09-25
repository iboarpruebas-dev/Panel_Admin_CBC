import { useState } from "react";
import type {
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
} from "@rjsf/utils";
import { leerVacio } from "./leerVacio";

// plantillas de dibujado del formulario de configuracion
//
// el formulario que sale de react-jsonschema-form sin tocar nada no sirve
// para este trabajo: pone la etiqueta, el texto de ayuda y la casilla uno
// debajo de otro sin jerarquia, y sobre todo no enseña por ningun lado
// cual era el valor original del campo
//
// eso ultimo es lo importante: quien entra aqui cambia un valor, y si
// luego se arrepiente tiene que poder dejarlo como estaba sin ir a buscar
// el codigo. el valor original viaja en el propio schema, en la propiedad
// "default", asi que se lee de ahi y se enseña siempre, al lado del campo
// -- no se depende de que el texto de ayuda lo mencione

// el mismo formato que usa el backend al escribir los textos de ayuda,
// para que un campo diga lo mismo en los dos sitios
function formatearValor(valor: unknown): string {
  if (valor === null || valor === "") return "vacio";
  if (typeof valor === "boolean") return valor ? "si" : "no";
  if (typeof valor === "number" || typeof valor === "string") return String(valor);
  if (Array.isArray(valor)) return valor.length === 0 ? "lista vacia" : valor.map(formatearValor).join(", ");
  return JSON.stringify(valor);
}

function sonIguales(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

// lo que el panel le pasa a las plantillas para que puedan distinguir un
// valor que este cliente guardo de uno que solo esta puesto porque es el
// valor por defecto -- son indistinguibles mirando el formulario, los dos
// salen escritos en la casilla
export interface ContextoConfig {
  // ruta del modulo dentro de la configuracion completa, solo para
  // reconstruir la clave de los valores de referencia -- lo que hay en
  // configuracionGuardada ya es el trozo de este modulo, asi que para
  // mirar ahi no hace falta
  rutaModulo: string[];
  configuracionGuardada: Record<string, unknown>;
  // valor que usa la aplicacion en los campos que el schema deja
  // opcionales a proposito, indexado por su ruta completa
  valoresDeReferencia: Record<string, unknown>;
  // valor que tiene ahora otro campo de la configuracion de este cliente,
  // el guardado o si no su valor por defecto: lo usan los campos que
  // vacios siguen a otro, como un color que sigue a un gris del tema
  resolverReferencia: (ruta: string) => unknown;
  // apunta que un campo se ha devuelto al original con el boton, para que
  // al guardar se quite en vez de escribir encima su valor de hoy
  marcarRestaurado: (ruta: string) => void;
}

// mira si este cliente tiene guardado algo en esa ruta exacta, la
// ausencia es lo normal: una configuracion escueta es una configuracion
// que se conforma con los valores por defecto
function estaGuardado(contexto: ContextoConfig | undefined, rutaCampo: (string | number)[]): boolean {
  if (!contexto) return false;
  let actual: unknown = contexto.configuracionGuardada;
  for (const tramo of rutaCampo) {
    if (actual === null || typeof actual !== "object") return false;
    actual = (actual as Record<string, unknown>)[String(tramo)];
    if (actual === undefined) return false;
  }
  return true;
}

export function PlantillaCampo(props: FieldTemplateProps) {
  const { id, label, description, children, errors, help, hidden, required, schema, displayLabel, formData, onChange, fieldPathId, registry } = props;
  // la casilla numerica recuerda lo que se escribio y, si es el original
  // con ceros detras (100 con original 1), lo sigue mostrando, asi que al
  // volver al original se dibuja la casilla de nuevo
  const [vueltas, setVueltas] = useState(0);

  if (hidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  // un objeto anidado no es un campo, es un grupo: lo dibuja
  // PlantillaObjeto, aqui solo se deja pasar para no meterle una
  // etiqueta y un pie que no le corresponden
  if (schema.type === "object") {
    return <div className="campo-grupo">{children}</div>;
  }

  // cada elemento de una lista (cada numero de pageSizeOptions) no es un
  // campo suelto: el nombre, el valor original y el boton de volver son
  // de la lista entera, asi que aqui solo va su casilla
  if (typeof fieldPathId.path[fieldPathId.path.length - 1] === "number") {
    return <div className="lista-casilla">{children}{errors}</div>;
  }

  const contexto = registry.formContext as ContextoConfig | undefined;
  const guardado = estaGuardado(contexto, fieldPathId.path);

  // el valor original sale del schema si lo lleva, y si no, del que usa
  // la aplicacion -- son dos cosas distintas y se dicen distinto: un
  // default del schema es el valor que sale solo cuando el campo falta,
  // y un valor de referencia es el que usa la aplicacion en un campo
  // que hoy no esta declarado, asi que ponerlo es declararlo
  const tieneDefecto = Object.prototype.hasOwnProperty.call(schema, "default");
  const rutaCompleta = [...(contexto?.rutaModulo ?? []), ...fieldPathId.path].join(".");
  const referencia = contexto?.valoresDeReferencia?.[rutaCompleta];
  const tieneReferencia = !tieneDefecto && referencia !== undefined;

  const valorDefecto = tieneDefecto ? (schema as { default?: unknown }).default : referencia;
  const hayOriginal = tieneDefecto || tieneReferencia;
  const cambiado = hayOriginal && !sonIguales(formData, valorDefecto);

  // un campo sin valor original puede decir en su texto que significa
  // dejarlo vacio; si apunta a otro campo, se ensena lo que vale ese
  const vacio = hayOriginal ? null : leerVacio(schema.description);
  const valorVacio = vacio?.referencia
    ? formatearValor(contexto?.resolverReferencia(vacio.referencia))
    : vacio?.valor;
  const tieneValorPropio = formData !== undefined && formData !== null && formData !== "";

  return (
    <div className={`campo ${cambiado ? "campo-cambiado" : ""}`}>
      {(displayLabel || schema.type === "boolean" || schema.type === "array") && label && (
        <label className="campo-etiqueta" htmlFor={id}>
          {label}
          {required && <span className="campo-obligatorio"> *</span>}
          {guardado && <span className="campo-marca">guardado por este cliente</span>}
        </label>
      )}

      {description && <div className="campo-ayuda">{description}</div>}

      <div className="campo-control" key={vueltas}>{children}</div>

      <div className="campo-pie">
        {hayOriginal ? (
          <>
            <span className="campo-defecto">
              {tieneDefecto ? "valor original: " : "valor que usa la aplicacion: "}
              <code>{formatearValor(valorDefecto)}</code>
            </span>
            <button
              type="button"
              className="campo-volver"
              disabled={tieneDefecto ? !cambiado && !guardado : !cambiado}
              onClick={() => {
                if (tieneDefecto) contexto?.marcarRestaurado(fieldPathId.path.join("."));
                onChange(valorDefecto, fieldPathId.path);
                setVueltas((n) => n + 1);
              }}
              title={
                tieneDefecto
                  ? "quita lo que se haya puesto aqui y deja el valor original"
                  : !cambiado
                    ? "este campo ya tiene ese valor"
                    : "escribe aqui el valor que la aplicacion usa hoy"
              }
            >
              {tieneDefecto ? "volver al original" : "poner ese valor"}
            </button>
          </>
        ) : vacio ? (
          <>
            <span className="campo-defecto">
              valor original: <code>{valorVacio}</code>
              {vacio.explicacion && <> — {vacio.explicacion}</>}
            </span>
            <button
              type="button"
              className="campo-volver"
              disabled={!tieneValorPropio}
              onClick={() => {
                contexto?.marcarRestaurado(fieldPathId.path.join("."));
                onChange(undefined, fieldPathId.path);
                setVueltas((n) => n + 1);
              }}
              title={tieneValorPropio ? "quita lo que se haya puesto aqui y deja el valor original" : "este campo ya tiene su valor original"}
            >
              volver al original
            </button>
          </>
        ) : (
          <span className="campo-defecto campo-sin-defecto">
            sin valor original, se puede dejar vacio
          </span>
        )}
      </div>

      {errors}
      {help}
    </div>
  );
}

// un objeto dentro del formulario (ej. serviceLogo dentro de la barra
// superior) se dibuja como un bloque con su titulo, para que se vea donde
// empieza y donde acaba en vez de quedar sus campos mezclados con los del
// nivel de arriba
export function PlantillaObjeto(props: ObjectFieldTemplateProps) {
  const { title, description, properties, fieldPathId } = props;
  // el objeto raiz del modulo no lleva titulo: el nombre del modulo ya
  // esta puesto arriba, y repetirlo solo aleja los campos
  const esRaiz = fieldPathId.path.length === 0;

  if (esRaiz) {
    return (
      <div className="grupo-raiz">
        {description}
        {properties.map((propiedad) => (
          <div key={propiedad.name}>{propiedad.content}</div>
        ))}
      </div>
    );
  }

  return (
    <fieldset className="grupo">
      {title && <legend className="grupo-titulo">{title}</legend>}
      {description && <div className="grupo-ayuda">{description}</div>}
      {properties.map((propiedad) => (
        <div key={propiedad.name}>{propiedad.content}</div>
      ))}
    </fieldset>
  );
}

// una lista de valores (como las opciones de filas por pagina): el nombre,
// la ayuda y el valor original ya los pone PlantillaCampo alrededor, asi
// que aqui solo van sus elementos, uno por linea, y el boton de añadir
export function PlantillaLista(props: ArrayFieldTemplateProps) {
  const { items, canAdd, onAddClick, disabled, readonly, fieldPathId } = props;
  return (
    <div className="lista" id={fieldPathId.$id}>
      {items}
      {canAdd && (
        <button type="button" className="lista-boton" onClick={onAddClick} disabled={disabled || readonly}>
          + añadir
        </button>
      )}
    </div>
  );
}

// un elemento de la lista: su casilla y, al lado, subir, bajar y quitar
export function PlantillaElementoLista(props: ArrayFieldItemTemplateProps) {
  const { children, hasToolbar, buttonsProps } = props;
  const { hasMoveUp, hasMoveDown, hasRemove, onMoveUpItem, onMoveDownItem, onRemoveItem } = buttonsProps;
  const bloqueado = buttonsProps.disabled || buttonsProps.readonly;
  return (
    <div className="lista-elemento">
      {children}
      {hasToolbar && (
        <div className="lista-botones">
          {(hasMoveUp || hasMoveDown) && (
            <>
              <button type="button" className="lista-boton" title="subir" onClick={onMoveUpItem} disabled={bloqueado || !hasMoveUp}>↑</button>
              <button type="button" className="lista-boton" title="bajar" onClick={onMoveDownItem} disabled={bloqueado || !hasMoveDown}>↓</button>
            </>
          )}
          {hasRemove && (
            <button type="button" className="lista-boton" title="quitar" onClick={onRemoveItem} disabled={bloqueado}>✕</button>
          )}
        </div>
      )}
    </div>
  );
}
