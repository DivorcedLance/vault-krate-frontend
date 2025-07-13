# Vault Krate Backend - API Documentation

Este documento describe todos los endpoints disponibles en el backend de Vault Krate y los formatos de request/response que debe utilizar el frontend.

## Endpoints Disponibles

### 1. Upload de Archivo Único Regular
**Endpoint:** `POST /files/upload/single`  
**Tipo:** Multipart Form Data  
**Descripción:** Sube un archivo único asociado a un usuario.

**Request:**
```
Content-Type: multipart/form-data

file_data: [archivo binario]
metadata: {
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Mi documento importante",
  "file_name": "documento.pdf",
  "mime_type": "application/pdf",
  "delete_at": "2024-12-31T23:59:59Z"  // opcional
}
```

**Response (201 Created):**
```json
{
  "file_id": "abc123-def456-ghi789",
  "mime_type": "application/pdf",
  "size": 1024768,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Mi documento importante",
  "file_name": "documento.pdf",
  "server_id": "server-uuid",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "download_count": 0,
  "last_access": "2024-01-15T10:30:00Z",
  "delete_at": "2024-12-31T23:59:59Z"
}
```

---

### 2. Upload de Archivo Único Temporal
**Endpoint:** `POST /files/upload/temp`  
**Tipo:** Multipart Form Data  
**Descripción:** Sube un archivo temporal sin asociar a usuario (expira en 24h por defecto).

**Request:**
```
Content-Type: multipart/form-data

file_data: [archivo binario]
delete_at: "2024-01-16T10:30:00Z"  // opcional, por defecto 24h
mime_type: "application/pdf"       // opcional, por defecto "application/octet-stream"
```

**Response (201 Created):**
```json
{
  "file_id": "temp123-abc456-def789",
  "mime_type": "application/pdf",
  "size": 1024768,
  "user_id": null,
  "description": "Temporary file",
  "file_name": "temp_file",
  "server_id": "server-uuid",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "download_count": 0,
  "last_access": "2024-01-15T10:30:00Z",
  "delete_at": "2024-01-16T10:30:00Z"
}
```

---

### 3. Upload Chunked Regular
**Endpoint:** `POST /files/upload/chunked`  
**Tipo:** Multipart Form Data  
**Descripción:** Sube múltiples chunks de un archivo regular que se ensamblan en el servidor.

**Request:**
```
Content-Type: multipart/form-data

file_data: [chunk 1]
file_data: [chunk 2]
file_data: [chunk N]
metadata: {
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Archivo grande subido por chunks",
  "file_name": "video_grande.mp4",
  "mime_type": "video/mp4",
  "total_size": 104857600,
  "chunk_count": 3,
  "delete_at": "2024-12-31T23:59:59Z",  // opcional
  "is_temporary": false
}
```

**Response (201 Created):**
```json
{
  "file_id": "chunked123-abc456-def789",
  "mime_type": "video/mp4",
  "size": 104857600,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Archivo grande subido por chunks",
  "file_name": "video_grande.mp4",
  "server_id": "server-uuid",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "download_count": 0,
  "last_access": "2024-01-15T10:30:00Z",
  "delete_at": "2024-12-31T23:59:59Z"
}
```

---

### 4. Upload Chunked Temporal
**Endpoint:** `POST /files/upload/temp/chunked`  
**Tipo:** Multipart Form Data  
**Descripción:** Sube múltiples chunks de un archivo temporal.

**Request:**
```
Content-Type: multipart/form-data

file_data: [chunk 1]
file_data: [chunk 2]
file_data: [chunk N]
metadata: {
  "file_name": "archivo_temporal.zip",
  "mime_type": "application/zip",
  "total_size": 52428800,
  "chunk_count": 2,
  "delete_at": "2024-01-16T10:30:00Z"  // opcional, por defecto 24h
}
```

**Response (201 Created):**
```json
{
  "file_id": "temp-chunked123-abc456",
  "mime_type": "application/zip",
  "size": 52428800,
  "user_id": null,
  "description": "Temporary chunked file",
  "file_name": "archivo_temporal.zip",
  "server_id": "server-uuid",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "download_count": 0,
  "last_access": "2024-01-15T10:30:00Z",
  "delete_at": "2024-01-16T10:30:00Z"
}
```

---

### 5. Download de Archivo
**Endpoint:** `GET /files/download`  
**Tipo:** Query Parameters  
**Descripción:** Descarga un archivo y actualiza el contador de descargas.

**Request:**
```
GET /files/download?file_id=abc123-def456-ghi789
```

**Response (200 OK):**
```
Headers:
content-type: application/pdf
file-name: documento.pdf
file-size: 1024768

Body: [contenido binario del archivo]
```

---

### 6. Obtener Información de Archivos
**Endpoint:** `GET /files/info`  
**Tipo:** Query Parameters  
**Descripción:** Obtiene metadatos de archivos. Acepta uno de: file_id, user_id, o server_id.

**Request por file_id:**
```
GET /files/info?file_id=abc123-def456-ghi789
```

**Response (200 OK):**
```json
{
  "file_id": "abc123-def456-ghi789",
  "mime_type": "application/pdf",
  "size": 1024768,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Mi documento importante",
  "file_name": "documento.pdf",
  "server_id": "server-uuid",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "download_count": 5,
  "last_access": "2024-01-20T15:45:00Z",
  "delete_at": "2024-12-31T23:59:59Z"
}
```

**Request por user_id:**
```
GET /files/info?user_id=550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
[
  {
    "file_id": "abc123-def456-ghi789",
    "mime_type": "application/pdf",
    "size": 1024768,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Mi documento importante",
    "file_name": "documento.pdf",
    "server_id": "server-uuid",
    "uploaded_at": "2024-01-15T10:30:00Z",
    "download_count": 5,
    "last_access": "2024-01-20T15:45:00Z",
    "delete_at": "2024-12-31T23:59:59Z"
  },
  {
    "file_id": "xyz789-uvw456-rst123",
    "mime_type": "image/jpeg",
    "size": 2048000,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Mi foto",
    "file_name": "foto.jpg",
    "server_id": "server-uuid",
    "uploaded_at": "2024-01-16T09:15:00Z",
    "download_count": 2,
    "last_access": "2024-01-18T12:30:00Z",
    "delete_at": null
  }
]
```

**Request por server_id:**
```
GET /files/info?server_id=server-uuid
```

**Response:** Array similar al de user_id pero con todos los archivos del servidor.

---

### 7. Actualizar Información de Archivo Regular
**Endpoint:** `PUT /files/info`  
**Tipo:** JSON  
**Descripción:** Actualiza descripción, nombre y/o fecha de expiración de archivos regulares únicamente (no temporales).

**Request:**
```json
{
  "file_id": "abc123-def456-ghi789",
  "file_name": "nuevo_nombre.pdf",        // opcional
  "description": "Nueva descripción",     // opcional
  "delete_at": "2024-06-30T23:59:59Z"    // opcional, null para quitar expiración
}
```

**Response (200 OK):**
```json
{
  "altered": 1
}
```

**Notas:**
- Solo funciona con archivos regulares (no temporales)
- Si se intenta actualizar un archivo temporal, devuelve `{"altered": 0}` con error
- Solo permite cambiar: `file_name`, `description`, `delete_at`
- No permite cambiar: `user_id`, `size`, `mime_type`, `uploaded_at`, etc.

---

### 8. Eliminar Archivo
**Endpoint:** `DELETE /files/delete`  
**Tipo:** Query Parameters  
**Descripción:** Elimina un archivo del storage y base de datos (funciona para archivos regulares y temporales).

**Request:**
```
DELETE /files/delete?file_id=abc123-def456-ghi789
```

**Response (204 No Content):**
```
(Sin contenido)
```

---

### 9. Eliminar Archivos Expirados
**Endpoint:** `DELETE /files/delete/old`  
**Tipo:** Sin parámetros  
**Descripción:** Elimina automáticamente archivos que han expirado (delete_at < now()).

**Request:**
```
DELETE /files/delete/old
```

**Response (200 OK):**
```json
[
  {
    "file_id": "expired123-abc456-def789",
    "mime_type": "application/pdf",
    "size": 1024768,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Archivo expirado",
    "file_name": "documento_viejo.pdf",
    "server_id": "server-uuid",
    "uploaded_at": "2024-01-01T10:00:00Z",
    "download_count": 3,
    "last_access": "2024-01-10T15:00:00Z",
    "delete_at": "2024-01-14T23:59:59Z"
  }
]
```

---

## Códigos de Estado HTTP

### Éxito
- **200 OK**: Operación exitosa (GET, DELETE /files/delete/old)
- **201 Created**: Archivo creado exitosamente (POST uploads)
- **204 No Content**: Archivo eliminado exitosamente (DELETE)

### Errores del Cliente
- **400 Bad Request**: 
  - Datos faltantes o inválidos
  - JSON mal formado
  - Parámetros requeridos faltantes
  - Número de chunks incorrecto

### Errores del Servidor
- **500 Internal Server Error**: 
  - Error del storage
  - Error de base de datos
  - Error de procesamiento interno

---

## Formatos de Fecha

Todas las fechas usan formato ISO 8601 con timezone UTC:
```
"2024-01-15T10:30:00Z"
```

---

## Notas Importantes

### Archivos Temporales vs Regulares
- **Temporales**: `user_id = null`, se eliminan automáticamente al expirar
- **Regulares**: `user_id` válido, persisten hasta eliminación manual o expiración

### Chunks
- Los chunks deben enviarse en orden secuencial
- El `chunk_count` debe coincidir con el número de chunks enviados
- Los chunks se ensamblan en memoria antes de subir al storage

### Seguridad
- Solo archivos regulares pueden ser actualizados
- Los archivos temporales no afectan estadísticas de usuario
- Las eliminaciones son irreversibles

### Límites
- Tamaño máximo de archivo: Definido por configuración del servidor
- Tiempo de expiración por defecto: 24 horas para archivos temporales
- Número máximo de chunks: Sin límite definido (limitado por memoria)