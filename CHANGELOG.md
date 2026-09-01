# Changelog

## Auth: fix 401 en login

El frontend enviaba `{ telefono, contraseña }` (con tilde); el backend espera `contrasena` (sin tilde). Corregido en `authLogin`, `authRegister`, `authChangePassword`, `authResetPassword`.
