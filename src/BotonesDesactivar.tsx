// usuarios del panel y de mantenimiento: su DELETE no borra, los desactiva (se vuelven a activar en su ficha), asi que
// el boton, la pregunta y el aviso dicen desactivar; los dos esperan al servidor y preguntan antes

import { BulkDeleteButton, DeleteButton, SaveButton, Toolbar } from "react-admin";

// user-x de lucide, dibujado como los iconos de la barra
const IconoDesactivar = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m17 8 5 5" />
    <path d="m22 8-5 5" />
  </svg>
);

export const DesactivarEnBloque = () => (
  <BulkDeleteButton
    mutationMode="pessimistic"
    label="desactivar.boton"
    icon={<IconoDesactivar />}
    confirmTitle="desactivar.titulo_bloque"
    confirmContent="desactivar.contenido_bloque"
    successMessage="desactivar.hecho"
  />
);

// barra de la ficha: guardar a la izquierda y desactivar a la derecha, como la de serie
export const BarraFichaUsuario = () => (
  <Toolbar sx={{ justifyContent: "space-between" }}>
    <SaveButton />
    <DeleteButton
      mutationMode="pessimistic"
      label="desactivar.boton"
      icon={<IconoDesactivar />}
      confirmTitle="desactivar.titulo"
      confirmContent="desactivar.contenido"
      successMessage="desactivar.hecho"
    />
  </Toolbar>
);
