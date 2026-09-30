import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { AppModal, Button } from "@/components";
import { useAuthContext } from "../context/AuthContext";

const WARNING_SECONDS = 120; // debe coincidir con WARNING_BEFORE_MS de sessionManager

// showWarning se activa 2 min antes del cierre por inactividad (sessionManager.js);
// sin este modal, el aviso quedaba calculado pero nunca se mostraba y la sesión
// se cerraba en silencio, pudiendo perder lo que el padre estaba escribiendo.
export default function SessionWarningModal() {
  const { showWarning, stayLoggedIn, logout } = useAuthContext();
  const [segundosRestantes, setSegundosRestantes] = useState(WARNING_SECONDS);

  useEffect(() => {
    if (!showWarning) {
      setSegundosRestantes(WARNING_SECONDS);
      return;
    }
    const intervalo = setInterval(() => {
      setSegundosRestantes((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [showWarning]);

  const minutos  = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
  const segundos = String(segundosRestantes % 60).padStart(2, "0");

  return (
    <AppModal isOpen={showWarning} onClose={stayLoggedIn} size="sm" closeOnOverlay={false}>
      <AppModal.Header title="¿Sigues ahí?" />
      <AppModal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", textAlign: "center" }}>
          <Clock size={32} />
          <p>
            Tu sesión está a punto de cerrarse por inactividad.
            Si no haces nada, se cerrará en <strong>{minutos}:{segundos}</strong> minutos
            y podrías perder lo que estabas escribiendo.
          </p>
        </div>
      </AppModal.Body>
      <AppModal.Footer>
        <Button variant="ghost" size="sm" onClick={() => logout()}>Cerrar sesión</Button>
        <Button size="sm" onClick={stayLoggedIn}>Seguir conectado</Button>
      </AppModal.Footer>
    </AppModal>
  );
}
