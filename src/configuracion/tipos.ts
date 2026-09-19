// mismos tipos que panelNavegacion.ts en el backend, para que el
// frontend sepa que forma tiene lo que le llega de /config-schema

export interface ModuloPanel {
  id: string;
  nombre: string;
  rutaSchema: string[];
  campos?: string[];
}

export interface CategoriaPanel {
  id: string;
  nombre: string;
  modulos: ModuloPanel[];
}

export interface RespuestaConfigSchema {
  jsonSchema: Record<string, unknown>;
  categorias: CategoriaPanel[];
}
