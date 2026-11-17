// pantallas de usuarios del panel: listado, edicion y alta, eliminar desactiva (activo=false); se entra con un codigo que
// llega al correo, sin contraseña

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
  SelectInput,
  BooleanInput,
  ReferenceInput,
  AutocompleteInput,
  required,
  email,
} from "react-admin";
import { BarraFichaUsuario, DesactivarEnBloque } from "../BotonesDesactivar";
import { Paginacion } from "../Paginacion";
import CerrarSesiones from "./CerrarSesiones";

// un admin sin cliente no tendria acceso a nada y el backend no lo deja guardar, al superadmin se le quita el cliente si lo tiene
const AYUDA_CLIENTE = "Obligatorio para un admin. El superadmin no tiene cliente";
const validarCorreo = [required(), email("Escribe un correo válido")];

const opcionesRol = [
  { id: "superadmin", name: "Superadmin" },
  { id: "admin", name: "Admin" },
];

export const UserList = () => (
  <List pagination={<Paginacion />}>
    {/* desactivar en bloque pregunta antes y espera a que el servidor conteste, como el boton de la ficha */}
    <Datagrid rowClick="edit" bulkActionButtons={<DesactivarEnBloque />}>
      <TextField source="id" />
      <TextField source="email" label="Correo" />
      <SelectField source="rol" choices={opcionesRol} />
      <ReferenceField source="id_cliente" reference="clientes" label="Cliente" emptyText="(sin cliente)" />
      <BooleanField source="activo" />
    </Datagrid>
  </List>
);

// guardar y desactivar esperan a que el servidor conteste, si da error se queda en la ficha con lo escrito
export const UserEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<BarraFichaUsuario><CerrarSesiones /></BarraFichaUsuario>}>
      <TextField source="id" />
      <TextInput source="email" label="Correo" type="email" validate={validarCorreo} helperText="Cambiarlo cierra sus sesiones abiertas" />
      <SelectInput source="rol" choices={opcionesRol} validate={required()} />
      <ReferenceInput source="id_cliente" reference="clientes">
        <AutocompleteInput label="Cliente" optionText="nombre_cliente" helperText={AYUDA_CLIENTE} />
      </ReferenceInput>
      <BooleanInput source="activo" />
    </SimpleForm>
  </Edit>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="email" label="Correo" type="email" validate={validarCorreo} />
      <SelectInput source="rol" choices={opcionesRol} defaultValue="admin" validate={required()} />
      <ReferenceInput source="id_cliente" reference="clientes">
        <AutocompleteInput label="Cliente" optionText="nombre_cliente" helperText={AYUDA_CLIENTE} />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);
