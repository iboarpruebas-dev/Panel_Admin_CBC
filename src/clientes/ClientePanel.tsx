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
} from "react-admin";
import ConfiguracionPanel from "../configuracion/ConfiguracionPanel";

// las 3 pantallas de gestion de clientes: listado, edicion, creacion
// el borrado (boton "eliminar" de la lista) nunca borra de verdad, el
// backend lo convierte en activo=false

export const ClienteList = () => (
  <List>
    <Datagrid rowClick="edit">
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

export const ClienteEdit = () => (
  <Edit>
    <TabbedForm>
      <TabbedForm.Tab label="Datos generales">
        <TextField source="id" />
        <TextInput source="nombre_cliente" label="Nombre" validate={required()} />
        <BooleanInput source="activo" />
      </TabbedForm.Tab>
      {/* esta pestaña no usa los campos normales del formulario, guarda
      directamente contra /clientes/:id/configuracion desde dentro de
      ConfiguracionPanel, con su propio boton de guardar por modulo */}
      <TabbedForm.Tab label="Configuracion">
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
