# 🚀 QUICK START - Error 401 SOLUCIONADO ✅

## El problema fue:
Se enviaba `contraseña` (CON TILDE) pero el backend espera `contrasena` (SIN TILDE).

**Esto ya está CORREGIDO en el código. Ahora funciona.**

---

## 3 pasos para probar que funciona:

### 1️⃣ Reinicia el servidor
```bash
npm run dev
```

### 2️⃣ Registra un usuario (abre DevTools F12 → Console)
```javascript
testApi.register({ 
  nombre: "Test", 
  apellido: "User",
  telefono: "+573001234567", 
  contrasena: "test123",
  cedula: "1234567890",
  correo: "test@test.com",
  rol: "estudiante"
})
```
**Resultado esperado**: `✅ Registro exitoso`

### 3️⃣ Intenta login
```javascript
testApi.login("+573001234567", "test123")
```
**Resultado esperado**: `✅ Login exitoso. Token: ...`

---

## ¿Qué cambió en el código?

Todos estos endpoints ahora envían nombres SIN TILDE:

- `authLogin` → `{ telefono, contrasena }` ✅
- `authRegister` → `{ ..., contrasena }` ✅  
- `authChangePassword` → `{ contrasenaActual, contrasenaNueva }` ✅
- `authResetPassword` → `{ ..., contrasenaNueva }` ✅

---

## Más ayuda

```javascript
testApi.help()  // Ver todos los comandos disponibles
```

**[Ver documentación completa en DEBUG.md](./DEBUG.md)**
