// src/features/auth/components/ResetPasswordForm.jsx

import { useState } from "react";
import { Input, Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

const validate = ({ correo, codigo, contrasenaNueva, confirmar }) => {
  const errors = {};

  if (!correo.trim()) errors.correo = "El correo es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
    errors.correo = "Correo inválido";

  if (!codigo.trim()) errors.codigo = "El código es requerido";
  else if (!/^\d{6}$/.test(codigo.trim()))
    errors.codigo = "El código debe tener 6 dígitos";

  if (!contrasenaNueva) errors.contrasenaNueva = "La contraseña es requerida";
  else if (contrasenaNueva.length < 8)
    errors.contrasenaNueva = "Mínimo 8 caracteres";

  if (!confirmar) errors.confirmar = "Confirma tu contraseña";
  else if (confirmar !== contrasenaNueva)
    errors.confirmar = "Las contraseñas no coinciden";

  return errors;
};

const ResetPasswordForm = ({
  onSubmit,
  loading,
  error,
  defaultEmail = "",
}) => {
  const [form, setForm] = useState({
    correo: defaultEmail,
    codigo: "",
    contrasenaNueva: "",
    confirmar: "",
  });

  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const { confirmar, ...payload } = form;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="form-auth" noValidate>
      {/* 🔴 Error global */}
      {error && (
        <p className="text-red-500 text-sm mb-3">
          {error}
        </p>
      )}

      <Input
        id="correo"
        name="correo"
        label="Correo electrónico"
        type="email"
        placeholder="usuario@ejemplo.com"
        value={form.correo}
        onChange={handleChange}
        error={errors.correo}
        autoComplete="email"
      />

      <Input
        id="codigo"
        name="codigo"
        label="Código de verificación"
        type="text"
        placeholder="123456"
        value={form.codigo}
        onChange={handleChange}
        error={errors.codigo}
        maxLength={6}
        inputMode="numeric"
      />

      {/* Nueva contraseña */}
      <div className="form-field relative">
        <Input
          id="contrasenaNueva"
          name="contrasenaNueva"
          label="Nueva contraseña"
          type={showPass ? "text" : "password"}
          placeholder="Mínimo 8 caracteres"
          value={form.contrasenaNueva}
          onChange={handleChange}
          error={errors.contrasenaNueva}
          autoComplete="new-password"
        />

        <IconBtn
          color="var(--color-text-muted)"
          onClick={() => setShowPass((v) => !v)}
          aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d={
                showPass
                  ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              }
            />
          </svg>
        </IconBtn>
      </div>

      <Input
        id="confirmar"
        name="confirmar"
        label="Confirmar contraseña"
        type={showPass ? "text" : "password"}
        placeholder="Repite la nueva contraseña"
        value={form.confirmar}
        onChange={handleChange}
        error={errors.confirmar}
        autoComplete="new-password"
      />

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="form-button form-button--primary"
      >
        {loading ? "Restableciendo..." : "Restablecer contraseña"}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;