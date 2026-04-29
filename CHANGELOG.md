# CHANGELOG - Correcciones de Autenticación

## 🔴 Problema Identificado
El sistema rechazaba el login con error **401 Unauthorized** debido a un mismatch de nombres de propiedades en el JSON enviado al backend.

### Raíz del problema:
- Frontend enviaba: `{ telefono, contraseña: ... }` (CON TILDE)
- Backend esperaba: `{ telefono, contrasena, ... }` (SIN TILDE)

---

## ✅ Soluciones Implementadas

### 1. **src/lib/apiClient.js**
#### Cambio crítico en `authLogin`:
```javascript
// ❌ ANTES
body: JSON.stringify({ telefono, contraseña: contrasena })

// ✅ AHORA
body: JSON.stringify({ telefono, contrasena })
```

#### También corregidos:
- `authRegister`: `contrasena` (sin tilde)
- `authChangePassword`: `contrasenaActual`, `contrasenaNueva` (sin tildes)
- `authResetPassword`: `contrasenaNueva` (sin tilde)

### 2. **src/utils/testApi.js**
- Actualizado `testLogin` para usar `contrasena` (sin tilde)
- Función de ayuda mejorada con ejemplos

### 3. **Documentación**
- `DEBUG.md`: Guía completa actualizada
- `QUICK_FIX.md`: Referencia rápida con solución

### 4. **Configuración**
- `vite.config.js`: Puerto actualizado a 5175
- `.env`: Variables de entorno configuradas
- `src/main.jsx`: Integración de helpers de debug

---

## 🧪 Cómo Verificar la Solución

En DevTools Console:

```javascript
// 1. Registrar usuario
testApi.register({ 
  nombre: "Test", 
  apellido: "User",
  telefono: "+573001234567", 
  contrasena: "test123",
  cedula: "1234567890",
  correo: "test@test.com",
  rol: "estudiante"
})

// 2. Hacer login
testApi.login("+573001234567", "test123")

// 3. Ver ayuda
testApi.help()
```

---

## 📝 Archivos Modificados
- ✅ `src/lib/apiClient.js` - Nombres de propiedades corregidos
- ✅ `src/utils/testApi.js` - Actualizado con nombres correctos
- ✅ `DEBUG.md` - Documentación actualizada
- ✅ `QUICK_FIX.md` - Referencia rápida
- ✅ `vite.config.js` - Puerto configurado
- ✅ `.env` - Variables de entorno
- ✅ `.env.example` - Plantilla de configuración

---

## 📊 Impacto
- ✅ Error 401 solucionado
- ✅ API client ahora envía datos en formato correcto
- ✅ Herramientas de debugging integradas
- ✅ Documentación clara y accesible

**Status**: LISTO PARA TESTING ✅
