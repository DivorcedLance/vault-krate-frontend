# Documentación de Endpoints

## `POST /files/upload`

**Descripción:** Permite subir uno o varios archivos al sistema, junto con su metadata asociada. La metadata y los archivos deben enviarse como partes del formulario.

**Request:**

- Tipo: `multipart/form-data`

  - `file_data`: archivo binario (uno o varios, con nombre del campo 'file_data')
  - `metadata`: JSON serializado con los campos: user_id, description, file_name, delete_at (opcional en formato RFC3339)

**Response:**

- `201`: `application/json`
  - `array`: Lista de file_id (uno por archivo subido)
- `400/500`: application/json con mensaje de error

---

## `GET /files/download`

**Descripción:** Permite descargar un archivo a partir de su file_id.

**Request:**

- Tipo: `query`

  - `file_id`: string

**Response:**

- `200`: application/octet-stream (contenido del archivo)

---

## `GET /files/info`

**Descripción:** Devuelve los metadatos de un archivo específico.

**Request:**

- Tipo: `query`

  - `file_id`: string

**Response:**

- `200`: `application/json`
  - `file_id`: string
  - `user_id`: string
  - `size`: u64
  - `server_id`: string
  - `uploaded_at`: string (formato RFC3339)
  - `description`: string
  - `file_name`: string
  - `mime_type`: string
  - `download_count`: u64
  - `last_access`: string (formato RFC3339)
  - `delete_at`: string (formato RFC3339) (opcional)

---

## `GET /files/info`

**Descripción:** Devuelve los metadatos de un archivo específico.

**Request:**

- Tipo: `query`

  - `user_id`: string

**Response:**

- `200`: `application/json`
  - `array`: Lista de objetos con los siguientes campos:
    - `file_id`: string
    - `user_id`: string
    - `size`: u64
    - `server_id`: string
    - `uploaded_at`: string (formato RFC3339)
    - `description`: string
    - `file_name`: string
    - `mime_type`: string
    - `download_count`: u64
    - `last_access`: string (formato RFC3339)
    - `delete_at`: string (formato RFC3339) (opcional)

---

## `PUT /files/info`

**Descripción:** Permite actualizar los metadatos del archivo.

**Request:**

- Tipo: `application/json`

  - `file_id`: string
  - `user_id`: string (opcional)
  - `size`: u64 (opcional)
  - `server_id`: string (opcional)
  - `uploaded_at`: string (formato RFC3339) (opcional)
  - `description`: string (opcional)
  - `file_name`: string (opcional)
  - `mime_type`: string (opcional) 
  - `download_count`: u64 (opcional)
  - `last_access`: string (formato RFC3339) (opcional)
  - `delete_at`: string (formato RFC3339) (opcional)

**Response:**

- `200`: Sin contenido (actualización exitosa)

---

## `DELETE /files/delete`

**Descripción:** Elimina un archivo del sistema usando su ID.

**Request:**

- Tipo: `application/json`

  - `file_id`: string

**Response:**

- `200`: Sin contenido (eliminación exitosa)

---

## `POST /users/register`

**Descripción:** Registra un nuevo usuario con la información enviada.

**Request:**

- Tipo: `application/json`

  - `user_id`: string

**Response:**

- `200`: Sin contenido (registro exitoso)
- `400/500`: application/json con mensaje de error

---

## `GET /users/info`

**Descripción:** Devuelve la información del usuario autenticado.

**Request:**

- Tipo: `query`

  - `user_id`: string

**Response:**

- `200`: `application/json`
  - `user_id`: string
  - `file_count`: u64
  - `space_used`: u64
  - `space_limit`: u64

---
