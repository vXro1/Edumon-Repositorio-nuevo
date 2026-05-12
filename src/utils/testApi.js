// src/utils/testApi.js
// Utilidad para testear la conexión al API sin ir a través de React

const baseUrl = () => import.meta.env.VITE_API_URL ?? "/api";

export const testLogin = async (
  telefono = "+573001234567",
  contrasena = "test123"
) => {
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

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return data;
    } else {
      console.error(
        "❌ Login fallido:",
        data.message || "Credenciales incorrectas"
      );
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

  try {
    const response = await fetch(`${baseUrl()}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(defaultData),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return data;
    } else {
      console.error("❌ Registro fallido");
      console.error("Mensaje:", data.message);

      if (data.errors && Array.isArray(data.errors)) {
        console.error("Errores de validación:");

        data.errors.forEach((err) => {
          const field = err.field || err.path || "desconocido";
          const msg = err.message || err.msg || "Error desconocido";

          console.error(`• ${field}: ${msg}`);
        });
      }

      return null;
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    return null;
  }
};

export const testApiConnection = async () => {
  try {
    const response = await fetch(`${baseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telefono: "+573001234567",
        contrasena: "testpassword",
      }),
    });

    console.log("Headers:", {
      "content-type": response.headers.get("content-type"),
      "access-control-allow-origin":
        response.headers.get("access-control-allow-origin"),
    });

    const data = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("❌ Error en conexión al API:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

// Exportar para consola del navegador
if (typeof window !== "undefined") {
  window.testApi = {
    login: testLogin,
    register: testRegister,
    connection: testApiConnection,
    help: () => {
      console.log(`
📚 Comandos disponibles:

1. testApi.login("+573001234567", "password123")

2. testApi.register({
   nombre: "Juan",
   telefono: "+573001234567",
   contrasena: "test123"
})

3. testApi.connection()
      `);
    },
  };
}
