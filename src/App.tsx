// panel de administracion (react-admin) con las pantallas de clientes y usuarios, solo para el superadmin

import { Admin, Resource } from "react-admin";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { ClienteList, ClienteEdit, ClienteCreate } from "./clientes/ClientePanel";
import { UserList, UserEdit, UserCreate } from "./users/UserPanel";

export default function App() {
  return (
    <Admin authProvider={authProvider} dataProvider={dataProvider} title="Panel CBC">
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
    </Admin>
  );
}
