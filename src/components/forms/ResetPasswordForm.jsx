// src/features/auth/components/forms/ResetPasswordForm.jsx
import { useState } from "react";
import { Mail, Phone, Key, Lock } from "lucide-react";
import { Input } from "@/components";
import AuthLayout from "./AuthLayout";

const validate = ({ correo, telefono, codigo, contrasenaNueva, confirmar, method }) => {
  const e = {};
  if (method === "phone") {
    if (!telefono?.trim()) e.telefono = "El número es requerido";
  } else {
    if (!correo?.trim())
      e.correo = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      e.correo = "Ingresa un correo válido";
  }
  if (!codigo.trim())
    e.codigo = "El código es requerido";
  else if (!/^\d{4,8}$/.test(codigo.trim()))
    e.codigo = "El código debe tener entre 4 y 8 dígitos";
  if (!contrasenaNueva)
    e.contrasenaNueva = "La contraseña es requerida";
  else if (contrasenaNueva.length < 6)
    e.contrasenaNueva = "Mínimo 6 caracteres";
  if (confirmar !== contrasenaNueva)
    e.confirmar = "Las contraseñas no coinciden";
  return e;
};

const ResetPasswordForm = ({
  onSubmit,
  loading = false,
  error = "",
  success = false,
  defaultEmail = "",
  defaultPhone = "",
  method = "email",
  onBack,
  onGoLogin,
}) => {
  const [form, setForm] = useState({
    correo:          defaultEmail,
    telefono:        defaultPhone,
    codigo:          "",
    contrasenaNueva: "",
    confirmar:       "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = validate({ ...form, method });
    if (Object.keys(ve).length) { setErrors(ve); return; }
    const { confirmar, ...rest } = form;
    onSubmit({ ...rest, method });
  };

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <h1>Nueva contraseña</h1>
        <p>
          {success
            ? "Tu contraseña fue actualizada correctamente."
            : `Ingresa el código que recibiste por ${method === "phone" ? "WhatsApp" : "correo"} y tu nueva contraseña.`}
        </p>
      </div>

      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      {success ? (
        <>
          <div className="auth-success" role="status">
            ✅ ¡Contraseña actualizada! Ya puedes iniciar sesión.
          </div>
          <button className="auth-submit" onClick={onGoLogin}>
            Ir al inicio de sesión
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {method === "phone" ? (
            <Input
              label="Número de WhatsApp"
              name="telefono"
              type="tel"
              placeholder="+573113014875"
              value={form.telefono}
              onChange={handleChange}
              leftIcon={<Phone size={16} />}
              error={errors.telefono}
              autoComplete="tel"
            />
          ) : (
            <Input
              label="Correo electrónico"
              name="correo"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.correo}
              onChange={handleChange}
              leftIcon={<Mail size={16} />}
              error={errors.correo}
              autoComplete="email"
            />
          )}

          <Input
            label="Código de verificación"
            name="codigo"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={form.codigo}
            onChange={handleChange}
            leftIcon={<Key size={16} />}
            error={errors.codigo}
            autoComplete="one-time-code"
            autoFocus
          />

          <Input
            label="Nueva contraseña"
            name="contrasenaNueva"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.contrasenaNueva}
            onChange={handleChange}
            leftIcon={<Lock size={16} />}
            error={errors.contrasenaNueva}
            autoComplete="new-password"
          />

          <Input
            label="Confirmar contraseña"
            name="confirmar"
            type="password"
            placeholder="Repite tu contraseña"
            value={form.confirmar}
            onChange={handleChange}
            leftIcon={<Lock size={16} />}
            error={errors.confirmar}
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading} className="auth-submit">
            {loading
              ? <><span className="auth-spinner" /> Guardando...</>
              : "Cambiar contraseña"
            }
          </button>

          <div className="auth-row-between">
            <button type="button" className="auth-link-btn" onClick={onBack}>
              ← Volver al inicio de sesión
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
export default ResetPasswordForm;
