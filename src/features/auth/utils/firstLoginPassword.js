// src/features/auth/utils/firstLoginPassword.js
// Puente entre LoginPage (conoce la contraseña temporal en texto plano justo
// al iniciar sesión) y FirstLoginScreen (la necesita en el paso 2 para poder
// llamar a change-password, que exige la contraseña actual).
//
// Antes viajaba por location.state de react-router. Eso se rompía en cuanto
// algo tocaba el History API nativo entre medio — y FirstLoginScreen hace
// exactamente eso (window.history.pushState para bloquear el botón "atrás"
// del navegador), así que el estado de la ruta podía quedar en null incluso
// sin que el usuario navegara manualmente. sessionStorage no depende del
// historial del navegador, así que sobrevive a esa interferencia.
const KEY = "edumon_first_login_pwd";

export const stashLoginPassword = (password) => {
  try { sessionStorage.setItem(KEY, password); } catch {}
};

export const readLoginPassword = () => {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
};

export const clearLoginPassword = () => {
  try { sessionStorage.removeItem(KEY); } catch {}
};
