# Quick fix: 401 en login

Se enviaba `contraseña` (con tilde) al backend, que espera `contrasena` (sin tilde). Endpoints afectados: `authLogin`, `authRegister`, `authChangePassword`, `authResetPassword`.

Ver [DEBUG.md](./DEBUG.md) para el detalle y [VALIDATION_ERRORS.md](./VALIDATION_ERRORS.md) para errores de validación al registrar.
