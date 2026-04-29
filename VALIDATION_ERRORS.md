# Validación de Registro - Guía de Errores

## 🔴 Error 400: Validación Fallida

Si recibiste un error como:
```
Error (400): Errores de validación
  • field1: mensaje
  • field2: mensaje
```

---

## ✅ Campos Requeridos para Registro

Según la API, estos campos **DEBEN estar presentes** en `/auth/register`:

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `nombre` | string | ✅ Sí | No vacío |
| `apellido` | string | ✅ Sí | No vacío |
| `cedula` | string | ✅ Sí | Único, formato válido |
| `correo` | string | ✅ Sí | Email válido, único |
| `contrasena` | string | ✅ Sí | Mínimo 6 caracteres |
| `rol` | string | ✅ Sí | Valor válido (ej: "estudiante") |
| `telefono` | string | ✅ Sí | Único, formato +57... |

---

## 🐛 Errores Comunes y Soluciones

### 1. Email ya existe
```
Error: Ya existe un usuario con ese correo
Solución: Usa un email diferente, ej: test-123@test.com
```

### 2. Teléfono ya existe
```
Error: Ya existe un usuario con ese teléfono
Solución: Usa otro número, ej: +573001234568
```

### 3. Cédula duplicada
```
Error: Ya existe un usuario con esa cédula
Solución: Usa otra cédula, ej: 9876543210
```

### 4. Contraseña muy corta
```
Error: Mínimo 6 caracteres
Solución: Usa password más largo: "test123" (7+ caracteres)
```

### 5. Email inválido
```
Error: Email inválido
Solución: Usa formato correcto: "usuario@dominio.com"
```

### 6. Teléfono inválido
```
Error: Formato de teléfono inválido
Solución: Usa formato: "+573001234567"
```

---

## 🧪 Datos de Prueba que Funcionan

```javascript
testApi.register({
  nombre: "Juan",
  apellido: "Pérez",
  cedula: "1234567890",
  correo: "juan@test.com",
  contrasena: "password123",
  rol: "estudiante",
  telefono: "+573001234567"
})
```

---

## 📝 Cómo Debuggear

En DevTools Console, ejecuta:

```javascript
// Ver errores detallados
testApi.register({
  nombre: "Test",
  apellido: "User",
  cedula: "1111111111",
  correo: "test1@test.com",
  contrasena: "test123",
  rol: "estudiante",
  telefono: "+573001234568"
})
```

Si hay errores de validación, verás:
```
❌ Registro fallido
   Mensaje: Errores de validación
   Errores de validación:
     • correo: Formato inválido
     • telefono: Ya existe
```

---

## ✅ Validación Exitosa

Si todo es correcto, verás:
```
✅ Registro exitoso
   Token: eyJhbGciOiJIUzI1NiIsIn...
   Usuario: { id, nombre, apellido, correo, ... }
```

Luego podrás hacer login con:
```javascript
testApi.login("+573001234568", "test123")
```

---

**Si persiste un error, copia el output completo de la consola y solicita ayuda.**
