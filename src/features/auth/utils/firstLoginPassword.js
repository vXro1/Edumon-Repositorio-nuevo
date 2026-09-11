// puente entre LoginPage y FirstLoginScreen (necesita la contraseña actual para
// change-password). sessionStorage en vez de location.state: FirstLoginScreen
// hace pushState para bloquear el botón "atrás", lo que dejaba el state de ruta en null
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
