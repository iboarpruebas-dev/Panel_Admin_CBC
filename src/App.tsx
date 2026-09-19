import { Admin, Resource } from "react-admin";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { ClienteList, ClienteEdit, ClienteCreate } from "./clientes/ClientePanel";
import { UserList, UserEdit, UserCreate } from "./users/UserPanel";

// punto de entrada del panel, solo clientes y usuarios por ahora, las
// pantallas de aerolineas y permisos quedan pendientes de confirmar con
// gilberto antes de construirlas

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
