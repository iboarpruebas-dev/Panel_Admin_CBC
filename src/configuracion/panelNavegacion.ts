// copia antigua del mapa del panel (el de verdad lo manda el backend en /config-schema), no la importa nadie

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

// los widgets se reparten siempre en los mismos 7 modulos, en vez de repetir las listas de campos en cada uno
function generarModulosWidget(rutaBase: string[], etiquetaWidget: string, prefijoId: string): ModuloPanel[] {
  return [
    {
      id: `${prefijoId}-tamano`,
      nombre: `${etiquetaWidget}: tamaño y visibilidad`,
      rutaSchema: rutaBase,
      campos: ["visible", "width", "height", "margin", "padding"],
    },
    {
      id: `${prefijoId}-colores`,
      nombre: `${etiquetaWidget}: colores`,
      rutaSchema: rutaBase,
      campos: ["color", "colorSecondary", "backgroundColor", "borderColor", "textColor"],
    },
    {
      id: `${prefijoId}-bordes`,
      nombre: `${etiquetaWidget}: bordes y sombra`,
      rutaSchema: rutaBase,
      campos: ["borderRadius", "boxShadowLevel"],
    },
    {
      id: `${prefijoId}-tipografia`,
      nombre: `${etiquetaWidget}: tipografia y titulo`,
      rutaSchema: rutaBase,
      campos: [
        "fontSize", "valueFontSize", "fontWeight", "fontFamily", "title", "icon",
        "titleAlign", "valueAlign", "titleSpacing",
      ],
    },
    {
      id: `${prefijoId}-comportamiento`,
      nombre: `${etiquetaWidget}: comportamiento`,
      rutaSchema: rutaBase,
      campos: ["hoverEffect", "hoverScale", "transitionDurationMs"],
    },
    {
      id: `${prefijoId}-espaciado`,
      nombre: `${etiquetaWidget}: espaciado, menus y ayudas`,
      rutaSchema: rutaBase,
      campos: [
        "showTooltips", "menuBorderRadius", "menuTooltipBorderRadius",
        "menuTooltipBoxShadowLevel", "destinationMenuMaxHeightVh", "legendFontSize",
        "dataLabelFontSize", "containerPadding", "headerMarginBottom", "titleMarginTop",
        "titleMarginLeft", "titleMarginBottom", "chartWrapperPaddingTop", "loadingMinHeight",
        "dataTooltipBorderRadius", "dataTooltipFontSize", "dataTooltipBoxShadowLevel",
        "filterIconSize", "categories",
      ],
    },
    {
      id: `${prefijoId}-datos-grafico`,
      nombre: `${etiquetaWidget}: datos del grafico`,
      rutaSchema: rutaBase,
      campos: [
        "strokeWidth", "pointSize", "showLegend", "showGrid", "gridStyle", "gridColor",
        "decimalPlaces", "numberSeparator", "axisFontSize", "fillOpacity", "barThickness",
        "barCornerRadius", "pieOuterRadius", "piePaddingAngle", "pieCornerRadius",
        "markerMinSize", "markerMaxSize", "markerStrokeWidth",
      ],
    },
  ];
}

// navegacion y estructura general, navbar y sidebar en varios modulos y el resto en uno cada uno
const categoriaNavegacion: CategoriaPanel = {
  id: "navegacion-estructura",
  nombre: "Navegacion y estructura general",
  modulos: [
    {
      id: "navbar-logo",
      nombre: "Barra superior: logo",
      rutaSchema: ["navbar"],
      campos: [
        "logoUrl", "logoUrlDark", "logoVisible", "logoWidth", "logoHeight",
        "logoMaxWidth", "logoMarginRight", "serviceLogo", "serviceLogoMarginTop",
      ],
    },
    {
      id: "navbar-colores",
      nombre: "Barra superior: colores y sombra",
      rutaSchema: ["navbar"],
      campos: ["height", "backgroundColor", "boxShadowLevel", "iconColor", "iconSize", "hamburgerMarginRight"],
    },
    {
      id: "navbar-botones",
      nombre: "Barra superior: iconos y botones de utilidad",
      rutaSchema: ["navbar"],
      campos: [
        "utilityButtonsGap", "themeToggleMarginLeft", "tooltipBorderRadius",
        "tooltipFontSize", "tooltipBoxShadowLevel", "languageMenuBorderRadius",
        "languageMenuBoxShadowLevel", "languageMenuMarginTop", "languageMenuMinWidth",
        "languageMenuItemBorderRadius", "utilityButtons",
      ],
    },
    {
      id: "sidebar-colores",
      nombre: "Menu lateral: colores",
      rutaSchema: ["sidebar"],
      campos: ["backgroundColor", "activeColor", "inactiveColor", "hoverColor"],
    },
    {
      id: "sidebar-tamanos",
      nombre: "Menu lateral: tamaños y espaciado",
      rutaSchema: ["sidebar"],
      campos: [
        "width", "collapsedWidth", "listMarginTop", "itemPaddingVertical",
        "itemBorderRadiusOpen", "itemTransitionMs", "itemMarginX", "iconBoxMarginRight",
        "iconBoxBorderRadiusOpen", "iconBoxPadding", "collapsedTooltipBorderRadius",
        "collapsedTooltipFontSize", "collapsedTooltipBoxShadowLevel",
      ],
    },
    {
      id: "sidebar-menu-items",
      nombre: "Menu lateral: elementos del menu",
      rutaSchema: ["sidebar"],
      campos: ["menuItems"],
    },
    {
      id: "theme-colores",
      nombre: "Colores base de la app",
      rutaSchema: ["theme"],
    },
    {
      id: "dashboard-layout",
      nombre: "Diseño general de pagina",
      rutaSchema: ["dashboardLayout"],
    },
    {
      id: "scroll-top",
      nombre: "Boton volver arriba",
      rutaSchema: ["scrollToTopButton"],
    },
  ],
};

// panel principal: la cabecera y los 8 widgets
const categoriaDashboard: CategoriaPanel = {
  id: "panel-principal",
  nombre: "Panel principal (Dashboard)",
  modulos: [
    {
      id: "dashboard-cabecera",
      nombre: "Cabecera del panel",
      rutaSchema: ["dashboard", "page"],
    },
    ...generarModulosWidget(["dashboard", "totalScansCard"], "Total Scans", "dash-total-scans"),
    ...generarModulosWidget(["dashboard", "weightCompliancePie"], "Weight Compliance", "dash-weight-compliance"),
    ...generarModulosWidget(["dashboard", "bagTagCompliancePie"], "Bag Tag Compliance", "dash-bagtag-compliance"),
    ...generarModulosWidget(["dashboard", "sizeCompliancePie"], "Size Compliance", "dash-size-compliance"),
    ...generarModulosWidget(["dashboard", "devicePerformance"], "Device Performance", "dash-device-performance"),
    ...generarModulosWidget(["dashboard", "worldMap"], "Mapa mundial", "dash-world-map"),
    ...generarModulosWidget(["dashboard", "baggageTypeBar"], "Tipo de maleta", "dash-baggage-type"),
    ...generarModulosWidget(["dashboard", "passengerFlowTrend"], "Flujo de pasajeros", "dash-passenger-flow"),
  ],
};

export const navegacionPanel: CategoriaPanel[] = [
  {
    id: "reglas-globales",
    nombre: "Reglas globales",
    modulos: [
      {
        id: "reglas-cache",
        nombre: "Actualizacion de cache",
        rutaSchema: ["reglas"],
        // sin campos, enseña todo el apartado reglas
      },
    ],
  },
  categoriaNavegacion,
  categoriaDashboard,
];
