// casilla que vacia sigue a otro campo, como desplegable de si y no: vacia enseña lo que se aplica (options.aplicado), como
// los demas campos que siguen a otro, y no una casilla desmarcada que pareceria un no

import type { WidgetProps } from "@rjsf/utils";

export default function SelectSiNo({ id, value, disabled, readonly, onChange, options }: WidgetProps) {
  const aplicado = typeof options.aplicado === "string" ? options.aplicado : "";
  return (
    <select
      id={id}
      className="form-control"
      value={value === true ? "si" : value === false ? "no" : ""}
      disabled={disabled || readonly}
      onChange={(e) => onChange(e.target.value === "si" ? true : e.target.value === "no" ? false : undefined)}
    >
      <option value="">{aplicado}</option>
      <option value="si">si</option>
      <option value="no">no</option>
    </select>
  );
}
