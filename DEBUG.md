# Guía de Diagnóstico - Error 401 en Login

## 🎯 PROBLEMA RESUELTO ✅

El error **401** se debía a que se estaba enviando `contraseña` (CON TILDE) al backend, pero el backend espera `contrasena` (SIN TILDE).

### Cambio crítico realizado:
```javascript
// ❌ ANTES (incorrecto)
body: JSON.stringify({ telefono, contraseña: contrasena })

// ✅ AHORA (correcto)
body: JSON.stringify({ telefono, contrasena })
```

---

## 🚀 PRÓXIMOS PASOS

### Paso 1: Reinicia el servidor
```bash
npm run dev
```

### Paso 2: Registra un usuario (abre DevTools F12 → Console)

Usa datos diferentes cada vez (correo, teléfono, cédula deben ser únicos):

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

**Resultado esperado:**
```
✅ Registro exitoso
   Token: eyJhbGciOiJIUzI1NiIsIn...
   Usuario: { ... }
```

### Paso 3: Intenta login
```javascript
testApi.login("+573001234567", "password123")
```

**Resultado esperado:**
```
✅ Login exitoso. Token: eyJhbGciOiJIUzI1NiIsIn...
```

---

## 🔴 Error 400: Validación Fallida

Si ves:
```
❌ Registro fallido
   Mensaje: Errores de validación
   Errores de validación:
     • correo: Ya existe
     • telefono: Formato inválido
```

### Soluciones:
1. **Correo ya existe**: Usa otro email (ej: `test2@test.com`)
2. **Teléfono duplicado**: Usa otro número (ej: `+573001234568`)
3. **Cédula duplicada**: Usa otra cédula (ej: `9876543210`)
4. **Email inválido**: Formato correcto: `usuario@dominio.com`
5. **Teléfono inválido**: Formato: `+573001234567`
6. **Contraseña corta**: Mínimo 6 caracteres

**[Ver detalles completos en VALIDATION_ERRORS.md](./VALIDATION_ERRORS.md)**

---

## 🐛 COMANDOS DE DEBUGGING

```javascript
testApi.help()         // Ver todos los comandos
testApi.connection()   // Test de conexión
testApi.register()     // Intenta registrar con datos por defecto
testApi.login()        // Intenta login con datos por defecto
```

---

## 📋 Cambios realizados en el código

| Archivo | Cambio |
|---------|--------|
| `src/lib/apiClient.js` | ✅ `authLogin`: `contrasena` (sin tilde) |
| `src/lib/apiClient.js` | ✅ Errores de validación mejorados |
| `src/utils/testApi.js` | ✅ Actualizado para usar nombres sin tilde |
| `src/utils/testApi.js` | ✅ Errores de validación mostrados claramente |
| `vite.config.js` | ✅ Puerto actualizado a 5175 |
| `.env` | ✅ Variables de entorno configuradas |
| `VALIDATION_ERRORS.md` | ✅ Guía de errores de validación |

---

## 🔍 Si todavía no funciona

1. Ejecuta esto en la consola:
```javascript
testApi.register({
  nombre: "Test",
  apellido: "User",
  cedula: "9999999999",
  correo: "mitest@test.com",
  contrasena: "test123456",
  rol: "estudiante",
  telefono: "+573009999999"
})
```

2. Copia el output completo de la consola
3. Revisa que cada campo tenga un valor válido
4. Intenta con datos diferentes si ves errores de duplicados

---

**Archivos de referencia:**
- 📄 `QUICK_FIX.md` - Guía rápida
- 📄 `VALIDATION_ERRORS.md` - Errores de validación
- 📄 `CHANGELOG.md` - Historial de cambios
