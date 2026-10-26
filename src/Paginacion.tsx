// paginacion de las listas: con la pantalla estrecha react-admin no traduce las flechas de pagina anterior y siguiente
// (salen en ingles), se les ponen los mismos textos que usa con la pantalla ancha

import { Pagination, useTranslate } from "react-admin";

export const Paginacion = () => {
  const translate = useTranslate();
  const flecha = (tipo: string) => ({ "aria-label": translate(`ra.navigation.${tipo}`), title: translate(`ra.navigation.${tipo}`) });
  return (
    <Pagination
      slotProps={{
        actions: { firstButton: flecha("first"), previousButton: flecha("previous"), nextButton: flecha("next"), lastButton: flecha("last") },
      }}
    />
  );
};
