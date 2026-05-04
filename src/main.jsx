// RUTA MAIN 
// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Fonts (fontsource — no external requests)
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";

// Legacy component styles (loaded first so design token vars override it)
import "./styles/Edumonstylecomponents.css";

// Design system — tokens + base (loaded last = highest cascade priority)
import "./styles/globals.css";

// Cargar utilidades de testing en desarrollo
if (import.meta.env.DEV) {
  import("./utils/testApi");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);