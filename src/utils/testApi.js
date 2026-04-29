// src/utils/testApi.js
// Utilidad para testear la conexión al API sin ir a través de React

const baseUrl = () => import.meta.env.VITE_API_URL ?? "/api";

export const testLogin = async (telefono = "+573001234567", contrasena = "test123") => {
  console.log("🔍 Testando login al API...");
  console.log(`   Base URL: ${baseUrl()}`);
  console.log(`   Teléfono: ${telefono}`);
  
  try {
    const response = await fetch(`${baseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telefono,
        contrasena,
      }),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json().catch(() => ({}));
    console.log("   Response:", data);
    
    if (response.ok) {
      console.log("✅ Login exitoso. Token:", data.token?.substring(0, 20) + "...");
      return data;
    } else {
      console.error("❌ Login fallido:", data.message || "Credenciales incorrectas");
      return null;
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    return null;
  }
};

export const testRegister = async (userData = {}) => {
  const defaultData = {
    nombre: "Test",
    apellido: "User",
    cedula: "1234567890",
    correo: "test@test.com",
    contrasena: "test123",
    rol: "estudiante",
    telefono: "+573001234567",
    ...userData,
  };

  console.log("🔍 Testando registro al API...");
  console.log("   Datos enviados:", defaultData);
  
  try {
    const response = await fetch(`${baseUrl()}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(defaultData),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json().catch(() => ({}));
    
    if (response.ok) {
      console.log("✅ Registro exitoso");
      console.log("   Token:", data.token?.substring(0, 20) + "...");
      console.log("   Usuario:", data.user);
      return data;
    } else {
      console.error("❌ Registro fallido");
      console.error("   Mensaje:", data.message);
      
      // Mostrar errores de validación detallados
      if (data.errors && Array.isArray(data.errors)) {
        console.error("   Errores de validación:");
        data.errors.forEach(err => {
          const field = err.field || err.path || "desconocido";
          const msg = err.message || err.msg || "Error desconocido";
          console.error(`     • ${field}: ${msg}`);
        });
      }
      
      console.log("   Respuesta completa:", data);
      return null;
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    return null;
  }
};

export const testApiConnection = async () => {
  console.log("🔍 Testando conexión al API...");
  console.log(`   Base URL: ${baseUrl()}`);
  
  try {
    const response = await fetch(`${baseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telefono: "+573001234567",
        contraseña: "testpassword",
      }),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, {
      "content-type": response.headers.get("content-type"),
      "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
    });
    
    const data = await response.json().catch(() => ({}));
    console.log("   Response:", data);
    
    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("❌ Error en conexión al API:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Exportar para usar en consola
if (typeof window !== "undefined") {
  window.testApi = {
    login: testLogin,
    register: testRegister,
    connection: testApiConnection,
    help: () => {
      console.log(`
📚 Comandos disponibles en la consola:

1. Testear login:
   testApi.login("+573001234567", "password123")

2. Testear registro:
   testApi.register({ nombre: "Juan", telefono: "+573001234567", contrasena: "test123" })

3. Testear conexión:
   testApi.connection()

4. Ver esta ayuda:
   testApi.help()
      `);
    },
  };
}

