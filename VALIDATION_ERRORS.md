# Validación de registro

`POST /auth/register` requiere: `nombre`, `apellido`, `cedula` (única), `correo` (único, formato válido), `contrasena` (mínimo 6 caracteres), `rol`, `telefono` (único, formato `+57...`).

Errores comunes: correo/teléfono/cédula duplicados, contraseña corta, formato de correo o teléfono inválido — el 400 trae el detalle por campo.
