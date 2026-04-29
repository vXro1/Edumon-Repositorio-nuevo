// RUTA MAIN 
// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
// src/main.jsx — replace the @import in the CSS with these:
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "./styles/Edumonstylecomponents.css";

// Cargar utilidades de testing en desarrollo
if (import.meta.env.DEV) {
  import("./utils/testApi");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);