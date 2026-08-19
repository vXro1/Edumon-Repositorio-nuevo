const VARIANT = {
  primary:         "btn btn-primary",
  secondary:       "btn btn-secondary",
  ghost:           "btn btn-ghost",
  "ghost-primary": "btn btn-ghost-primary",
  "ghost-danger":  "btn btn-ghost-danger",
  danger:          "btn btn-danger",
  success:         "btn btn-success",
  warning:         "btn btn-warning",
  outline:         "btn btn-outline",
  "outline-neutral": "btn btn-outline-neutral",
  soft:            "btn btn-soft",
  gradient:        "btn btn-gradient",
  link:            "btn btn-link",
};

const SIZE = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  xl: "btn-xl",
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  ...rest
}) {
  const classes = [
    VARIANT[variant] ?? "btn btn-primary",
    SIZE[size] ?? "",
    fullWidth ? "btn-full" : "",
    loading   ? "btn-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      <span className="btn-text">{children}</span>
      {rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
}
