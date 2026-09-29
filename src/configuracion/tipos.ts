// mismos tipos que panelNavegacion.ts en el backend, para que el
// frontend sepa que forma tiene lo que le llega de /config-schema

export interface ModuloPanel {
  id: string;
  nombre: string;
  rutaSchema: string[];
  campos?: string[];
  // un modulo que no edita nada y solo explica algo que no se configura
  // por cliente: se enseña el texto en vez del formulario
  aviso?: string;
}

export interface CategoriaPanel {
  id: string;
  nombre: string;
  modulos: ModuloPanel[];
}

export interface RespuestaConfigSchema {
  jsonSchema: Record<string, unknown>;
  categorias: CategoriaPanel[];
  // el valor que usa la aplicacion en los campos que el schema deja
  // opcionales a proposito (los widgets del panel principal), con la
  // ruta completa como clave: "panel.totalScansCard.width"
  valoresDeReferencia?: Record<string, unknown>;
}
