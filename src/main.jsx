// RUTA MAIN 
// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Fuentes (fontsource — sin peticiones externas)
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";

// Sistema de diseño — tokens + base + layout + utilidades
import "./styles/globals.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);