// pantallas de usuarios del panel: listado, edicion y alta, borrar desde el panel solo desactiva

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  SelectField,
  ReferenceField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  PasswordInput,
  SelectInput,
  BooleanInput,
  ReferenceInput,
  AutocompleteInput,
  BulkDeleteButton,
  required,
} from "react-admin";

const opcionesRol = [
  { id: "superadmin", name: "Superadmin" },
  { id: "admin", name: "Admin" },
];

export const UserList = () => (
  <List>
    {/* desactivar en bloque pregunta antes y espera a que el servidor conteste, como el boton de la ficha */}
    <Datagrid rowClick="edit" bulkActionButtons={<BulkDeleteButton mutationMode="pessimistic" />}>
      <TextField source="id" />
      <TextField source="nombre" />
      <SelectField source="rol" choices={opcionesRol} />
      <ReferenceField source="id_cliente" reference="clientes" label="Cliente" emptyText="(sin cliente)" />
      <BooleanField source="activo" />
    </Datagrid>
  </List>
);

// guardar y desactivar esperan a que el servidor conteste, si da error se queda en la ficha con lo escrito
export const UserEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextField source="id" />
      <TextInput source="nombre" validate={required()} />
      {/* si se deja en blanco, el backend no toca la contraseña actual,
      solo la cambia si aqui se escribe una nueva */}
      <PasswordInput
        source="clave"
        label="Nueva contraseña (dejar en blanco para no cambiarla)"
      />
      <SelectInput source="rol" choices={opcionesRol} validate={required()} />
      <ReferenceInput source="id_cliente" reference="clientes">
        <AutocompleteInput label="Cliente" optionText="nombre_cliente" />
      </ReferenceInput>
      <BooleanInput source="activo" />
    </SimpleForm>
  </Edit>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="nombre" validate={required()} />
      <PasswordInput source="clave" validate={required()} />
      <SelectInput source="rol" choices={opcionesRol} defaultValue="admin" validate={required()} />
      <ReferenceInput source="id_cliente" reference="clientes">
        <AutocompleteInput label="Cliente" optionText="nombre_cliente" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);
