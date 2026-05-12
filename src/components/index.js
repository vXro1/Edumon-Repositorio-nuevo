// src/components/index.js

/* ─────────────────────────────────────────────
   EDUMON COMPONENT EXPORT HUB
   ───────────────────────────────────────────── */

/* ── FORMS ── */
export { default as ForgotPasswordForm } from "./forms/ForgotPasswordForm";
export { default as LoginForm          } from "./forms/LoginForm";
export { default as RegisterForm       } from "./forms/RegisterForm";
export { default as ResetPasswordForm  } from "./forms/ResetPasswordForm";
export { default as AuthLayout         } from "./forms/AuthLayout";

/* ── LAYOUT ── */
export { default as MainLayout } from "./layout/MainLayout";

/* ── NAVIGATION ── */
export { default as Navbar  } from "./navigation/Navbar";
export { default as Sidebar } from "./navigation/Sidebar";
export { default as Tabs    } from "./navigation/Tabs";

/* ── SOCIAL ── */
export { default as CommentSection } from "./social/CommentSection";
export { default as LikeButton     } from "./social/LikeButton";
export { default as PostCard       } from "./social/PostCard";
export { default as UserMiniCard   } from "./social/UserMiniCard";

/* ── UI CORE ── */
export { default as Avatar          } from "./ui/Avatar";
export { default as Button          } from "./ui/Button";
export { default as Card            } from "./ui/Card";
export { default as CsvUploadModal  } from "./ui/Csvuploadmodal";
export { default as  padresCsvTemplate       } from "./ui/padresCsvTemplate";
export { default as  modulosCsvTemplate       } from "./ui/modulosCsvTemplate";
export { default as Dropdown        } from "./ui/Dropdown";
export { default as FileUpload      } from "./ui/FileUpload";
export { default as Footer          } from "./ui/footer";
export { default as LoadingScreen   } from "./ui/LoadingScreen";
export { default as Modal           } from "./ui/Modal";
export { default as Toast           } from "./ui/Toast";
export { default as UserAvatar      } from "./ui/UserAvatar";
export { default as IconActionButton} from "./ui/IconActionButton";

/* ── CALENDAR ── */
export { default as CalendarWidget } from "./ui/CalendarWidget";

/* ── BADGE (default + named exports) ── */
export { default as Badge, NotifBadge, XpBadge } from "./ui/Badge";

/* ── INPUT (default + named exports) ── */
export { default as Input, Textarea, Select, Toggle, Checkbox, Radio } from "./ui/Input";

/* ── SESSION CARD ── */
export { default as SessionCard } from "./ui/SessionCard";