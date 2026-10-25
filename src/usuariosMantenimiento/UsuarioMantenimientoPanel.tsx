// pantallas de los usuarios de la pagina de mantenimiento: listado, edicion y alta, eliminar desactiva (activo=false)
// solo entran en /mantenimiento y ven todos los clientes

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  PasswordInput,
  BooleanInput,
  BulkDeleteButton,
  required,
} from "react-admin";

export const UsuarioMantenimientoList = () => (
  <List>
    {/* desactivar en bloque pregunta antes y espera a que el servidor conteste */}
    <Datagrid rowClick="edit" bulkActionButtons={<BulkDeleteButton mutationMode="pessimistic" />}>
      <TextField source="id" />
      <TextField source="nombre" />
      <BooleanField source="activo" />
    </Datagrid>
  </List>
);

// guardar y desactivar esperan a que el servidor conteste, si da error se queda en la ficha con lo escrito
export const UsuarioMantenimientoEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextField source="id" />
      <TextInput source="nombre" validate={required()} />
      {/* en blanco no se toca la contraseña actual, solo cambia si se escribe una nueva */}
      <PasswordInput
        source="clave"
        label="Nueva contraseña (dejar en blanco para no cambiarla)"
      />
      <BooleanInput source="activo" />
    </SimpleForm>
  </Edit>
);

export const UsuarioMantenimientoCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="nombre" validate={required()} />
      <PasswordInput source="clave" validate={required()} />
    </SimpleForm>
  </Create>
);
