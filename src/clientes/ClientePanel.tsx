// pantallas de clientes del panel: listado, edicion (datos generales y configuracion) y alta

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TabbedForm,
  TextInput,
  BooleanInput,
  required,
  useRecordContext,
  Toolbar,
  SaveButton,
  useLocation,
} from "react-admin";
import ConfiguracionPanel from "../configuracion/ConfiguracionPanel";
import EliminarClienteDefinitivo from "./EliminarClienteDefinitivo";

// desactivar un cliente es el switch activo de la edicion, eliminar (en la barra de la edicion) lo borra
// de verdad con sus usuarios y sus informes

export const ClienteList = () => (
  <List>
    {/* sin casillas ni borrado en bloque: solo se elimina desde la ficha,
    con su aviso y la contraseña */}
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="nombre_cliente" label="Nombre" />
      <BooleanField source="activo" />
    </Datagrid>
  </List>
);

// muestra ConfiguracionPanel una vez que react-admin ya cargo el
// registro del cliente (necesita su id, que no esta disponible antes)
const PestanaConfiguracion = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <ConfiguracionPanel clienteId={record.id} />;
};

// guardar y eliminar son de los datos generales, en la pestaña de configuracion cada modulo tiene su guardar
const BarraEdicion = () => {
  const { pathname } = useLocation();
  if (pathname.endsWith("/configuracion")) return null;
  return (
    <Toolbar sx={{ justifyContent: "space-between" }}>
      <SaveButton icon={null} />
      <EliminarClienteDefinitivo />
    </Toolbar>
  );
};

export const ClienteEdit = () => (
  <Edit>
    <TabbedForm toolbar={<BarraEdicion />}>
      <TabbedForm.Tab label="Datos generales">
        <TextField source="id" />
        <TextInput source="nombre_cliente" label="Nombre" validate={required()} />
        <BooleanInput source="activo" />
      </TabbedForm.Tab>
      {/* esta pestaña no usa los campos del formulario: ConfiguracionPanel guarda cada modulo contra
      /clientes/:id/configuracion con su propio boton */}
      <TabbedForm.Tab label="Configuracion" path="configuracion">
        <PestanaConfiguracion />
      </TabbedForm.Tab>
    </TabbedForm>
  </Edit>
);

export const ClienteCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="nombre_cliente" label="Nombre" validate={required()} />
    </SimpleForm>
  </Create>
);
