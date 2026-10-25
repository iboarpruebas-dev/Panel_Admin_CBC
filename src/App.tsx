// panel de administracion (react-admin) con las pantallas de clientes, usuarios y usuarios de la pagina de mantenimiento,
// solo para el superadmin

import { Admin, Resource } from "react-admin";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { i18nProvider } from "./providers/i18nProvider";
import Entrada from "./Entrada";
import { DisposicionPanel } from "./BarraPanel";
import { ClienteList, ClienteEdit, ClienteCreate } from "./clientes/ClientePanel";
import { UserList, UserEdit, UserCreate } from "./users/UserPanel";
import {
  UsuarioMantenimientoList,
  UsuarioMantenimientoEdit,
  UsuarioMantenimientoCreate,
} from "./usuariosMantenimiento/UsuarioMantenimientoPanel";

export default function App() {
  return (
    // disableTelemetry: sin el aviso a los servidores de react-admin al abrir el panel
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      i18nProvider={i18nProvider}
      loginPage={Entrada}
      layout={DisposicionPanel}
      title="Panel CBC"
      disableTelemetry
    >
      <Resource
        name="clientes"
        list={ClienteList}
        edit={ClienteEdit}
        create={ClienteCreate}
        recordRepresentation="nombre_cliente"
      />
      <Resource
        name="users"
        list={UserList}
        edit={UserEdit}
        create={UserCreate}
        recordRepresentation="nombre"
      />
      <Resource
        name="usuarios-mantenimiento"
        list={UsuarioMantenimientoList}
        edit={UsuarioMantenimientoEdit}
        create={UsuarioMantenimientoCreate}
        options={{ label: "Usuarios de mantenimiento" }}
        recordRepresentation="nombre"
      />
    </Admin>
  );
}
