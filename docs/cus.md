# Casos de Uso (CUS) – Vault-Krate

## CUS01 – Compartir archivos sin necesidad de registrarse
Actor: Usuario no registrado
Objetivo: Permitir a cualquier persona compartir archivos de forma rápida y temporal.
Descripción: El visitante sube uno o varios archivos y recibe enlaces únicos para compartir. Los archivos pueden visualizarse y descargarse mediante esos enlaces antes de que expiren automáticamente (p. ej. 24 horas). También se puede consultar su metadata (nombre, tipo, fecha de subida, etc.).

## CUS02 – Acceder a archivos compartidos
Actor: Usuario no registrado o registrado
Objetivo: Facilitar el acceso abierto a archivos compartidos mediante enlace.
Descripción: Cualquier persona con un enlace válido puede visualizar la metadata del archivo (nombre, tipo, tamaño, descripción, fecha de subida, etc.) y descargarlo directamente, sin necesidad de autenticarse.

## CUS03 – Crear una cuenta para almacenamiento permanente
Actor: Usuario no registrado
Objetivo: Incentivar el registro para acceder a funciones exclusivas.
Descripción: El usuario se registra para obtener una cuenta con espacio asignado, lo que le permite almacenar archivos sin fecha de expiración y administrarlos posteriormente.

## CUS04 – Subir archivos con almacenamiento permanente
Actor: Usuario registrado
Objetivo: Permitir que los usuarios autenticados almacenen archivos persistentes.
Descripción: El usuario registrado puede subir archivos que permanecerán disponibles hasta que él mismo los elimine o edite, siempre que no supere su cuota de almacenamiento.

## CUS05 – Gestionar mis archivos y espacio de almacenamiento
Actor: Usuario registrado
Objetivo: Dar al usuario control sobre su información y su espacio en el sistema.
Descripción: El usuario puede ver la lista de archivos que ha subido, consultar sus metadatos (nombre, tipo, tamaño, descripción, fecha de subida, etc.), descargarlos, actualizarlos o eliminarlos. Además, puede visualizar un resumen de su uso actual de almacenamiento (archivos subidos, espacio usado y cuota disponible).