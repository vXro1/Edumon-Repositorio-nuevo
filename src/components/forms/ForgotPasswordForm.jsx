// src/features/auth/components/forms/ForgotPasswordForm.jsx

import { useState } from "react";
import { Input, Button } from "../ui/index";
import { ErrorState } from "../feedback/index";
import "../../styles/forms.css";

const validate = ({ correo }) => {
  const errors = {};
  if (!correo.trim()) errors.correo = "El correo es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
    errors.correo = "Ingresa un correo válido";
  return errors;
};

export const ForgotPasswordForm = ({ onSubmit, loading, error }) => {
  const [correo, setCorreo] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate({ correo });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({ correo: correo.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="form-auth" noValidate>
      {error && <ErrorState message={error} />}

      <p className="form-description">
        Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
      </p>

      <Input
        id="correo"
        name="correo"
        label="Correo electrónico"
        type="email"
        placeholder="usuario@ejemplo.com"
        value={correo}
        onChange={(e) => {
          setCorreo(e.target.value);
          if (errors.correo) setErrors({});
        }}
        error={errors.correo}
        autoComplete="email"
        autoFocus
      />

      <Button type="submit" loading={loading} className="form-button form-button--primary">
        Enviar código de recuperación
      </Button>
    </form>
  );
};