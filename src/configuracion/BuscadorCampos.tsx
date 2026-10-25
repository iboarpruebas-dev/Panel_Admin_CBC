// caja de busqueda encima del menu de la configuracion: desde 2 letras busca en el nombre de cada campo, su
// descripcion, su modulo y su seccion, y al pulsar un resultado se abre su modulo y se baja hasta el campo

import { useMemo, useState } from "react";
import type { CategoriaPanel } from "./tipos";
import { buscar, construirIndice, palabrasDe, trozosResaltados, type ResultadoBusqueda } from "./indiceDeCampos";

// mas se pide escribir algo mas concreto
const MAXIMO_RESULTADOS = 50;

interface Props {
  jsonSchema: Record<string, unknown>;
  categorias: CategoriaPanel[];
  configuracion: Record<string, unknown>;
  consulta: string;
  alCambiar: (consulta: string) => void;
  alElegir: (resultado: ResultadoBusqueda) => void;
}

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

function estaGuardado(configuracion: Record<string, unknown>, ruta: string[]): boolean {
  return ruta.reduce<unknown>((nivel, clave) => (esObjeto(nivel) ? nivel[clave] : undefined), configuracion) !== undefined;
}

function Resaltado({ texto, palabras }: { texto: string; palabras: string[] }) {
  return (
    <>
      {trozosResaltados(texto, palabras).map((t, i) => (t.marcado ? <mark key={i}>{t.texto}</mark> : <span key={i}>{t.texto}</span>))}
    </>
  );
}

export default function BuscadorCampos({ jsonSchema, categorias, configuracion, consulta, alCambiar, alElegir }: Props) {
  const palabras = palabrasDe(consulta);
  const buscando = palabras.join("").length >= 2;

  // el indice se hace la primera vez que se escribe y sirve mientras no cambie el schema
  const [pedido, setPedido] = useState(false);
  const indice = useMemo(() => (pedido ? construirIndice(jsonSchema, categorias) : []), [pedido, jsonSchema, categorias]);
  const resultados = useMemo(() => (buscando ? buscar(indice, categorias, consulta) : []), [buscando, indice, categorias, consulta]);

  return (
    <div className="buscador">
      <input
        type="search"
        className="buscador-caja"
        placeholder="Buscar un campo"
        aria-label="Buscar un campo"
        value={consulta}
        onChange={(e) => {
          setPedido(true);
          alCambiar(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") alCambiar("");
          // enter abriria el form de react-admin que envuelve la pestaña
          if (e.key === "Enter") {
            e.preventDefault();
            if (resultados[0]) alElegir(resultados[0]);
          }
        }}
      />
      {buscando && (
        <div className="buscador-resultados">
          <p className="buscador-cuenta">
            {resultados.length === 0
              ? "ningun campo con eso"
              : `${resultados.length} ${resultados.length === 1 ? "resultado" : "resultados"}`}
          </p>
          <ul>
            {resultados.slice(0, MAXIMO_RESULTADOS).map(({ categoria, modulo, campo }) => {
              const guardado = campo && estaGuardado(configuracion, [...modulo.rutaSchema, ...campo.ruta]);
              return (
                <li key={`${modulo.id}:${campo?.ruta.join(".") ?? ""}`}>
                  <button type="button" className="buscador-resultado" onClick={() => alElegir({ categoria, modulo, campo })}>
                    <span className="buscador-donde">
                      <Resaltado texto={`${categoria.nombre} › ${modulo.nombre}`} palabras={palabras} />
                    </span>
                    <span className="buscador-campo">
                      {campo ? <Resaltado texto={campo.ruta.join(" › ")} palabras={palabras} /> : "abrir el modulo"}
                      {guardado && <span className="campo-marca">guardado</span>}
                    </span>
                    {campo?.descripcion && (
                      <span className="buscador-descripcion">
                        <Resaltado texto={campo.descripcion} palabras={palabras} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {resultados.length > MAXIMO_RESULTADOS && (
            <p className="buscador-cuenta">y {resultados.length - MAXIMO_RESULTADOS} mas, escribe algo mas concreto</p>
          )}
        </div>
      )}
    </div>
  );
}
