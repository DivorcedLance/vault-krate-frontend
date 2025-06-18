- Los endpoints están en https://vault-krate-efzt.shuttle.app
- Usaré supabase como db, para el manejo de los datos del usuario
- Además debe estar habilitada la autenticación con google auth por medio de supabase
- Usaré Next.js 14 con tailwind 3 y shadcn.
- Los endpoints de vault-krate-efzt.shuttle.app deben ser llamadas directamente por el front end no hagas server actions para estos. 
- Todo el manejo de la autenticación y los datos del usuario se manejarán por medio de supabase. Sin embargo, al registrar un usuario se debe llamar al endpoint `POST /users/register` con la id creada.
Además al obtener un usuario se debe llamar a `GET /users/info`. 

### 🔍 Aclaraciones importantes para la implementación

1. **Autenticación con Supabase:**

   * La autenticación se realiza con Google por medio de Supabase.
   * Al iniciar sesión por primera vez, debe enviarse una solicitud `POST /users/register` con el `user.id` proporcionado por Supabase.
   * Esta llamada **solo debe ejecutarse una vez por usuario**, idealmente detectando si es un nuevo login (`isNewUser` o equivalente).

2. **Endpoints `/files/info`:**

   * Ambos endpoints usan la misma ruta (`GET /files/info`) y se diferencian **solo por el parámetro recibido**:

     * Si se recibe `file_id`, retorna los metadatos de un solo archivo.
     * Si se recibe `user_id`, retorna todos los archivos de ese usuario.
   * **No se puede cambiar la ruta** ni dividirla.

3. **Expiración de archivos temporales:**

   * Los archivos pueden tener un campo `delete_at` en formato RFC3339, que define su expiración.
   * Cuando un archivo es subido sin autenticación, el sistema lo tratará como **temporal**.
   * Cualquier persona con el enlace podrá:

     * Ver sus metadatos
     * Descargarlo directamente
     * **Sin necesidad de autenticarse**

4. **Subida de archivos:**

   * El endpoint `POST /files/upload` **solo admite un archivo por solicitud**.
   * El archivo se envía como `file_data` y su metadata como JSON serializado en el mismo `FormData` (campo `metadata`).
   * La IA debe encargarse de generar correctamente este `FormData`.

5. **Panel del usuario:**

   * Los usuarios autenticados deben tener una interfaz donde puedan:

     * Ver todos sus archivos (consultando `GET /files/info?user_id=...`)
     * Visualizar sus metadatos
     * Descargar, editar (`PUT /files/info`) o eliminar (`DELETE /files/delete`) cada archivo
     * Ver el uso de espacio (`GET /users/info`) con un resumen visual (por ejemplo, barra de progreso)

6. **Stack técnico obligatorio:**

   * El proyecto debe estar construido con:

     * **Next.js 14**, utilizando la carpeta `src/app` y el sistema de rutas de la `App Router`
     * **Tailwind CSS v3**
     * **Shadcn/ui**
   * No se deben usar **Server Actions** ni llamadas desde el backend del frontend.
   * Las llamadas a `https://vault-krate-efzt.shuttle.app` deben hacerse directamente desde el cliente.

7. **Simplicidad inicial:**

   * No se requiere por ahora:

     * Subida múltiple de archivos
     * Filtros o búsqueda
     * Control de errores avanzado (se puede mostrar solo un mensaje básico)
