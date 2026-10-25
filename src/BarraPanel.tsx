// barra de arriba del panel: el titulo y, como en la web, el modo claro u oscuro (sol en modo oscuro, luna en el claro) y
// salir, sin el boton de actualizar ni el menu de perfil; los iconos son los trazos de lucide, los mismos de la web

import { AppBar, IconButtonWithTooltip, Layout, useLogout, useTheme, type LayoutProps } from "react-admin";

const comun = {
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
} as const;

const IconoSol = () => (
  <svg {...comun}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const IconoLuna = () => (
  <svg {...comun}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const IconoSalir = () => (
  <svg {...comun}>
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </svg>
);

function BotonesBarra() {
  const [modo, setModo] = useTheme();
  const salir = useLogout();
  const oscuro = modo === "dark";
  return (
    <>
      <IconButtonWithTooltip label={oscuro ? "Modo claro" : "Modo oscuro"} color="inherit" onClick={() => setModo(oscuro ? "light" : "dark")}>
        {oscuro ? <IconoSol /> : <IconoLuna />}
      </IconButtonWithTooltip>
      <IconButtonWithTooltip label="Cerrar sesión" color="inherit" onClick={() => salir()}>
        <IconoSalir />
      </IconButtonWithTooltip>
    </>
  );
}

const Barra = () => <AppBar toolbar={<BotonesBarra />} userMenu={false} />;

export const DisposicionPanel = (props: LayoutProps) => <Layout {...props} appBar={Barra} />;
