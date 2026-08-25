// src/components/index.js

/* ── FORMS ── */
export { default as ForgotPasswordForm } from "./forms/ForgotPasswordForm";
export { default as LoginForm }          from "./forms/LoginForm";
export { default as RegisterForm }       from "./forms/RegisterForm";
export { default as ResetPasswordForm }  from "./forms/ResetPasswordForm";

/* ── LAYOUT ── */
export { default as AuthLayout } from "./forms/AuthLayout";
export { default as MainLayout } from "./layout/MainLayout";

/* ── NAVIGATION ── */
export { default as Tabs } from "./navigation/Tabs";

/* ── UI CORE ── */
export { default as Avatar }           from "./ui/Avatar";
export { default as Badge }            from "./ui/Badge";
export { default as Button }           from "./ui/Button";
export { default as Card }             from "./ui/Card";
export { default as CsvUploadModal }   from "./ui/Csvuploadmodal";
export { default as Dropdown }         from "./ui/Dropdown";
export { default as FileUpload }       from "./ui/FileUpload";
export { default as Footer }           from "./ui/footer";
export { default as Input, Textarea, Select, Checkbox } from "./ui/Input";
export { default as PhoneInput }       from "./ui/PhoneInput";
export { default as RichTextEditor }   from "./ui/RichTextEditor";
export { default as LoadingScreen }    from "./ui/LoadingScreen";
export { default as AppModal }         from "./ui/AppModal";
export { default as Modal }            from "./ui/Modal";
export { default as Toast }            from "./ui/Toast";
export { default as UserAvatar }       from "./ui/UserAvatar";
export { default as IconActionButton } from "./ui/IconActionButton";

/* ── TOAST GLOBAL (contexto) ── */
// Para notificaciones globales: const { notify } = useToast()
export { useToast, ToastProvider } from "../context/ToastContext";
