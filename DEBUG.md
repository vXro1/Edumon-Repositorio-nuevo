# Debug: 401 en login

Causa: se enviaba `contraseña` (con tilde) al backend, que espera `contrasena` (sin tilde).

```javascript
// antes
body: JSON.stringify({ telefono, contraseña: contrasena })
// después
body: JSON.stringify({ telefono, contrasena })
```

Errores de validación al registrar (400) — ver [VALIDATION_ERRORS.md](./VALIDATION_ERRORS.md).
