# EDUMON — Blueprint técnico de migración a Flutter (Android)

**Versión**: 1.0 · **Fecha**: 2026-07-09 · **Fuente**: ingeniería inversa completa de `EDUMON WEB` (React 19 + Vite + Tailwind v4), rama `refactor/design-system`.

**Equipo autor**: Software Architect Senior · Senior Flutter Developer · Senior UI/UX Designer · Product Manager · Mobile Application Architect · Clean Architecture Expert · Material Design 3 Specialist · Firebase & REST API Expert.

**Cómo leer este documento**: está organizado en 16 capítulos que corresponden 1:1 a un LMS (Learning Management System) educativo multi-tenant, multi-rol. Cada capítulo es autocontenido y referencia el código fuente real de la web (rutas, componentes, servicios) para que el equipo Flutter no dependa de volver a leer el frontend original. Todos los hallazgos de deuda técnica, código muerto y bugs del sistema actual están marcados explícitamente con **⚠️** para decidir si se replican, se corrigen o se descartan en la nueva app.

---

## Índice

1. [Análisis general del sistema](#fase-1)
2. [Análisis de diseño UI/UX](#fase-2)
3. [Análisis completo de cada pantalla](#fase-3)
4. [Mapa de navegación](#fase-4)
5. [Arquitectura Flutter](#fase-5)
6. [Componentes reutilizables](#fase-6)
7. [Análisis responsive](#fase-7)
8. [Estados de la aplicación](#fase-8)
9. [Modelos de datos](#fase-9)
10. [Endpoints necesarios](#fase-10)
11. [Seguridad](#fase-11)
12. [Animaciones](#fase-12)
13. [Optimización](#fase-13)
14. [Plan de desarrollo](#fase-14)
15. [Librerías Flutter](#fase-15)
16. [Checklist final](#fase-16)

---

<a name="fase-1"></a>
## FASE 1 — Análisis general del sistema

### 1.1 Objetivo de la plataforma

EDUMON es un **LMS (Learning Management System) educativo multi-tenant** dirigido a instituciones escolares (colegios). Conecta a cuatro tipos de actores alrededor de un curso: **super-administrador** (dueño de la plataforma, gestiona instituciones), **administrador de institución** (gestiona su colegio: docentes, cursos, usuarios), **docente** (crea cursos, módulos, tareas/"retos", foros, califica entregas) y **padre/tutor** (consume contenido y **entrega tareas en nombre de su hijo**). Existe un quinto rol, `estudiante`, contemplado en el modelo de permisos pero **sin flujo de login propio activo** — hoy el estudiante es representado por su padre/tutor en el sistema.

### 1.2 Tipo de aplicación

SPA (Single Page Application) de gestión académica — **no es una app de contenido de consumo pasivo**, es una herramienta operativa de trabajo diario (backoffice + portal educativo), con estética "gamificada" (paleta vibrante, componentes estilo Duolingo) pero funcionalidad de **panel de administración educativo real** (CRUD de cursos, calificación de entregas, mensajería, calendario institucional).

### 1.3 Público objetivo

- **Super-administradores**: operadores de la plataforma SaaS, gestionan altas de colegios clientes.
- **Administradores de institución**: personal directivo/administrativo de un colegio.
- **Docentes**: profesores que imparten cursos y califican.
- **Padres/tutores**: usuarios finales masivos, probablemente el perfil con menor alfabetización digital — la app debe priorizar simplicidad extrema para este rol (de ahí el estilo "Duolingo" 3D/gamificado, pensado para reducir fricción).

### 1.4 Casos de uso principales

1. Un colegio se da de alta (superadmin crea institución + admin inicial).
2. El admin de institución registra docentes (individual o CSV masivo) y crea cursos asignándolos a un docente.
3. El docente estructura el curso en **módulos**, publica **tareas ("retos")** con archivos/instrucciones, asignadas a todos o a un subconjunto de participantes.
4. El padre/tutor **entrega** la tarea (texto y/o archivos) en nombre de su hijo; el docente **califica con 1-5 estrellas + comentario**.
5. Docentes y padres interactúan en **foros** por curso (mensajería tipo chat con hilos, likes y adjuntos).
6. Se gestiona un **calendario institucional** (eventos, tareas) por curso y agregado por usuario.
7. Notificaciones in-app y (parcialmente implementado) push vía FCM.
8. Un padre puede gestionar **múltiples perfiles familiares** (varios hijos) bajo una sola cuenta, cambiando de "perfil activo" sin cerrar sesión completa.

### 1.5 Funcionalidades principales (inventario)

| Dominio | Capacidad |
|---|---|
| Autenticación | Login por teléfono+contraseña, recuperación de contraseña (correo o WhatsApp/SMS), gestión de sesiones activas, cambio de contraseña obligatorio en primer login (parcialmente roto hoy, ver §3) |
| Multi-tenant | Instituciones como entidad de primer nivel, cada una con su propio admin/docentes/cursos/usuarios |
| Cursos | CRUD de cursos, portada, participantes, módulos, importación CSV de participantes/módulos |
| Tareas ("Retos") | CRUD, asignación total/parcial, adjuntos, tipos de entrega, cierre |
| Entregas | Ciclo de vida borrador→enviada→calificada, calificación 1-5 estrellas + comentario |
| Foros | Foros por curso, hilos de mensajes, likes, adjuntos multimedia, roles con colores |
| Calendario | Vista mensual agregada (todos los cursos) y por curso, eventos con categoría |
| Eventos | CRUD completo con imagen de portada, adjunto, asociación a cursos |
| Notificaciones | In-app con conteo de no leídas, push FCM (dormido/no activado hoy) |
| Buzón | Bandeja de contacto público (landing) gestionada por superadmin |
| Perfiles familiares | Multi-perfil por cuenta padre, selección de perfil activo con reemplazo de token |
| Usuarios | CRUD con roles, suspensión/activación (soft delete), import CSV de docentes |
| Perfil propio | Edición de datos, avatar, cambio de contraseña, secciones específicas por rol |

### 1.6 Flujo general de navegación (alto nivel)

```
Landing pública ──► Login ──► Home según rol
                                 ├─ superadmin → /admin (gestión instituciones/usuarios)
                                 ├─ administrador → /admin (gestión institución/docentes/cursos)
                                 ├─ docente → /docente (mis cursos/retos/foros/calendario)
                                 └─ padre/tutor → /padre (cursos hijos/retos/entregas/foros)
```

Ver mapa de navegación completo en la §4.

### 1.7 Arquitectura del frontend actual (referencia)

- **Stack**: React 19.1 + Vite 7 + React Router DOM v7 + Zustand 5 (un solo store) + TanStack Query v5 (adopción parcial) + Firebase 12 (solo FCM, no inicializado) + Tailwind CSS v4 + `jwt-decode`.
- **Patrón**: Feature-first (`src/features/<dominio>/{pages,components,services,hooks,context}`) + capa `services/core` compartida (cliente HTTP, interceptores, gestor de sesión). Es el patrón que se recomienda **replicar conceptualmente** en Flutter (Clean Architecture + Feature-First, ver FASE 5).
- **Autenticación**: JWT Bearer simple sin refresh token, almacenado en `localStorage`, expiración controlada 100% client-side + timeout de inactividad de 30 min.
- **Autorización**: matriz de permisos por rol evaluada en el cliente (`roleMatrix.js`) — **solo para UI**, debe asumirse que el backend también valida (o debería).

### 1.8 Experiencia de usuario

Estilo dual: **Claymorfismo/Soft-UI** (sombras apiladas con reflejo interior) para tarjetas y contenedores de dashboard, y **"Duolingo 3D-press"** (sombra inferior sólida que se "hunde" al presionar) para botones, inputs y badges. Paleta vibrante de marca (morado `#8C38F0` como primario) con acentos temáticos por sección (cada módulo del sidebar tiene su propio color). Prioriza feedback inmediato, mensajes en español coloquial ("Retos" en vez de "Tareas"), y formularios con validación en tiempo real con mensajes claros.

### 1.9 Complejidad del sistema

**Alta.** ~14 features de negocio, 2 taxonomías de rol que conviven, navegación por tabs vía query param, sistema de permisos granular de 23 permisos, ciclo de vida de entidades con estados derivados en cliente (tareas "vencidas", por ejemplo), y una feature de "perfiles familiares" con lógica de sesión no trivial (cambio de token sin logout). Se detectó **deuda técnica significativa**: código muerto (guards, tabs, modales duplicados), features a medio conectar (FCM, primer-login), e inconsistencias de contrato API (`valoracion` vs `nota`) — documentadas explícitamente en cada capítulo para que el equipo Flutter decida conscientemente qué heredar y qué corregir.

---

<a name="fase-2"></a>
## FASE 2 — Análisis de diseño UI/UX

### 2.1 Estilo visual

**Híbrido deliberado de dos lenguajes**:
1. **Claymorfismo / Soft-UI** — para `Card`, `.curso-card`, stat cards del dashboard: sombras apiladas (`0 Npx Mpx rgba(0,0,0,.08-.12)`) + reflejo interior superior (`inset 0 1px 0 rgba(255,255,255,.8-.9)`) que simula un relieve suave.
2. **"Duolingo 3D-press"** — para `Button`, `Input`, `Badge`, `Toggle`: borde grueso (2-2.5px), sombra inferior **sólida** de color (no difusa) que actúa como "base 3D" y se "hunde" (offset 0 + `translateY`) al presionar.

Es también **Card-based**, **Mobile-first** en sus breakpoints (aunque el producto original es web/desktop-first en jerarquía visual del dashboard), con **Dashboard** como patrón dominante de home, y un **Design System propio** con tokens CSS custom properties (no Material Design ni un framework de terceros) — el mapeo a Flutter debe ser un **ThemeData de Material 3 fuertemente personalizado**, no un M3 "de fábrica".

### 2.2 Paleta de colores

**Colores de marca (raw)**

| Token | Hex | Uso |
|---|---|---|
| `edu-purple` | `#8C38F0` | Primario |
| `edu-pink` | `#F23D7F` | Secundario |
| `edu-cyan` | `#05C7F2` | Acento / Info |
| `edu-green` | `#41D958` | Éxito |
| `edu-yellow` | `#FCBD00` | Advertencia / XP-gamificación |
| `edu-cream` | `#FCF7ED` | Fondo suave |
| `edu-dark` | `#0D0D0D` | Texto principal / sidebar oscuro |
| `edu-white` | `#FFFFFF` | Fondo / superficie |

**Escalas de color (50→900)**

| Escala | 50 | 100 | 200 | 300 | 400 | 500 (base) | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Purple | `#F7F0FE` | `#EDD9FC` | `#D4ADF9` | `#B87AF5` | `#A057F2` | `#8C38F0` | `#7826D8` | `#621BB8` | `#4D1392` | `#360B6B` |
| Pink | `#FEF0F5` | `#FDD9E9` | `#FAA8CC` | `#F675AF` | `#F45194` | `#F23D7F` | `#D42B68` | `#B01B52` | — | — |
| Cyan | `#F0FBFE` | `#D4F4FD` | `#A0E8FB` | `#5DD7F8` | `#25CEF5` | `#05C7F2` | `#04AED6` | `#0392B4` | — | — |
| Green | `#F0FDF4` | `#D5F7DC` | `#A7EEB5` | `#71E287` | `#55DC6D` | `#41D958` | `#2FBD45` | `#229D35` | — | — |
| Yellow | `#FFFBEB` | `#FEF5C7` | `#FDE88A` | `#FDD64D` | `#FCC925` | `#FCBD00` | `#DFA300` | `#B88600` | — | — |
| Neutral | `#FAFAFA`(50) | `#F5F5F5`(100) | `#E8E8E8`(200) | `#D4D4D4`(300) | `#A3A3A3`(400) | `#737373`(500) | `#525252`(600) | `#404040`(700) | `#262626`(800) | `#171717`(900) |

Neutral incluye además `0`=`#FFFFFF` y `150`=`#EFEFEF`.

**Tokens semánticos**

| Rol | Base | Hover | Light (bg) |
|---|---|---|---|
| Primary | `#8C38F0` | `#7826D8` | `#F7F0FE` |
| Secondary | `#F23D7F` | `#D42B68` | `#FEF0F5` |
| Accent/Info | `#05C7F2` | `#04AED6` | `#F0FBFE` |
| Success | `#41D958` | `#2FBD45` | `#F0FDF4` |
| Warning | `#FCBD00` | `#DFA300` | `#FFFBEB` |
| Error | `#EF4444` | `#DC2626` | `#FEF2F2` (independiente de la escala de marca) |

**Fondos/Superficies**: `background #FFFFFF`, `bg-soft #FCF7ED` (crema), `bg-muted #FAFAFA`, `surface #FFFFFF`, `surface-2 #FAFAFA`, `surface-3 #F5F5F5`.

**Texto**: primario `#0D0D0D`, muted `#737373`, subtle `#A3A3A3`, inverso `#FFFFFF`.

**Bordes**: normal `#E8E8E8`, fuerte `#D4D4D4`, foco `#A057F2`.

**Sidebar (oscuro)**: `bg #0D0D0D`, texto `rgba(255,255,255,.8)`, activo `#8C38F0`.

**Color por sección** (usado para acentuar el sidebar-item/tab activo según el módulo — mapear a `ColorScheme` dinámico por feature en Flutter):

| Sección | Color |
|---|---|
| Inicio | `#8C38F0` (morado) |
| Cursos | `#05C7F2` (cian) |
| Tareas/Retos | `#41D958` (verde) |
| Foros | `#F23D7F` (rosa) |
| Calendario | `#FCBD00` (amarillo) |

**⚠️ Inconsistencias detectadas a resolver antes de portar**: `LoadingScreen.jsx` y `CalendarWidget.jsx` usan azules hardcoded (`#0C6AC4`, `#1D4ED8`, `#2196F3`) ajenos a la paleta `edu-*` — probable resto de una iteración de branding anterior. Recomendación: unificar a `edu-purple`/`edu-cyan` en Flutter, no portar el azul suelto.

### 2.3 Tipografía

- **Cuerpo de texto**: **Inter** (variable, 100-900, incluye itálica) — es la fuente realmente renderizada (`fontFamily.sans` con prioridad en Tailwind), no DM Sans (que está cargada pero como fallback secundario).
- **Encabezados/Display**: **Poppins** (400/500/600/700/800).
- Fallback system: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **En Flutter**: usar `google_fonts` o assets locales con `Inter` (cuerpo, `TextTheme.body*`) y `Poppins` (`TextTheme.headline*`/`display*`), replicando pesos 400/500/600/700/800.

**Escala de tamaños** (rem → aproximar a `sp` 1:1 con base 16):

| Token | px | Uso sugerido M3 |
|---|---|---|
| `2xs` | 10 | overline/labelSmall |
| `xs` | 12 | labelMedium |
| `sm` | 14 | bodySmall |
| `base/md` | 16 | bodyMedium |
| `lg` | 18 | bodyLarge |
| `xl` | 20 | titleLarge |
| `2xl` | 24 | headlineSmall |
| `3xl` | 30 | headlineMedium |
| `4xl` | 36 | headlineLarge |
| `5xl` | 48 | displaySmall |
| `6xl` | 60 | displayMedium |
| `7xl` | 72 | displayLarge |

**Pesos**: 100(thin)…900(black), uso principal 400/500/600/700/800. **Line-heights**: tight 1.15, snug 1.3, normal 1.5, relaxed 1.65. **Letter-spacing**: de `-0.045em` (tighter, títulos grandes) a `0.12em` (widest, overlines).

### 2.4 Espaciados, padding, márgenes

Escala base 4px en rem: `1(4px) 2(8px) 3(12px) 4(16px) 5(20px) 6(24px) 7(28px) 8(32px) 10(40px) 12(48px) 14(56px) 16(64px) 20(80px) 24(96px) 32(128px)`. Mapear directo a un `Spacing` de constantes Dart (`AppSpacing.xs/sm/md/lg/xl` = 4/8/16/24/32).

### 2.5 Border-radius

| Token | px | Uso |
|---|---|---|
| xs | 4 | chips pequeños |
| sm | 8 | inputs compactos, iconButtons |
| md | 12 | inputs, botones pequeños |
| lg | 16 | botones estándar, inputs Duolingo |
| xl | 24 | Cards |
| 2xl | 32 | Cards grandes, banners |
| 3xl | 40 | Heros |
| full | 9999 | pills, avatares, badges |

### 2.6 Sombras y elevaciones

**Genéricas**: `xs 0 1px 2px/.05` → `2xl 0 40px 80px/.18` (6 niveles).
**De marca (coloreadas)**: brand/primary/secondary/accent/success — sombra difusa tintada del color del componente (`0 4px 16-20px rgba(color, .22-.30)`).
**De componente**: `card` (doble capa sutil), `card-hover` (difusa + anillo de 1.5px del color primario), `modal` (triple capa, hasta 64px de blur), `dropdown`.
**Focus rings**: anillo de 3px, color según contexto (primary/error/success).
**Botones 3D** (offset sólido, no blur): `btn-primary 0 5px 0 #621BB8`, `btn-success 0 5px 0 #229D35`, `btn-danger 0 5px 0 #B91C1C`, `btn-warning 0 5px 0 #B88600` — **en Flutter**: `Container` con `List<BoxShadow>` fija (sin blur, offset vertical puro) para simular el "borde 3D", y en el `onTapDown`/`onTapUp` animar `translateY` + reducir la sombra a 0 para el efecto "press".
**Claymorfismo**: sombras de 2-3 capas + `inset` de reflejo — Flutter no soporta `inset` nativo en `BoxShadow`; simular con un `Container` decorado + un `Positioned` interior con gradiente blanco translúcido en el borde superior, o usar el paquete `flutter_inset_box_shadow`.

### 2.7 Iconografía

**Lucide** (`lucide-react`, usada en 59 archivos) es la única librería de iconos. Equivalente Flutter: paquete **`lucide_icons_flutter`** (o `lucide_icons` en pub.dev) para mapeo 1:1 de nombres, o Material Symbols Outlined como alternativa con ajuste de stroke-width (~1.5-2.5, 24×24).

### 2.8 Animaciones y transiciones

Curvas/duraciones reutilizadas en toda la web (todo CSS puro — **no hay Framer Motion realmente en uso**, pese a estar instalado):

| Patrón | Duración | Curva CSS | Curva Flutter equivalente |
|---|---|---|---|
| Entrada fade+scale | 0.2s | `ease` | `Curves.easeOut` |
| Overshoot/rebote elástico | 0.3-0.55s | `cubic-bezier(0.34,1.56,0.64,1)` | `Cubic(0.34,1.56,0.64,1)` custom |
| Micro hover/press | 90-120ms | `ease` | `Curves.easeInOut` |
| Spinner | 0.7-0.8s | `linear infinite` | `Curves.linear` + loop |
| Shimmer skeleton | 1.4s | `ease-in-out infinite` | `shimmer` package |
| Shake (error) | 0.45s | `cubic-bezier(0.36,.07,.19,.97)` | `Cubic(0.36,0.07,0.19,0.97)` |
| Bottom sheet (modal móvil) | 0.3s | overshoot | `Curves.easeOutBack`/`Cubic` custom |

### 2.9 Microinteracciones destacadas a replicar

- Botones: `translateY(-1px)` en hover, `translateY(+4px)` + sombra a 0 en press ("hundimiento" 3D).
- Badge de entrada: bounce (scale .6→1.15→.95→1).
- Toggle: pulgar con `cubic-bezier` elástico 250ms.
- Input con error: shake horizontal.
- Input con éxito: check-pop animado.
- Toast: slide-in desde la derecha con leve overshoot, barra de progreso de auto-dismiss.
- Modal en móvil: bottom-sheet con "handle" (asa de arrastre) y overshoot al abrir.

### 2.10 Jerarquía visual, consistencia y grid

- Grids helper: `grid-auto` (auto-fill cards ≥260px), `grid-stats` (2 cols móvil → 4 cols desktop), `layout-split` (1 col móvil → 1.6-1.7fr/1fr desktop) — en Flutter, usar `GridView`/`Wrap` responsivo + `LayoutBuilder` con breakpoints (ver FASE 7).
- Jerarquía tipográfica consistente: Poppins Bold para títulos de sección, Inter Regular/Medium para cuerpo, Inter SemiBold para labels/badges.
- Z-index (escala declarada, con deriva real documentada en código — para Flutter definir una escala limpia): base(0) < navbar/sidebar(10-20) < dropdown(50-150) < modal(100-300) < toast(máximo, siempre visible).

### 2.11 Responsive / breakpoints

Escala oficial (comentario explícito en el CSS fuente): **480 · 768 · 1024 · 1280 · 1440+**. Ver desarrollo completo en FASE 7.

### 2.12 Sistema de componentes / Design tokens

El proyecto **sí tiene un Design System propio y maduro** (tokens CSS + biblioteca de componentes en `src/components/ui/`), pero **no usa Material Design ni ningún UI kit de terceros** — es 100% custom. Para Flutter esto se traduce en: **no adoptar el Material 3 "de fábrica"**, sino construir un `ThemeData` completamente personalizado (colores, tipografía, shapes, elevaciones) que replique estos tokens, y una carpeta `lib/core/design_system/` con los widgets base equivalentes a `src/components/ui/*` (ver FASE 6).

**Hallazgo transversal importante**: existen **dos sistemas de formulario paralelos** en el CSS (`.input`/Duolingo pesado vs `.form-input`/genérico simple) — solo el primero está en uso real por los componentes exportados. Portar únicamente el estilo Duolingo como `InputDecorationTheme` de Flutter.

---

<a name="fase-3"></a>
## FASE 3 — Análisis completo de cada pantalla

> Convención de esta sección: cada pantalla indica **Rol(es)**, **Ruta web equivalente**, **Objetivo**, **Datos**, **Acciones/CRUD**, **Componentes Flutter recomendados**, **Estados**, **Validaciones/Reglas de negocio**. Las pantallas marcadas **[LEGACY — no portar]** son código muerto en la web actual (no alcanzable desde ninguna ruta activa) documentado solo por completitud histórica.

### 3.1 Autenticación

#### 3.1.1 Landing pública
- **Rol**: público (sin sesión). **Ruta**: `/`.
- **Objetivo**: página de marketing con formulario de contacto que alimenta el Buzón.
- **Widgets Flutter**: `Scaffold` con `CustomScrollView`, secciones hero/pilares/testimonios/contacto, `TextButton`/`ElevatedButton` a Login.
- Fuera del alcance de la app Android nativa salvo que se decida incluir una landing embebida — **recomendación**: no portar 1:1 (2051 líneas de CSS de marketing), la app Android debería abrir directo en Login/Splash.

#### 3.1.2 Login
- **Rol**: público. **Ruta**: `/login`.
- **Objetivo**: autenticar por teléfono (10 dígitos, prefijo fijo `+57`) + contraseña (mín. 6).
- **Datos**: banner de "sesión expirada" si `?expired=1`; checkbox "Recordarme" (⚠️ sin efecto funcional en la web, decidir si se implementa de verdad en Flutter).
- **Acciones**: submit login, "¿Olvidaste tu contraseña?" → Forgot Password, "Volver al inicio" → Landing.
- **Widgets Flutter**: `TextFormField` con prefijo fijo "+57" no editable, `TextFormField` password con toggle visibility (`Eye`/`EyeOff`), `ElevatedButton` con estado `loading`, `Banner`/`MaterialBanner` dismissible para sesión expirada.
- **Validaciones**: teléfono regex `^\d{10}$`; password ≥6 caracteres.
- **Reglas de negocio**: tras login exitoso con `primerInicioSesion:true` → debería ir a First Login Wizard (**⚠️ en la web esta ruta no existe, es un bug — en Flutter SÍ debe implementarse la ruta**, ver 3.1.4); si no, redirige al home según rol (`ROLE_HOME`); si el rol no matchea ninguna ruta protegida original, cae al `from` de la navegación previa.
- **Estados**: loading (botón deshabilitado + spinner), error (mensaje "Teléfono o contraseña incorrectos"), success (toast de bienvenida + navegación).

#### 3.1.3 Recuperar contraseña
- **Ruta**: `/forgot-password`.
- **Objetivo**: solicitar código de recuperación por **correo** o **WhatsApp/teléfono** (toggle).
- **Datos/Acciones**: toggle método, input según método, botón enviar; tras éxito, pasa a estado "enviado" con botón "Ingresar código" → Reset Password.
- **Validaciones**: email regex estándar; teléfono `^\+?\d{7,15}$`.
- **Widgets Flutter**: `SegmentedButton` para método, `AnimatedSwitcher` entre formulario y estado de éxito.

#### 3.1.4 Reset password / Wizard primer login
- **Ruta**: `/reset-password` (recibe `correo|telefono, method` por navegación).
- **Objetivo**: introducir código (4-8 dígitos) + nueva contraseña + confirmación.
- **Estados**: éxito → pantalla de confirmación + botón "Ir a iniciar sesión".
- **Wizard de primer login** (3 pasos, **⚠️ hoy desconectado en la web — implementar completo y funcional en Flutter**):
  1. Selección de foto (avatares predeterminados o subida propia).
  2. Datos personales (nombre, apellido, correo, nueva contraseña con medidor de fuerza).
  3. Confirmación + redirect automático al home.
  - **Widgets Flutter**: `Stepper` de Material o PageView custom con indicador de pasos, `LinearProgressIndicator` como medidor de fuerza de contraseña, bloqueo de "atrás" del sistema mientras el wizard esté incompleto (`PopScope`/`WillPopScope`).

#### 3.1.5 Sesiones activas
- **Ruta**: `/sesiones` (universal, todos los roles).
- **Objetivo**: listar últimas sesiones (dispositivo, IP, ciudad, fechas), paginado de 8 en 8.
- **Widgets Flutter**: `ListView.builder` con `SessionCard` (icono según tipo de dispositivo detectado del user-agent), primera fila de la primera página marcada "ACTUAL" (heurística, no hay flag real del backend).
- **Nota**: no hay endpoint de revocar sesión — solo lectura.

### 3.2 Dashboards (Home por rol)

#### 3.2.1 Superadmin Dashboard
- **Ruta**: `/admin` (rol superadmin). **Objetivo**: vista de control global.
- **Datos**: banner con gradiente; 4 stat cards (Instituciones activas, Usuarios totales, Administradores, Docentes registrados); 4 quick actions; **Buzón embebido** (mensajes recientes con marcar-leído inline); lista de instituciones recientes.
- **Widgets Flutter**: `GridView` de `StatCard` (2×2 en móvil, 4×1 en tablet+), `ListTile` para buzón con `Badge` "Nuevo", `Card` de institución con avatar/nombre.
- **Estados**: loading (skeleton), empty (sin instituciones).

#### 3.2.2 Admin (institución) Dashboard
- **Ruta**: `/admin` (rol administrador). **Datos**: banner con nombre institución; 4 stat cards (Cursos activos, Docentes asignados, Eventos hoy, Notificaciones nuevas); 4 quick actions; lista de cursos recientes; eventos de hoy.

#### 3.2.3 Docente Home
- **Ruta**: `/docente`. **Datos**: saludo dinámico por hora del día; chips resumen; 4 stat cards (Mis cursos, Estudiantes, Retos activos, Eventos hoy); grid de `CursoCard` compactas; lista de retos activos; lista de eventos de hoy.
- **Acciones rápidas**: Crear curso, Nuevo reto, Ver calendario.
- **Regla de negocio**: total de estudiantes se calcula sumando participantes de cada curso en cliente (no viene agregado del backend) — replicar el cálculo o (mejor) pedir al backend que lo agregue.

#### 3.2.4 Padre Home
- **Ruta**: `/padre`. **Datos**: banner "Padre/Tutor"; 4 stat cards (Cursos activos, Eventos hoy, **Notificaciones y Entregas pendientes son placeholders "—" sin datos reales** ⚠️ — decidir si se conectan de verdad en Flutter); grid de cursos de los hijos; eventos de hoy.
- **Estado vacío**: "Aún no hay cursos asignados".

### 3.3 Gestión institucional (superadmin/admin)

#### 3.3.1 Instituciones (superadmin)
- **Ruta**: `/instituciones`. **Objetivo**: CRUD global de instituciones (multi-tenant).
- **Datos**: tabla (Institución, NIT/Código, Contacto, Dirección, Acciones).
- **Acciones**: buscar (client-side), **crear institución + admin inicial en un solo formulario** (nota UI: "la contraseña inicial del admin será su cédula"), editar (solo datos institución, no admin/NIT), ver detalle (con datos del admin vía fetch adicional).
- **Widgets Flutter**: `DataTable`/`ListView` con filas expandibles en móvil, `Stepper`/formulario de 2 secciones para crear (Institución + Admin).

#### 3.3.2 Mi institución (admin, solo lectura)
- **Ruta**: `/institucion`. **Datos**: 4 stat cards (2 de ellas hardcoded en la web: Estudiantes "—", Administradores "1" ⚠️), card info institucional, card "tu cuenta", card "estado del sistema" (Estado/Plan **hardcoded "Activo"/"Profesional"** ⚠️ — no hay sistema de planes real). **Sin acciones de edición** desde esta pantalla.

#### 3.3.3 Docentes (admin)
- **Ruta**: `/docentes`. **Objetivo**: CRUD de docentes de la institución.
- **Datos**: tabla (avatar+nombre+cédula, correo, teléfono, estado).
- **Acciones**: búsqueda (debounce 350ms), crear individual (nombre/apellido/cédula/teléfono/correo, nota "recibirá credenciales por correo"), **importar CSV** (drag-drop propio, distinto del componente `CsvUploadModal` compartido — unificar en Flutter), paginación 15/página.
- **Widgets Flutter**: `ListView` con `Dismissible`/acciones, `FilePicker` para CSV, panel de resultado con contadores éxito/fallo + lista de errores.

#### 3.3.4 Usuarios (superadmin/admin)
- **Ruta**: `/usuarios`. **Objetivo**: CRUD global de usuarios/roles.
- **Datos**: tabla (Usuario+último acceso, Contacto, Cédula, Rol con badge de color, Estado, Acciones).
- **Acciones**: crear (rol condicionado: superadmin solo visible si el creador es superadmin; institución obligatoria — dropdown si superadmin, autoasignada si admin), editar, ver detalle, **suspender** (soft-delete real vía `usersDelete`), **activar** (revertir suspensión).
- **Reglas de negocio**: cédula 6-10 dígitos numéricos; teléfono exactamente 10 dígitos (sin +57); contraseña inicial autogenerada `"Cc" + cédula` (mostrada tras crear); mapeo de rol UI↔API (`"padre/tutor"` ↔ `"padre"`).
- **Manejo de errores**: errores de validación del backend (`err.validationErrors[]`) se mapean campo a campo — replicar en Flutter mostrando errores inline por campo desde la respuesta 400/422.

### 3.4 Cursos (LMS core)

#### 3.4.1 Lista de cursos
- **Ruta**: `/cursos` (roles: superadmin, administrador, docente).
- **Objetivo**: listar/gestionar cursos — docente ve "mis cursos", admin ve todos con selector de docente.
- **Datos**: tabla (portada+nombre, docente, participantes, estado, acciones).
- **Acciones/CRUD**: crear (nombre*, descripción, docente* [solo si no-docente], imagen portada), editar, **archivar** (soft-delete, no hay reactivar en UI), ver/gestionar participantes (panel con agregar individual y eliminar), agregar participante individual (nombre/apellido/cédula/teléfono, **contraseña=cédula**).
- **Widgets Flutter**: `GridView`/`ListView` de `CourseListTile`, `BottomSheet`/`Dialog` para cada modal, `ImagePicker` para portada.
- **Integración de búsqueda global**: se registra en un buscador global de la app — en Flutter, si se implementa búsqueda global, replicar vía un `SearchDelegate` agregador.

#### 3.4.2 Hub de curso (contenedor con tabs)
- **Ruta**: `/cursos/:id?tab=...` (todos los roles, contenido según permiso).
- **Objetivo**: shell de un curso con 5 tabs condicionados por permiso: **Módulos** (siempre), **Tareas**, **Calendario**, **Foros**, **Participantes** (oculto para padre).
- **Navegación de tabs**: en la web es un query param (`?tab=`); **recomendación Flutter**: usar `TabBar`/`TabBarView` local (estado en memoria, no necesariamente en la URL/route, salvo que se use deep-linking con `go_router` + query params replicando el patrón).
- **Widgets Flutter**: `Scaffold` con `AppBar` + `TabBar`, `TabBarView` con 5 vistas, botón volver.

#### 3.4.3 Tab Módulos
- **Objetivo**: gestionar secciones temáticas del curso (contenedor de tareas).
- **Datos**: lista con numeración, título, descripción truncada.
- **Acciones** (`canManage`=docente/admin): crear/editar (título*, descripción), eliminar (confirm nativo), **importar CSV parseado 100% client-side** (no hay endpoint masivo backend — en Flutter, parsear el CSV localmente e iterar llamadas `POST /modulos`).
- **Widgets Flutter**: `ReorderableListView` (si se decide soportar reordenar, no existe hoy pero es una mejora natural), `ExpansionTile` para detalle.
- **Estados**: loading (skeleton), empty (mensaje distinto por rol).

#### 3.4.4 Tab Tareas ("Retos")
- **Objetivo**: CRUD de tareas del curso + puerta de entrada a Entregas/Calificación.
- **Datos**: tarjeta por tarea (ícono rojo si vencida), título, fecha entrega, badge de módulo.
- **Formulario crear/editar**: título*, descripción, módulo (opcional), fecha entrega (`datetime`), **tipo de entrega** (archivo/texto/enlace/multimedia/presencial/grupal), **asignación** (todos vs seleccionados — mínimo 1 si "seleccionados"), archivos adjuntos multi, enlaces de referencia dinámicos.
- **Vista detalle**: badges (Vencida/Activa, Para todos/Seleccionados), bloques de info, lista de participantes asignados, archivos, enlaces. Footer condicionado por rol: docente/admin → "Ver entregas"; padre → "Ver mi entrega" (mismo flujo, texto distinto).
- **Regla de negocio central**: "vencida" se calcula en cliente (`fechaEntrega < ahora`), el backend nunca lo persiste así.
- **Widgets Flutter**: `Form` con `TextFormField`/`DropdownButtonFormField`/`DateTimePicker`, `ChoiceChip` para tipo de entrega, `CheckboxListTile` multi-select para participantes, `FilePicker` multi-archivo.

#### 3.4.5 Sub-tab Entregas (dentro del modal de Tareas)
- **Objetivo**: listar entregas de una tarea — docente ve todas + stats, padre ve solo la propia.
- **Datos**: avatar+nombre (oculto para padre), preview de respuesta, **valoración en estrellas (1-5)**, comentario docente, badge de estado (borrador/enviada/tarde/calificada).
- **Acciones**: docente → Calificar/Editar calificación; padre con borrador → Enviar (PATCH transición); padre sin entrega activa → Nueva/Realizar entrega.
- **Regla de negocio**: solo una entrega "activa" (no enviada/calificada) por tarea vía UI.

#### 3.4.6 Sub-tab Calificar entrega
- **Objetivo**: formulario docente de calificación.
- **Formulario**: `StarPicker` de **1 a 5 estrellas** (sin 0, sin decimales, sin nota 0-100 pese a que el modelo trae `puntajeMaximo`), comentario opcional.
- **Validación**: valoración > 0 requerida.
- **Widgets Flutter**: `RatingBar` (paquete `flutter_rating_bar`) 1-5 estrellas enteras.

#### 3.4.7 Sub-tab Realizar entrega
- **Objetivo**: el padre presenta/actualiza su entrega.
- **Formulario**: texto de respuesta (opcional en sí, pero ver validación), hasta 5 archivos (imagen/PDF/Word/Excel/PPT).
- **Dos acciones**: "Guardar borrador" (sin validación de contenido mínimo) vs "Enviar entrega" (requiere texto O ≥1 archivo; internamente crea como borrador y luego transiciona a enviada con una segunda llamada).
- **⚠️ Bug detectado en la web**: el callback de éxito no siempre está conectado tras guardar — **en Flutter asegurar que el flujo cierre el diálogo y refresque la lista de entregas siempre**.

#### 3.4.8 Tab Foros (dentro de curso)
- **Objetivo**: listar foros del curso; al tocar uno, navega a la pantalla completa de Foro (no es un modal).
- **Datos**: tarjetas con ícono (candado si cerrado), título, badge, descripción, conteo de mensajes.
- **Acciones**: crear foro (`canCreate`): título (mín 5/máx 200 con contador en vivo), descripción (mín 10/máx 2000), adjuntos (imagen/video/PDF, máx 5). **Regla de negocio**: los foros creados desde el curso son siempre privados (`publico:false`).

#### 3.4.9 Tab Participantes
- **Objetivo**: ver/gestionar usuarios inscritos (oculto para padre).
- **Datos**: avatar, nombre, etiqueta/rol, badge "Docente" (no removible).
- **Acciones**: agregar individual (mismo patrón contraseña=cédula), **importar CSV** (aquí SÍ hay endpoint masivo real en backend, `POST /cursos/:id/usuarios-masivo` — parseo server-side, a diferencia de Módulos), eliminar (excepto docente titular).

#### 3.4.10 Tab Calendario (dentro de curso)
- **Objetivo**: eventos del curso vía widget de calendario mensual.
- **Categorías**: `escuela_padres`, `tarea`, `institucional` (default).
- **Formulario**: título*, descripción, fecha inicio* (fecha fin default = fecha inicio si se omite), hora, categoría, ubicación.
- **Permiso**: mismo permiso que gestiona Tareas controla también el Calendario del curso.

### 3.5 Calendario global (agregado, fuera del curso)

- **Ruta**: `/calendario` (docente/admin/padre). **Objetivo**: vista agregada de tareas+eventos de **todos** los cursos del usuario.
- **Datos**: `CalendarWidget` con estadísticas (total tareas, total eventos, vencidas, próximas).
- **Acciones (`canManage`=docente/admin)**: crear evento (requiere seleccionar curso de una lista), editar, eliminar.
- **Padre**: modo solo lectura (`canManage=false`).
- **Widgets Flutter**: `table_calendar` package o calendario custom con `GridView` 7 columnas, `Badge`/dots por día con hasta 3 + contador.

### 3.6 Eventos (gestión completa, distinta del modal simple del calendario)

- **Ruta**: `/eventos` (docente/admin). **Objetivo**: CRUD con multimedia completo (a diferencia del modal simple JSON del calendario, este usa `FormData` con imagen/adjunto).
- **Formulario**: título, descripción, fecha inicio/fin (`datetime-local`), hora, ubicación, categoría, **imagen de portada** (file), **archivo adjunto** (file), **selección de cursos asociados** (multi-checkbox).
- **⚠️ Nota**: toggle lista/calendario existe en imports pero la vista de calendario-grid no está implementada — decidir en Flutter si se completa esta feature.

### 3.7 Familia (rol padre/tutor)

#### 3.7.1 Perfiles familiares
- **Ruta**: `/familia/perfiles`. **Objetivo**: gestionar hasta 5 perfiles secundarios (hijos) + perfil titular, y **cambiar el perfil activo**.
- **Acciones**: crear/editar/eliminar perfil (nombre + avatar, 11 avatares locales + backend), **seleccionar perfil activo** (`perfilesSeleccionar` devuelve un **nuevo JWT** que reemplaza la sesión sin logout — replicar cuidadosamente en Flutter el mecanismo de "profile switching"), actualizar FCM token por perfil al cambiar.
- **Regla de negocio**: máximo 5 perfiles secundarios; al eliminar el perfil activo, fallback automático al titular.
- **Widgets Flutter**: `GridView` de `ProfileCard` circular, `AvatarPicker` compartido crear/editar.

#### 3.7.2 Cursos de mis hijos
- **Ruta**: `/familia/cursos`. Grid de cursos con buscador local (nombre/docente).

#### 3.7.3 Retos (tareas, solo lectura)
- **Ruta**: `/familia/tareas`. Lista con estado (abierta/cerrada/vencida), filtro, búsqueda, deep-link a Entregas con `?tareaId=`.

#### 3.7.4 Entregas (crear/editar/enviar)
- **Ruta**: `/familia/entregas`. Cards expandibles por tarea con: estado, rating de estrellas + comentario docente, texto respuesta, archivos. Deep-link `?tareaId=` reordena la lista. **Regla**: `canEdit` solo si no hay entrega o está en borrador; `canSend` solo si borrador.

#### 3.7.5 Foros (rol padre) **[revisar duplicidad]**
- **Ruta**: `/familia/foros`. **⚠️ Es una implementación paralela y más simple** a la vista canónica de foros (ver 3.8) — navegación interna sin router (estado local, no rutas anidadas). **Recomendación fuerte para Flutter: usar la vista canónica de foros (3.8.3) para TODOS los roles, incluido padre, y no replicar esta versión duplicada.**

#### 3.7.6 Calendario (rol padre)
- **Ruta**: `/familia/calendario`. Mismo patrón agregado, sin capacidad de gestión. **⚠️ Nota**: en la web el link del sidebar de padre en realidad apunta a `/calendario`, no a esta ruta — posible redundancia a resolver (decidir una sola pantalla de calendario para padre en Flutter).

### 3.8 Foros (sistema global)

#### 3.8.1 Gestión de foros por curso (legacy, ver 3.4.8)
Cubierta dentro del hub de curso.

#### 3.8.2 Detalle de foro **[LEGACY — no portar]**
`ForoDetallePage` (ruta antigua `/foros/:id`, hoy redirige a la canónica) — implementación standalone sin TanStack Query. No portar, usar 3.8.3.

#### 3.8.3 Vista canónica de Foro — **ForumPage** (referencia de diseño)
- **Ruta**: `/curso/:cursoId/foro/:foroId` — **"todos los roles usan esta misma página"** (cita textual del código fuente). Esta es la pantalla de referencia a portar 1:1.
- **Layout**: 3 columnas tipo Discord/Slack — sidebar izquierdo (lista de foros del curso), centro (mensajes + compositor), panel derecho (actividad/estadísticas). Responsive: colapsa sidebar en móvil con overlay, oculta panel de actividad en tablet.
- **Datos**: mensajes con hilos anidados (respuestas), likes, adjuntos con preview según tipo; **polling cada 60s** (simula tiempo real sin WebSockets — en Flutter, replicar con polling similar o mejorar con WebSocket/Socket.io real si el backend lo soporta).
- **Acciones**: enviar mensaje/respuesta (con adjuntos, máx 5 archivos), like, eliminar mensaje propio (o de cualquiera si `MANAGE_FORO`) con confirmación de 2 pasos, editar mensaje propio inline, alternar estado abierto/cerrado del foro (`canManageForum`), crear nuevo foro desde el sidebar.
- **RoleBadge por autor**: colores distintos — docente morado, estudiante azul, padre/tutor verde, admin ámbar, superadmin rojo; borde lateral de color si el autor es staff.
- **Panel de actividad**: estadísticas calculadas en cliente (mensajes, respuestas, participantes, archivos), lista de participantes únicos (avatares, hasta 8 + "+N"), archivos recientes (últimos 8).
- **Validación crear foro**: título 5-200 caracteres, descripción 10-2000, contador de caracteres en vivo.
- **Widgets Flutter**: `Scaffold` con `Drawer`/`NavigationRail` para sidebar en tablet+, `ListView` de mensajes con `ExpansionTile` para hilos, `TextField` auto-resize con Enter=enviar/Shift+Enter=nueva línea (en Android, considerar botón de enviar explícito en vez de atajo de teclado), pills de adjuntos removibles.

### 3.9 Buzón (mensajería pública, superadmin/admin)

- **Ruta**: `/buzon`. **Objetivo**: gestionar mensajes de contacto público (formulario anónimo tipo landing, no vinculado a un usuario del sistema).
- **Datos**: nombre, correo, teléfono, institución (texto libre), mensaje, fecha, leído/no leído.
- **Acciones**: filtro por pestañas (Todos/Sin leer/Leídos con contadores), abrir detalle, marcar como leído.
- **⚠️ No tiene entrada de menú en la web** (solo accesible por URL directa) — considerar si merece entrada de nav en Flutter.

### 3.10 Notificaciones

- **Ruta**: `/notificaciones` (universal). **Objetivo**: bandeja in-app.
- **Datos**: badge de conteo no leídas (campana, "9+" si >9), lista paginada (15/página), tipo (info/éxito/warning/error/bienvenida), fecha relativa.
- **Acciones**: filtro por pestaña, marcar individual/todas como leídas, eliminar.
- **Estados**: leídas con opacidad reducida.

### 3.11 Perfil propio

- **Ruta**: `/perfil` (universal). **Objetivo**: ver/editar datos propios + sección específica por rol.
- **Datos comunes**: avatar grande + cambio, nombre, badge rol, badge estado, correo/teléfono/institución, "miembro desde".
- **Sección por rol**: padre → "Perfiles de mis hijos" + "Cursos de mis hijos"; docente → "Mis cursos"; estudiante → "Información académica"; admin/superadmin → "Permisos y acceso" (chips).
- **Seguridad**: modal cambiar contraseña (actual + nueva + confirmar).

### 3.12 Retos/Tareas (vista global de gestión, docente)

- **Ruta**: `/tareas` (docente). **Objetivo**: gestión global de tareas across todos los cursos del docente (creación/cierre/eliminación; la calificación se hace en Entregas).
- **Datos**: `TareaCard` con badges de estado y tipo de asignación, curso, módulo, vencimiento, conteo adjuntos.
- **Formulario de creación**: idéntico al del hub de curso (3.4.4) pero con selector de curso explícito (carga dinámica de módulos y participantes al elegir curso).
- **Acción "Cerrar"**: usa `confirm()` nativo del navegador — en Flutter, usar `AlertDialog` de confirmación.
- **Integración con búsqueda global**.

### 3.13 Entregas — vista de calificación (docente, vista global)

- **Ruta**: `/tareas/:id/entregas`. **Objetivo**: ver y calificar entregas de una tarea específica.
- **Datos**: 4 stat cards (Total, Enviadas, Tarde, Calificadas), lista expandible por padre/tutor.
- **Enriquecimiento**: fetch adicional deduplicado de cada padre único (`usersGetById`) para mostrar nombre completo — patrón N+1 a evitar en Flutter si el backend puede poblar la relación directamente.
- **Validación calificación**: nota 0-100 en este flujo (⚠️ nota: esta vista usa una escala 0-100 mientras que Calificar Entrega dentro del hub de curso usa 1-5 estrellas — **inconsistencia de UX a resolver/unificar en Flutter**, decidir una sola escala de calificación en todo el sistema).

---

<a name="fase-4"></a>
## FASE 4 — Mapa de navegación

### 4.1 Diagrama completo

```
Splash / Chequeo de sesión
  │
  ├─ Sin token / expirado ──► Landing (opcional en Flutter: ir directo a Login)
  │                              │
  │                              └─ Login
  │                                  ├─ credenciales OK + primerInicioSesion:true
  │                                  │      └─► Wizard Primer Login (3 pasos) ──► Home según rol
  │                                  ├─ credenciales OK normal ──► Home según rol
  │                                  ├─ ¿Olvidaste tu contraseña? ──► Forgot Password
  │                                  │      └─ enviado ──► Reset Password ──► Login
  │                                  └─ Volver al inicio ──► Landing
  │
  └─ Token válido ──► Shell principal (Sidebar/Drawer + AppBar + contenido)
        │
        ├─ HOME (según rol)
        │    ├─ superadmin/administrador → /admin
        │    ├─ docente                  → /docente
        │    └─ padre/tutor              → /padre
        │
        ├─ [superadmin] Instituciones ──► Detalle institución
        ├─ [superadmin] Usuarios ──► Detalle usuario
        ├─ [administrador] Mi institución (solo lectura)
        ├─ [administrador] Docentes ──► CRUD + import CSV
        ├─ [administrador/docente] Cursos ──► Hub de curso
        │         │
        │         └─ Hub de curso (tabs)
        │              ├─ Módulos ──► Detalle módulo
        │              ├─ Tareas ──► Detalle tarea ──► Entregas ──► Calificar / Realizar entrega
        │              ├─ Calendario (del curso)
        │              ├─ Foros ──► Foro (vista canónica, 3 columnas)
        │              └─ Participantes (oculto para padre)
        │
        ├─ [docente] Retos (gestión global) ──► Entregas (calificación global)
        ├─ [docente/admin] Foros (listado por curso, redirige al canónico)
        ├─ [docente/admin] Eventos (CRUD multimedia)
        ├─ [docente/admin/padre] Calendario (agregado, global)
        ├─ [padre] Familia
        │     ├─ Perfiles (cambio de perfil activo)
        │     ├─ Cursos
        │     ├─ Retos (solo lectura)
        │     ├─ Entregas (crear/editar/enviar)
        │     ├─ Foros (usar vista canónica en Flutter)
        │     └─ Calendario
        │
        ├─ Notificaciones (universal)
        ├─ Perfil (universal)
        ├─ Sesiones activas (universal)
        └─ [superadmin/admin] Buzón

Logout (desde cualquier pantalla, sidebar/drawer o menú de perfil)
  └─► limpia token/caché ──► Login
```

### 4.2 Tabla de rutas por rol

| Ruta lógica | superadmin | administrador | docente | padre/tutor | En nav |
|---|:---:|:---:|:---:|:---:|---|
| Home | ✔ (/admin) | ✔ (/admin) | ✔ (/docente) | ✔ (/padre) | Sí |
| Instituciones | ✔ | | | | Sí |
| Mi institución | ✔ | ✔ | | | Sí (admin) |
| Usuarios | ✔ | ✔ | | | Sí |
| Docentes | ✔ | ✔ | | | Sí (admin) |
| Cursos (lista) | ✔ | ✔ | ✔ | | Sí |
| Hub de curso | ✔ | ✔ | ✔ | ✔ (vía lista propia) | No (se navega desde listas) |
| Foros (listado) | ✔ | ✔ | ✔ | | Sí (docente) |
| Foro (canónico) | ✔ | ✔ | ✔ | ✔ | No |
| Retos (gestión) | | | ✔ | | Sí ("Retos") |
| Entregas (calificación) | ✔ | ✔ | ✔ | | No |
| Eventos | ✔ | ✔ | ✔ | | No (gap de nav en la web original) |
| Calendario | ✔ | ✔ | ✔ | ✔ | Sí |
| Familia · Perfiles | | | | ✔ | Sí |
| Familia · Cursos | | | | ✔ | Sí |
| Familia · Retos | | | | ✔ | Sí ("Retos") |
| Familia · Entregas | | | | ✔ | Sí |
| Familia · Foros | | | | ✔ | Sí (usar canónico) |
| Familia · Calendario | | | | ✔ | Sí |
| Perfil | ✔ | ✔ | ✔ | ✔ | Sí (menú avatar) |
| Notificaciones | ✔ | ✔ | ✔ | ✔ | Sí |
| Buzón | ✔ | ✔ | | | No (gap de nav en la web original — recomendado añadir entrada en Flutter) |
| Sesiones | ✔ | ✔ | ✔ | ✔ | No (recomendado añadir entrada, ej. desde Perfil) |

**Nota sobre el rol `estudiante`**: existe en la matriz de permisos y en constantes de rutas de curso/foro, pero **no tiene home, ni nav, ni flujo de login propio** en la web actual. Para Flutter: decidir con producto si se activa como rol logueable real en una fase futura, o se mantiene solo como "actor representado por su padre" (recomendación actual: mantenerlo así, no construir un dashboard de estudiante en la v1 de Flutter).

### 4.3 Navegación por tabs dentro del Hub de curso

En la web, los tabs del hub (`Módulos/Tareas/Calendario/Foros/Participantes`) se controlan por **query param** `?tab=` sobre la misma ruta, no por sub-rutas. **Decisión de arquitectura recomendada para Flutter**: usar `TabBarView` con estado local (`PageStorage`/`IndexedStack`) dentro de la pantalla del Hub; si se usa `go_router` con deep-linking, opcionalmente reflejar el tab activo en un query param de la ruta (`/cursos/:id?tab=tareas`) para mantener paridad de "compartir enlace a un tab específico", aunque esto es opcional en una app móvil nativa (menor prioridad que en web).

---

<a name="fase-5"></a>
## FASE 5 — Arquitectura Flutter

### 5.1 Enfoque arquitectónico

**Clean Architecture + Feature-First**, tres capas por feature (`data / domain / presentation`), con un `core/` compartido. Esto refleja fielmente el patrón ya usado en la web (`features/<dominio>/{pages,components,services,hooks,context}`) pero con las fronteras más estrictas que exige una app nativa mantenible a largo plazo:

- **`domain`**: entidades puras (Dart classes inmutables, sin dependencias de Flutter/HTTP), casos de uso (`UseCase` con método `call()`), interfaces de repositorio (abstract).
- **`data`**: implementación de repositorios, data sources (remoto vía Dio, local vía Hive/SharedPreferences), DTOs/modelos con `fromJson`/`toJson` (via `freezed`+`json_serializable`).
- **`presentation`**: widgets, providers/notifiers de estado (Riverpod), controllers.

### 5.2 Gestión de estado — Riverpod (recomendado)

**Comparativa**:

| Opción | A favor | En contra para este proyecto |
|---|---|---|
| **Riverpod** | Compile-safe, sin `BuildContext` para leer estado, excelente para DI (reemplaza `get_it`), soporta `AsyncNotifier` que mapea 1:1 al patrón `useQuery` de TanStack Query ya usado en la web (foros), testing sencillo, code-gen opcional | Curva de aprendizaje inicial media |
| Bloc/Cubit | Muy explícito, buen boilerplate para equipos grandes con convención estricta | Boilerplate alto para un app con ~14 features y muchos CRUDs repetitivos; el manejo de combinaciones de streams (polling de foros, invalidación cruzada) es más verboso que Riverpod |
| Provider | Simple, liviano | Ya "deprecado" en favor de Riverpod por su propio autor; menos herramientas para manejo de caché/invalidación como el que hace TanStack Query en la web |

**Por qué Riverpod es la mejor opción aquí**: la web ya usa **TanStack Query** (cache + invalidación + polling) como su patrón más maduro (visto en foros). Riverpod con `AsyncNotifierProvider`/`FutureProvider` + `ref.invalidate()` es el equivalente conceptual más directo en Flutter — mismo modelo mental (queries + mutaciones + invalidación de cache), evitando reinventar un sistema de cache manual como tendría que hacerse con Bloc puro. Además Riverpod permite mezclar sin fricción estado síncrono (permisos derivados del rol, como `usePermission` en la web) con estado asíncrono (datos remotos).

**Recomendación de mecánica de invalidación**: replicar `queryKeys.js` (factory de claves) como un archivo `lib/core/network/query_keys.dart` con constantes/funciones para las claves de `ref.invalidate`, evitando strings mágicos.

### 5.3 Router — go_router

- Reemplaza a React Router v7. Soporta rutas anidadas con `ShellRoute` (equivalente al `MainLayout` con `<Outlet/>`), guards vía `redirect` (equivalente a `ProtectedRoute`/`PublicOnlyRoute`), y deep-linking.
- **Guard de autenticación**: un `redirect` global en `GoRouter` que lee el estado de un `authProvider` (Riverpod) — si no autenticado y la ruta requiere sesión, redirige a `/login`; si autenticado y la ruta es pública (login/forgot/reset), redirige al home del rol. Replica exactamente `ProtectedRoute`/`PublicOnlyRoute`/`RoleRedirect` de la web, pero **sin los guards muertos** (`RoleGuard`/`RequireRole`/`RequireAuth` no se portan — eran código no usado en la web).
- **Guard de rol por ruta**: cada `GoRoute` de sección protegida valida `allowedRoles.contains(currentRole)` en su propio `redirect`, cayendo al home del rol si no matchea (igual que `ROLE_HOME` en la web).

### 5.4 Inyección de dependencias

Riverpod actúa también como contenedor de DI (providers de repositorios/datasources), evitando añadir `get_it` como dependencia adicional salvo que el equipo ya lo use en otros proyectos por convención.

### 5.5 Repository Pattern

Cada dominio (`cursos`, `tareas`, `entregas`, `foros`, `usuarios`, etc.) expone una interfaz `XRepository` en `domain/repositories/` y una implementación `XRepositoryImpl` en `data/repositories/` que orquesta: (a) llamada HTTP vía `ApiClient` (Dio), (b) mapeo DTO→Entity, (c) opcionalmente caché local (Hive) para listados frecuentes (ej. caché de usuarios, replicando `useUserStore` de Zustand).

### 5.6 Estructura de carpetas propuesta

```
lib/
├── main.dart
├── app.dart                          # MaterialApp.router + ThemeData
├── core/
│   ├── config/
│   │   ├── env.dart                  # VITE_API_URL equivalente (--dart-define)
│   │   └── constants.dart
│   ├── theme/
│   │   ├── app_colors.dart           # tokens de la FASE 2
│   │   ├── app_typography.dart
│   │   ├── app_spacing.dart
│   │   ├── app_shadows.dart
│   │   └── app_theme.dart            # ThemeData(colorScheme, textTheme, ...)
│   ├── design_system/                # equivalente a components/ui/*
│   │   ├── buttons/edumon_button.dart
│   │   ├── inputs/edumon_text_field.dart
│   │   ├── cards/edumon_card.dart
│   │   ├── modals/app_modal.dart
│   │   ├── badges/edumon_badge.dart
│   │   ├── avatar/user_avatar.dart
│   │   ├── toast/edumon_toast.dart
│   │   ├── loading/loading_screen.dart
│   │   ├── calendar/calendar_widget.dart
│   │   └── csv/csv_upload_sheet.dart
│   ├── network/
│   │   ├── api_client.dart           # Dio + interceptors
│   │   ├── auth_interceptor.dart     # bearer token + 401 handling
│   │   ├── query_keys.dart
│   │   └── network_exceptions.dart
│   ├── security/
│   │   ├── role.dart                 # enum UserRole único y canónico
│   │   ├── permissions.dart          # enum Permission + matriz rol→permisos
│   │   └── permission_gate.dart      # widget condicional por permiso
│   ├── router/
│   │   ├── app_router.dart
│   │   └── route_guards.dart
│   ├── storage/
│   │   ├── secure_storage.dart       # flutter_secure_storage (token)
│   │   └── local_cache.dart          # Hive boxes (usuarios, etc.)
│   └── utils/
│       ├── date_formatters.dart
│       ├── phone_formatter.dart      # normalización +57
│       └── error_humanizer.dart
├── features/
│   ├── auth/
│   │   ├── data/{models,datasources,repositories}
│   │   ├── domain/{entities,repositories,usecases}
│   │   └── presentation/{screens,widgets,providers}
│   │       screens: login_screen.dart, forgot_password_screen.dart,
│   │                reset_password_screen.dart, first_login_wizard_screen.dart,
│   │                sessions_screen.dart
│   ├── dashboard/
│   │   presentation/screens: superadmin_dashboard.dart, admin_dashboard.dart,
│   │                          docente_dashboard.dart, padre_dashboard.dart
│   ├── instituciones/
│   ├── usuarios/
│   ├── docentes/
│   ├── cursos/
│   │   presentation/screens: cursos_list_screen.dart, curso_hub_screen.dart
│   │   presentation/widgets/tabs: modulos_tab.dart, tareas_tab.dart,
│   │       calendario_tab.dart, foros_tab.dart, participantes_tab.dart
│   ├── tareas/                        # gestión global de retos (docente)
│   ├── entregas/
│   ├── foros/                         # vista canónica (ForumScreen 3 columnas)
│   ├── calendario/                    # agregado global
│   ├── eventos/
│   ├── familia/
│   │   presentation/screens: perfiles_screen.dart, familia_cursos_screen.dart,
│   │       familia_tareas_screen.dart, familia_entregas_screen.dart,
│   │       (foros → reutiliza feature foros canónico)
│   ├── notificaciones/
│   ├── buzon/
│   └── perfil/
├── shared/
│   ├── widgets/                      # EmptyState, Skeleton, StatCard, SectionHeader...
│   └── models/                       # Archivo (adjunto), Pagination, etc.
└── l10n/                             # es_CO como locale principal
```

### 5.7 Mapeo Context/Zustand → Riverpod

| Web | Flutter |
|---|---|
| `AuthContext` (React Context, dos niveles user/full) | `authProvider` (`NotifierProvider`/`AsyncNotifierProvider`) — expone `user`, `isAuthenticated`, `login()`, `logout()`, `switchProfile()` |
| `CursoContext` (React Query + Context por curso) | `cursoProvider(cursoId)` (`FutureProvider.family` o `AsyncNotifierProvider.family`) + `cursoPermissionsProvider` derivado |
| `useUserStore` (Zustand + persist) | `userCacheProvider` respaldado por Hive box `users` |
| `SearchContext` (plugin de handlers) | Opcional: `searchProvider` con un `Map<String, SearchHandler>` registrable, o simplificar a un `SearchDelegate` por pantalla si no se requiere búsqueda global unificada en v1 |
| `ToastContext` | `ScaffoldMessenger` + un helper `showEdumonToast(context, message, type)`, o un `overlayProvider` si se prefiere no depender de `Scaffold` ancestro |
| `usePermission`/`roleMatrix.js` | `lib/core/security/permissions.dart` — función pura `hasPermission(Role, Permission)` consumida por providers derivados (`Provider.family`) |

---

<a name="fase-6"></a>
## FASE 6 — Componentes reutilizables

Inventario 1:1 de `src/components/ui/*` → widget Flutter equivalente:

| Componente web | Widget Flutter | Notas de comportamiento a preservar |
|---|---|---|
| `Button` (12 variantes) | `EdumonButton` (enum `EdumonButtonVariant`) | Efecto "3D press": `AnimatedContainer` que baja `translateY` y colapsa sombra a 0 en `onTapDown`, restaura en `onTapUp`/`onTapCancel`. Tamaños xs/sm/md/lg/xl. Soporta `loading` (spinner + `aria-busy` → `Semantics(busy: true)`), `leftIcon`/`rightIcon`, `fullWidth` |
| `Card` (+ EdumonBadge/Progress/Avatar/StatCard) | `EdumonCard`, `EdumonStatCard`, `ProgressBar` | Borde con gradiente animado en hover no aplica 1:1 en móvil (sin hover) — usar como estado "seleccionado"/"presionado" en su lugar |
| `Input`/`Textarea`/`Select`/`Toggle`/`Checkbox`/`Radio` | `EdumonTextField`, `EdumonDropdown`, `EdumonSwitch`, `EdumonCheckbox`, `EdumonRadio` | Estados error (shake + borde rojo), success (check-pop + borde verde), ícono izquierdo/derecho, password toggle automático |
| `Modal`/`AppModal` (compound: Header/Body/Footer) | `AppModalSheet` — usar `showModalBottomSheet` (móvil) con handle de arrastre + `showDialog` (tablet/desktop) según ancho de pantalla | Focus-trap nativo de Flutter via `FocusScope`; cierre con back button de Android debe respetar el mismo comportamiento que Escape en web |
| `Toast` / `ToastContext` | `EdumonToast` vía `OverlayEntry` o `ScaffoldMessenger.showSnackBar` custom | 4 variantes, máx 5 simultáneos, auto-dismiss configurable, barra de progreso |
| `UserAvatar` | `UserAvatarWidget` | Color determinístico por hash del nombre (paleta fija de 8), borde de color por rol, dot de estado online/offline |
| `Avatar` (genérico, distinto de UserAvatar) | `SimpleAvatar` | src/initials/fallback a logo |
| `Badge` (+ NotifBadge/XpBadge) | `EdumonBadge`, `NotifBadge`, `XpBadge` | Bounce de entrada, sombra inferior por tamaño, variantes semánticas |
| `Dropdown` (EdumonDropdown) | `EdumonMenuButton` | Navegación por teclado no aplica en móvil; sí replicar estructura de header+opciones+danger variant |
| `FileUpload` (compact/full) | `FileUploadWidget` | Modo compacto (chat/foros) vs completo (drag&drop equivalente: `file_picker` + preview) |
| `IconActionButton` | `IconActionButton` | 32×32, radius 8, hover→pressed state |
| `LoadingScreen` | `LoadingScreenWidget` | Full-screen, spinner de doble anillo |
| `CalendarWidget` | `CalendarWidget` (basado en `table_calendar` o custom) | Grid mensual, dots de categoría, modal de detalle por día |
| `CsvUploadModal` | `CsvUploadSheet` | Máquina de estados IDLE→UPLOADING→SUCCESS/ERROR, panel de resultado con contadores |
| `Footer` | No aplica en app nativa (solo si se porta la landing) | |

### 6.1 Design tokens como código

Crear `AppColors`, `AppTypography`, `AppSpacing`, `AppRadius`, `AppShadows`, `AppDurations` (constantes Dart) directamente derivados de la tabla de la FASE 2 — única fuente de verdad para todo `ThemeData` y widgets custom, evitando "colores mágicos" dispersos (que sí ocurren hoy en la web, ver hallazgos de inconsistencia).

---

<a name="fase-7"></a>
## FASE 7 — Análisis responsive

La web declara oficialmente la escala: **480 · 768 · 1024 · 1280 · 1440+**. Para Android nativo (foco de este blueprint), el rango relevante es:

| Clase de dispositivo | Ancho lógico (dp) | Layout |
|---|---|---|
| Teléfono pequeño | < 360dp | 1 columna, `Drawer` para navegación, `BottomNavigationBar` opcional para 4-5 accesos principales, listas en vez de tablas |
| Teléfono mediano | 360-410dp | Igual, con más padding horizontal (16→20dp) |
| Teléfono grande / phablet | 410-480dp | Igual, cards con 2 columnas en grids de baja densidad (ej. stat cards 2×2) |
| Tablet 7-8" | 600-840dp (`shortestSide`) | `NavigationRail` en vez de Drawer, contenido en 2 columnas (`layout-split` 1.6fr/1fr → `Row` con `Expanded(flex:...)`), modales como `Dialog` centrado en vez de bottom sheet |
| Tablet 10"+ / plegables desplegados | > 840dp | `NavigationRail` extendido o `NavigationDrawer` fijo, grids de 3-4 columnas, Hub de curso con sidebar de foro visible simultáneamente (3 columnas) |
| Plegables (fold) | `MediaQuery` + `Hinge`/`DisplayFeature` (paquete `flutter_hinge`/`dual_screen`) | Evitar contenido crítico bajo el pliegue; usar `Row` de 2 paneles cuando el dispositivo está desplegado |
| Landscape | cualquier ancho > alto | Priorizar `NavigationRail` sobre `Drawer` incluso en teléfono si el ancho lógico permite ≥600dp en landscape |

**Reglas de adaptación clave heredadas del CSS original**:
- `grid-stats`: 2 columnas en móvil, 4 en pantallas ≥1024px (equivalente Flutter: `GridView.count(crossAxisCount: width >= 840 ? 4 : 2)`).
- `layout-split`: 1 columna en móvil, split 1.6fr/1fr desde 768px (equivalente: `LayoutBuilder` + `Row`/`Column` condicional).
- Sidebar: overlay/drawer en móvil, riel de solo-iconos en tablet, expandido en desktop — en Android nativo, usar `Drawer` (móvil) y `NavigationRail` (tablet ≥600dp), sin necesidad del modo "collapsed" manual de escritorio.
- Tamaño táctil mínimo 44dp para todo elemento interactivo (WCAG 2.5.8), ya validado como requisito explícito en el CSS original — mantener como regla dura en Flutter (`minimumSize: Size(44,44)` en `ButtonStyle`).

**Recomendación de implementación**: un solo helper `lib/core/utils/responsive.dart` con breakpoints constantes (`compact <600`, `medium 600-839`, `expanded ≥840`, alineado a las *Window Size Classes* oficiales de Material 3 — más robusto que replicar literalmente los px de CSS web) y un `Breakpoint.of(context)` para consumir en cada pantalla.

---

<a name="fase-8"></a>
## FASE 8 — Estados de la aplicación

| Estado | Cuándo ocurre | Tratamiento recomendado |
|---|---|---|
| **Loading** | Fetch inicial de cualquier pantalla/tab | Skeletons (`Sk`→ paquete `shimmer` o `skeletonizer`), nunca spinner de página completa salvo en el arranque de la app (chequeo de sesión) |
| **Success** | Datos cargados | Render normal |
| **Error** | Fallo de red/servidor | Mensaje humanizado (ver `humanizeError` en §11) + botón "Reintentar"; **nunca** un catch silencioso como ocurre hoy en varias pantallas de la web (ej. Docente Home traga errores sin feedback — ⚠️ no replicar ese silencio, mostrar al menos un toast) |
| **Empty** | Lista vacía tras carga exitosa | `EmptyState` con ícono + mensaje contextual por rol + CTA si aplica (ej. "Crear primer curso") |
| **Offline** | Sin conectividad | Banner persistente ("Sin conexión") vía `connectivity_plus`; **no existe hoy en la web** — es una mejora real a incorporar en Flutter dado que es una app móvil |
| **Unauthorized (401)** | Token expirado/ inválido | Logout forzado + redirect a Login con mensaje "Tu sesión expiró" (replica el comportamiento web) |
| **Forbidden (403 / rol incorrecto)** | Acceso a ruta sin permiso | Redirect al home del propio rol (no mostrar pantalla 403 explícita, replicando el comportamiento silencioso de la web — **opcionalmente mejorar con un snackbar explicativo antes de redirigir**) |
| **Maintenance** | Backend devuelve 503 explícito | Pantalla de mantenimiento simple (no existe en la web hoy, agregar como mejora) |
| **No Internet / Retry** | Timeout de red | `RetryWidget` genérico reutilizable en toda la app |
| **Validación de formulario** | Input inválido antes de submit | Inline, en tiempo real (mismo patrón que la web: error bajo el campo + shake) |
| **Guardando/Enviando (mutación en curso)** | Botón de submit presionado | Deshabilitar botón + spinner inline (nunca bloquear toda la pantalla) |

---

<a name="fase-9"></a>
## FASE 9 — Modelos de datos

> Basados en los normalizadores reales de la web (`src/lib/normalizers/*`), que revelan el shape verdadero que produce el backend (MongoDB + Cloudinary). Se documentan como **entidades de dominio Dart** (inmutables, `freezed` recomendado) — el sufijo *(⚠️)* marca inconsistencias de contrato detectadas en el código fuente que el equipo debe **confirmar contra el backend real** antes de fijar el modelo definitivo.

### 9.1 `User`
```dart
class User {
  final String id;
  final String nombre;
  final String apellido;
  String get nombreCompleto => '$nombre $apellido';
  final UserRole rol;               // admin|superadmin|docente|padre|estudiante
  final String estado;              // activo|suspendido
  final String? avatarUrl;
  final String? genero;
  final DateTime? fechaNacimiento;
  final String? correo;
  final String cedula;
  final String telefono;
  final String? direccion, ciudad, pais;
  final String? codigoEstudiante, grado;
  final String? institucionId;
  final DateTime? ultimoAcceso;
  final DateTime? fechaRegistro;
  final List<String> permisos;      // solo relevante para admin/superadmin
}
```

### 9.2 `Institucion`
```dart
class Institucion {
  final String id;
  final String nombre, nit, direccion, telefono, correo;
  final String? adminId;
}
```

### 9.3 `Curso`
```dart
class Curso {
  final String id, nombre;
  final String? descripcion, codigo;
  final String estado;              // activo|archivado
  final String? imagenUrl;          // alias imagen/fotoPortada/fotoPortadaUrl unificados
  final User? docente;
  final String? docenteId;
  final List<User> participantes;
  final int totalParticipantes;
  final String? categoria, nivel, grado, seccion;
  final DateTime? fechaInicio, fechaFin;
}
```

### 9.4 `Modulo`
```dart
class Modulo {
  final String id, cursoId, titulo;
  final String? descripcion;
  final int? orden;
}
```

### 9.5 `Tarea` (Reto)
```dart
class Tarea {
  final String id, titulo;
  final String? descripcion, instrucciones;
  final TareaEstado estado;          // activa|vencida(derivado)|cerrada — backend usa "publicada"→"activa"
  final String prioridad;            // default "media"
  final DateTime? fechaEntrega, fechaPublicacion;
  final String cursoId; final String? cursoNombre;
  final String docenteId; final User? docente;
  final AsignacionTipo asignacionTipo; // todos|seleccionados
  final TipoEntrega tipoEntrega;       // archivo|texto|enlace|multimedia|presencial|grupal
  final bool permiteEntregaTardia, visible;
  final int puntajeMaximo;             // default 100 — (⚠️) no usado en el flujo real de calificación por estrellas
  final List<Archivo> archivos;
  final List<CriterioRubrica> criterios; // (⚠️) sin UI de creación encontrada — posible feature backend-only/incompleta
  final int totalEntregas, totalPendientes, totalCalificadas;
  final String? moduloId;
  final List<String> etiquetas;
}
// Regla de negocio a portar SIEMPRE en el cliente:
// "vencida" = estado == activa && fechaEntrega < DateTime.now()
```

### 9.6 `Entrega`
```dart
class Entrega {
  final String id, tareaId, padreId;
  final User? padre; final Tarea? tarea;
  final String? textoRespuesta, comentario;
  final EntregaEstado estado;         // borrador|enviada|tarde|calificada
  final List<Archivo> archivos;
  final DateTime? fechaEnvio;
  final Calificacion? calificacion;   // null hasta que se califique
}
class Calificacion {
  final int valoracion;               // 1-5 (⚠️ el service real envía/lee "valoracion"; el normalizer legacy espera "nota" — VERIFICAR contrato backend antes de fijar el DTO)
  final String? comentario;
  final DateTime? fechaCalificacion;
  final User? docente;
}
```

### 9.7 `Archivo` (adjunto — patrón compartido tarea/entrega/foro/evento)
```dart
class Archivo {
  final String id;               // alias publicId
  final String url;              // Cloudinary secure_url
  final String nombre;           // alias nombreOriginal/original_filename
  final String? publicId;        // Cloudinary public_id
  final String? tipo;            // mimetype
  final int? tamanoBytes;        // bytes
}
```

### 9.8 `Foro`
```dart
class Foro {
  final String id, titulo;
  final String? descripcion, categoria;
  final String estado;          // activo|cerrado
  final String cursoId; final String? creadorId;
  final int totalMensajes;
  final bool publico, fijado, cerrado;
}
```

### 9.9 `MensajeForo`
```dart
class MensajeForo {
  final String id, foroId, contenido;
  final User? autor; final String? autorId;
  final DateTime fecha;
  final int totalLikes; final bool yaLeDioLike;
  final List<Archivo> archivos;
  final String? respuestaA;          // id del mensaje padre (hilo)
  final List<MensajeForo> respuestas;
  final bool editado, fijado;
}
```

### 9.10 `Evento`
```dart
class Evento {
  final String id, titulo;
  final String? descripcion;
  final DateTime fechaInicio; final DateTime? fechaFin;
  final String? hora, ubicacion;
  final EventoCategoria categoria;   // escuela_padres|tarea|institucional (+institucional variantes en EventosPage: reunion/actividad/otro)
  final List<String> cursosIds;
  final Archivo? imagenPortada, adjunto;
}
```

### 9.11 `Notificacion`
```dart
class Notificacion {
  final String id, titulo, mensaje;
  final NotificacionTipo tipo;   // info|exito|warning|error|bienvenida
  final bool leida;
  final DateTime createdAt;
}
```

### 9.12 `MensajeBuzon`
```dart
class MensajeBuzon {
  final String id, nombre, correo, mensaje;
  final String? telefono, institucion;
  final bool leido;
  final DateTime createdAt;
}
```

### 9.13 `Perfil` (familia)
```dart
class Perfil {
  final String id, nombre;
  final String? avatarUrl;
  final bool esTitular;
  final bool esActivo;
}
```

### 9.14 `Sesion` (dispositivo)
```dart
class SesionDispositivo {
  final String ip, userAgent;
  final DateTime fechaInicio, ultimaActividad;
  final String? pais, ciudad;
}
```

### 9.15 Relaciones entre entidades

```
Institucion 1───N User (admin/docente/padre pertenecen a una institución)
User (docente) 1───N Curso
Curso 1───N Modulo
Curso N───N User (participantes, vía tabla puente con "etiqueta": docente|padre)
Modulo 1───N Tarea (opcional, una tarea puede no tener módulo)
Curso 1───N Tarea
Tarea 1───N Entrega
User (padre) 1───N Entrega
Entrega 1───1 Calificacion (opcional)
Curso 1───N Foro
Foro 1───N MensajeForo (con auto-referencia para hilos: respuestaA)
User 1───N MensajeForo (autor)
Curso N───N Evento (cursosIds)
User (padre) 1───N Perfil (perfiles familiares)
User 1───N Notificacion
User 1───N SesionDispositivo
```

---

<a name="fase-10"></a>
## FASE 10 — Endpoints necesarios

Base URL real: `https://backend-edumon.onrender.com/api` (producción, Render) — confirmar con backend si Flutter apuntará al mismo servicio o a uno propio. Prefijo `/api` en todos los paths listados abajo (omitido por brevedad). Todas las respuestas son JSON; las mutaciones con archivos usan `multipart/form-data`.

### 10.1 Auth

| Método | Endpoint | Body | Response | Errores |
|---|---|---|---|---|
| POST | `/auth/login` | `{telefono, contraseña}` | `{token, user, primerInicioSesion?}` | 401 credenciales inválidas |
| POST | `/auth/register` | libre | — | — |
| GET | `/auth/profile` | — (Bearer) | `{user}` | 401 |
| POST | `/auth/change-password` | `{contrasenaActual, contrasenaNueva}` | — | 400 |
| POST | `/auth/logout` | — | — | (best-effort) |
| POST | `/auth/forgot-password` | `{correo}` | — | 404 correo no existe |
| POST | `/auth/reset-password` | `{correo, codigo, contrasenaNueva}` | — | 400 código inválido |
| POST | `/auth/forgot-password-phone` | `{telefono}` | — | — |
| POST | `/auth/reset-password-phone` | `{telefono, codigo, contraseñaNueva}` | — | 400 |
| POST | `/auth/completar-registro` | libre | — | (no consumido hoy en UI) |

### 10.2 Usuarios

| Método | Endpoint | Body/Params |
|---|---|---|
| POST | `/users` | `{nombre,apellido,cedula,correo,rol,contraseña,telefono?,institucionId?}` |
| GET | `/users?<page,limit,rol,estado,search>` | — |
| GET | `/users/me/profile` | — |
| PUT | `/users/me/foto-perfil` | multipart archivo |
| GET | `/users/fotos-predeterminadas` | — |
| PATCH | `/users/foto-perfil` | `{fotoPredeterminadaUrl}` o multipart `file` |
| GET | `/users/:id` | — |
| GET | `/users/padre/:padreId/info` | — |
| PUT | `/users/:id` | `{nombre?,apellido?,cedula?,correo?,rol?,telefono?,estado?}` |
| DELETE | `/users/:id` | (soft = suspender) |
| PUT | `/users/me/fcm-token` | `{fcmToken}` |
| GET | `/users/sesiones/ultimas?page&limit` | — |

### 10.3 Instituciones

| Método | Endpoint | Body |
|---|---|---|
| POST | `/instituciones` | `{nombre,nit,direccion,telefono,correo,adminNombre,adminApellido,adminCedula,adminCorreo,adminTelefono}` |
| GET | `/instituciones` | — |
| PUT | `/instituciones/:id` | `{nombre,direccion,telefono,correo}` |
| GET | `/instituciones/mi-institucion` | — |
| POST | `/instituciones/docentes` | `{nombre,apellido,cedula,telefono,correo}` |
| POST | `/instituciones/docentes/csv` | multipart `archivoCSV` |

### 10.4 Cursos / Módulos

| Método | Endpoint | Body |
|---|---|---|
| POST | `/cursos` | multipart `{nombre,descripcion?,docenteId,fotoPortada?}` |
| GET | `/cursos?<page,limit,search>` | — |
| GET | `/cursos/mis-cursos?<page,limit>` | — |
| GET | `/cursos/:id` | — |
| GET | `/cursos/:id/participantes?<limit>` | — |
| PUT | `/cursos/:id` | multipart |
| DELETE | `/cursos/:id` | (archivar) |
| POST | `/cursos/:id/participantes` | `{nombre,apellido,cedula,telefono,contrasena}` |
| DELETE | `/cursos/:cursoId/participantes/:usuarioId` | — |
| POST | `/cursos/:id/usuarios-masivo` | multipart `archivoCSV` (parseo server-side) |
| POST | `/modulos` | `{titulo,descripcion,cursoId}` |
| GET | `/modulos?<query>` / `/modulos/curso/:cursoId` / `/modulos/:id` | — |
| PUT | `/modulos/:id` | `{titulo,descripcion}` |
| DELETE | `/modulos/:id` | — |
| PATCH | `/modulos/:id/restore` | — |

### 10.5 Tareas / Entregas

| Método | Endpoint | Body |
|---|---|---|
| POST | `/tareas` | multipart `{titulo,descripcion,cursoId,moduloId?,fechaEntrega?,asignacionTipo,tipoEntrega,docenteId,participantesSeleccionados[]?,archivos[],enlaces(json)}` |
| GET | `/tareas?<cursoId,limit>` / `/tareas/:id` | — |
| PUT | `/tareas/:id` | multipart + `archivosAEliminar[]` |
| PATCH | `/tareas/:id/cerrar` | — |
| DELETE | `/tareas/:id` | — |
| POST | `/entregas` | multipart `{tareaId,padreId,textoRespuesta,estado:"borrador",archivos[]}` |
| GET | `/entregas?<query>` / `/entregas/tarea/:tareaId` / `/entregas/padre/:padreId` / `/entregas/mis-entregas/:tareaId` / `/entregas/:id` | — |
| PUT | `/entregas/:id` | multipart |
| PATCH | `/entregas/:id/enviar` | — |
| PATCH | `/entregas/:id/calificar` | `{valoracion, comentario}` *(⚠️ verificar contra backend: la web usa "valoracion" 1-5, el normalizer legacy espera "nota")* |
| DELETE | `/entregas/:id` / `/entregas/:entregaId/archivos/:archivoId` | — |

### 10.6 Foros / Mensajes

| Método | Endpoint | Body |
|---|---|---|
| POST | `/foros` | multipart `{titulo,descripcion,cursoId,publico,archivos[]?}` |
| GET | `/foros/curso/:cursoId` / `/foros/:id` / `/foros/:id/dashboard` | — |
| PUT | `/foros/:id` | JSON |
| PATCH | `/foros/:id/estado` | `{estado}` |
| DELETE | `/foros/:id` | — |
| POST | `/mensajes-foro` | multipart `{foroId,contenido,respuestaA?,archivos[]?}` |
| GET | `/mensajes-foro/foro/:foroId` | — |
| POST | `/mensajes-foro/:id/like` | — (toggle) |
| PUT | `/mensajes-foro/:id` | `{contenido}` |
| DELETE | `/mensajes-foro/:id` | — |

### 10.7 Calendario / Eventos

| Método | Endpoint | Body |
|---|---|---|
| GET | `/calendario/:cursoId?<query>` / `/calendario/:cursoId/dia` / `/calendario/:cursoId/proximos` | — |
| POST | `/eventos` | multipart o JSON `{titulo,descripcion,fechaInicio,fechaFin,hora,ubicacion,categoria,cursosIds[],imagenPortada?,adjunto?}` |
| GET | `/eventos?<query>` / `/eventos/hoy` / `/eventos/:id` | — |
| PUT | `/eventos/:id` | multipart o JSON |
| DELETE | `/eventos/:id` | — |

### 10.8 Notificaciones / Buzón / Familia

| Método | Endpoint | Body |
|---|---|---|
| POST | `/notificaciones` | JSON |
| GET | `/notificaciones?<page,limit,leido>` / `/notificaciones/conteo-no-leidas` / `/notificaciones/:id` | — |
| PATCH | `/notificaciones/:id/leer` / `/notificaciones/leer-multiples` / `/notificaciones/leer-todas` | — |
| DELETE | `/notificaciones/:id` / `/notificaciones/limpiar/antiguas?<dias>` | — |
| POST | `/buzon` | JSON (formulario público) |
| GET | `/buzon?<limit>` | — |
| PATCH | `/buzon/:id/leido` | — |
| GET | `/perfiles` | — |
| POST | `/perfiles` | JSON |
| POST | `/perfiles/seleccionar` | `{perfilId}` → nuevo JWT |
| PUT | `/perfiles/:id` | JSON |
| DELETE | `/perfiles/:id` | — |
| POST | `/perfiles/fcm-token` | `{fcmToken}` |

**Total ≈ 68 endpoints únicos.** Todos requieren header `Authorization: Bearer <token>` salvo `/auth/login`, `/auth/register`, `/auth/forgot-password*`, `/auth/reset-password*` y `/buzon` (POST, contacto público).

**Formato de error estándar observado**: `{message: string}` o `{error: string}` o `{errors: [{field, message}]}` (validación) — el cliente Flutter debe intentar parsear las 3 formas (ver `humanizeError` en FASE 11).

---

<a name="fase-11"></a>
## FASE 11 — Seguridad

### 11.1 JWT

- El backend emite un JWT simple, sin claims de rol explotados por el cliente (el rol se obtiene siempre de la respuesta REST `/auth/login`/`/auth/profile`, no del payload del token).
- **No hay refresh token en el sistema actual** — el JWT expira y fuerza logout completo. **Recomendación para Flutter**: si el backend permanece igual, replicar el mismo modelo (JWT simple + expiración dura); si se planea evolucionar el backend, este es el momento ideal para introducir refresh tokens (mejora de seguridad y UX real, ya que hoy el usuario debe re-loguearse por completo al expirar).
- Verificación de expiración: decodificar el JWT localmente (paquete `jwt_decoder` o `dart_jsonwebtoken` solo para lectura del payload, sin verificar firma en cliente — la validación de firma es responsabilidad exclusiva del backend) comparando `exp` con la hora actual + margen de gracia de 30s.

### 11.2 Almacenamiento seguro

- **Web actual**: token en `localStorage` plano (sin cifrar) — riesgo aceptado en web SPA típico pero **no aceptable en Android**.
- **Flutter**: usar **`flutter_secure_storage`** (Keystore en Android) para el token JWT y cualquier dato sensible (no usar `shared_preferences` para el token). El caché no sensible (lista de usuarios vistos, preferencias de UI) sí puede ir en `shared_preferences`/Hive sin cifrar.

### 11.3 Biometría

No existe en la web (no aplica a un navegador). **Oportunidad de mejora real para Flutter**: ofrecer desbloqueo por huella/rostro (`local_auth`) como capa adicional antes de mostrar contenido sensible tras reabrir la app, sin reemplazar el login JWT (biometría solo protege el acceso local al token ya guardado).

### 11.4 Gestión de sesión

- **Expiración por inactividad**: 30 minutos sin interacción, aviso a los 28 minutos ("¿Sigues ahí?"), reseteo del timer con cualquier gesto/touch. Replicar con un `Timer` global gestionado por el `authProvider`, reiniciado en cada interacción de navegación/gesto detectable (Flutter no tiene un listener global de "cualquier touch" tan directo como el DOM — usar un `Listener`/`GestureDetector` en el `MaterialApp.builder` que envuelva toda la UI para capturar taps/scrolls globalmente).
- **Verificación periódica de expiración**: cada 5 minutos, chequeo local del `exp` del JWT.
- **401 centralizado**: cualquier respuesta 401 (salvo login) dispara logout automático + navegación a Login con mensaje de sesión expirada — implementar como un interceptor de Dio.

### 11.5 Permisos y protección de rutas

- Matriz de 23 permisos por rol (ver FASE 9 y código de referencia `roleMatrix.js`) — **autorización que hoy es solo client-side en la web; el backend debe ser la autoridad final**. Para Flutter: replicar la matriz para UX (ocultar botones sin permiso) pero **nunca asumir que ocultar un botón es suficiente seguridad** — cualquier acción sensible debe fallar de forma segura si el backend rechaza por rol.
- **Enum único de rol recomendado** (a diferencia de la web, que tiene 2 taxonomías divergentes puenteadas por heurística de substring — ver hallazgo en FASE 1): 
```dart
enum UserRole { superAdmin, administrador, docente, padreTutor, estudiante }
```
con un mapeo explícito y exhaustivo desde el string que retorne el backend (`fromApiString`), sin usar `.contains()`/substring matching como hace `normalizeRole()` en la web.

### 11.6 Validaciones replicadas de la web (mínimas a mantener)

- Teléfono: exactamente 10 dígitos, se antepone `+57` solo al enviar al backend (no se muestra editable el prefijo).
- Cédula: 6-10 dígitos numéricos.
- Email: regex estándar `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- Contraseña: mínimo 6 caracteres (primer login exige además mayúscula+minúscula+número, con medidor de fuerza).
- Código de recuperación: 4-8 dígitos.

### 11.7 Cloudinary (almacenamiento de archivos)

Toda evidencia (normalizadores que reconocen `secure_url`, `public_id`, `original_filename`, `bytes`) indica que el backend usa **Cloudinary** para adjuntos (fotos de perfil, portadas de curso/evento, archivos de tareas/entregas/foros). Flutter debe subir vía `multipart/form-data` al propio backend (no directo a Cloudinary desde el cliente, replicando el patrón actual de la web) salvo que el equipo decida optimizar con *unsigned upload* directo a Cloudinary en una fase futura (reduce carga del backend, pero exige gestionar el preset/firma con cuidado de seguridad).

---

<a name="fase-12"></a>
## FASE 12 — Animaciones

Mapeo de los patrones CSS reales (documentados en FASE 2.8) a mecanismos Flutter concretos:

| Necesidad | Mecanismo Flutter |
|---|---|
| Botón "3D press" (hundimiento al tocar) | `GestureDetector.onTapDown/onTapUp/onTapCancel` + `AnimatedContainer` (100-120ms) que anima `Transform.translate` y la lista de `BoxShadow` |
| Transición de pantalla (push) | `go_router` con `CustomTransitionPage` — `FadeThroughTransition`/slide horizontal estándar de Android |
| Entrada de modal (bottom sheet) | `showModalBottomSheet` con curva custom `Cubic(0.34,1.56,0.64,1)` en el `AnimationController` del sheet (overshoot, replica `edu-modal-in`) |
| Toast/Snackbar | `AnimatedSlide` desde el borde + `LinearProgressIndicator` de auto-dismiss (barra de progreso) |
| Shimmer de skeleton | Paquete `shimmer` o `skeletonizer`, 1.4s loop |
| Spinner de carga | `CircularProgressIndicator` custom con doble anillo (`CustomPainter` si se quiere fidelidad exacta al diseño "doble anillo" de `LoadingScreen`) |
| Shake de error en formulario | `AnimatedBuilder` con `Tween<Offset>` oscilante, curva `Cubic(0.36,0.07,0.19,0.97)`, 450ms |
| Check-pop de éxito en input | `AnimatedScale` con overshoot al validar campo |
| Badge bounce de entrada | `TweenSequence` de `scale`: .6→1.15→.95→1 |
| Toggle con pulgar elástico | `AnimatedAlign`/`AnimatedPositioned` + curva overshoot 250ms |
| Hero de imagen (portada de curso → hub) | `Hero` widget nativo de Flutter — mejora real disponible en Flutter que la web no tiene (no hay transiciones "hero" en SPA de React sin librería adicional) |
| Pull-to-refresh (listas: cursos, notificaciones, entregas) | `RefreshIndicator` — **funcionalidad nueva a añadir**, no existe en la web (SPA sin gesto táctil de refresh) |
| Página de foro (mensajes nuevos) | `AnimatedList`/`implicit animations` al insertar mensaje entrante del polling |

**Recomendación de duraciones estándar** (constantes en `AppDurations`): `fast=120ms`, `base=200ms`, `slow=300ms`, `spring=280-350ms` con la curva overshoot — exactamente los valores ya definidos en los tokens CSS de la web (con la inconsistencia 120ms vs 150ms detectada — **unificar a 150ms** como valor único en Flutter).

---

<a name="fase-13"></a>
## FASE 13 — Optimización

### 13.1 Listas y paginación
- Todas las listas grandes (usuarios, cursos, notificaciones, sesiones) deben usar **paginación real del backend** (`page`/`limit`) con `ListView.builder` + scroll infinito (`infinite_scroll_pagination` package) en vez del patrón "traer 1000 y filtrar en cliente" que usa la web hoy en varias pantallas (Docentes, Usuarios, Cursos) cuando hay búsqueda activa — **antipatrón a NO replicar en Flutter**; en su lugar, debounce + búsqueda server-side si el backend lo soporta, o mantener el filtrado en cliente solo sobre datos ya paginados localmente en caché, nunca sobre-fetch de 1000 registros en un dispositivo móvil con datos limitados.

### 13.2 Cache de imágenes
- `cached_network_image` para todas las imágenes remotas (portadas de curso/evento, avatares, adjuntos Cloudinary) — evita re-descargas y soporta placeholder/shimmer mientras carga.

### 13.3 Cache de datos / invalidación
- Replicar la estrategia de TanStack Query (`staleTime: 60s`) con Riverpod: `FutureProvider`/`AsyncNotifierProvider` con invalidación manual tras mutaciones (`ref.invalidate(cursoProvider(id))`), evitando refetch innecesario al navegar entre tabs.
- El polling de 60s en Foros (`useForumMessages`) se replica con un `Timer.periodic` o `ref.listen` combinado con `AsyncValue` — evaluar si el backend puede ofrecer WebSocket/Socket.io real en el futuro para reemplazar el polling (mejora real de latencia y batería vs. polling).

### 13.4 Memoria y render
- `const` widgets en todos los componentes de diseño puro (botones, badges, cards estáticas) para evitar rebuilds.
- `RepaintBoundary` alrededor de widgets con animaciones frecuentes (spinner, shimmer, badge bounce) para aislar repintado.
- Evitar `ListView` sin `.builder` en listas de tamaño variable/grande (nunca usar `Column` con `map()` para listas de cursos/usuarios/mensajes).

### 13.5 Optimización específica de Foros (polling)
- Pausar el `Timer` de polling cuando la pantalla no está visible (`didChangeAppLifecycleState` / `AutomaticKeepAliveClientMixin` con control explícito) para no gastar batería/datos en segundo plano — mejora real sobre el comportamiento web (los intervalos de JS en pestañas de fondo siguen corriendo salvo throttling del navegador).

### 13.6 N+1 a evitar
- La web tiene patrones N+1 evidentes (enriquecer entregas con fetch de padre/tarea por separado, resolver docente por curso cuando no viene poblado). **Recomendación de arquitectura**: solicitar al equipo backend que las respuestas de listados pueblen (`populate`) las relaciones necesarias directamente, evitando este patrón en el cliente Flutter — más eficiente en batería/datos móviles que en un navegador de escritorio.

### 13.7 Tamaño de imágenes subidas
- Comprimir/redimensionar (`image` package o `flutter_image_compress`) portadas y adjuntos antes de subir desde móvil (cámaras modernas generan archivos de varios MB) — la web no necesita esto tanto porque los usuarios suben desde archivos ya existentes en desktop, pero en Android es común subir directo desde cámara, por lo que es una optimización de datos móviles importante y nueva.

---

<a name="fase-14"></a>
## FASE 14 — Plan de desarrollo

> Sprints de 2 semanas, equipo de referencia: 2 Flutter devs + 1 diseñador part-time + 1 QA part-time. Ajustar según capacidad real.

### Sprint 1 — Fundaciones (prioridad crítica)
- Setup del proyecto (Flutter, lint, CI básico), estructura de carpetas Clean Architecture.
- `core/theme` completo (colores, tipografía, spacing, shadows) desde los tokens de la FASE 2.
- `core/design_system`: Button, TextField, Card, Badge, Avatar, LoadingScreen, EmptyState, Toast.
- `core/network`: ApiClient (Dio) + interceptores (auth, 401, logging) + manejo de errores humanizado.
- `core/security`: enum de rol único, matriz de permisos, `PermissionGate`.
- `core/router`: esqueleto de `go_router` con guards de auth/rol (sin todas las rutas aún).
- Feature Auth completa: Login, Forgot Password, Reset Password, almacenamiento seguro del token, gestión de sesión/inactividad, **Wizard de primer login funcional (corrigiendo el bug de la web)**.

### Sprint 2 — Shell + Dashboards
- `ShellRoute` con Drawer/NavigationRail responsivo, AppBar con búsqueda/notificaciones/perfil dropdown.
- 4 dashboards (Superadmin, Admin, Docente, Padre) con stat cards y listas resumen.
- Feature Notificaciones (bandeja completa).
- Feature Perfil propio (edición + cambio de contraseña + avatar).
- Feature Sesiones activas.

### Sprint 3 — Gestión institucional
- Instituciones (CRUD, superadmin).
- Usuarios (CRUD + suspender/activar + import feedback).
- Docentes (CRUD + import CSV unificado con el componente compartido de carga masiva).
- Mi Institución (solo lectura) — **decidir con producto si se conectan los datos hoy hardcoded (plan/estado) o se retira esa sección**.

### Sprint 4 — Cursos core
- Lista de cursos (con creación/edición/archivado/portada).
- Hub de curso (shell + tabs) con permisos dinámicos.
- Tab Módulos (CRUD + import CSV client-side).
- Tab Participantes (CRUD + import CSV server-side).

### Sprint 5 — Tareas y Entregas
- Tab Tareas (CRUD completo, asignación total/parcial, adjuntos, enlaces).
- Sub-flujo Entregas (listar, calificar 1-5 estrellas, realizar entrega, enviar) — **corrigiendo el bug de callback no conectado de la web**.
- Gestión global de Retos (docente) + pantalla de calificación global — **decidir y unificar la escala de calificación (1-5 estrellas vs 0-100) entre ambos flujos antes de construir**.

### Sprint 6 — Foros (vista canónica) + Calendario/Eventos
- ForumScreen completo (3 columnas responsivo, polling, likes, hilos, permisos).
- Calendario agregado (global) + Calendario por curso + Eventos (CRUD multimedia).

### Sprint 7 — Familia (rol padre) + Buzón
- Perfiles familiares (multi-perfil + cambio de sesión).
- Cursos/Retos/Entregas/Calendario de familia (reutilizando componentes ya construidos).
- Foros de familia → **reutilizar ForumScreen canónico, no construir una versión paralela**.
- Buzón (superadmin/admin).

### Sprint 8 — Pulido, offline, performance, QA
- Estados offline/retry, pull-to-refresh en todas las listas.
- Push notifications reales (FCM) — construir desde cero (la web lo tiene dormido/no funcional, no hay referencia funcional que copiar).
- Auditoría de accesibilidad (contraste, tamaños táctiles ≥44dp, `Semantics`).
- Pruebas end-to-end de los flujos críticos (login, entrega de tarea, calificación, foro).
- Beta cerrada + correcciones.

---

<a name="fase-15"></a>
## FASE 15 — Librerías Flutter

| Categoría | Paquete | Uso |
|---|---|---|
| Routing | `go_router` | Navegación declarativa + guards |
| Estado | `flutter_riverpod` (+ `riverpod_annotation`/`riverpod_generator` opcional) | Providers, DI, cache |
| HTTP | `dio` | Cliente HTTP + interceptores |
| Serialización | `freezed` + `json_serializable` | Entidades inmutables + DTOs |
| Almacenamiento seguro | `flutter_secure_storage` | Token JWT |
| Cache local | `hive` / `hive_flutter` | Caché de usuarios, borradores offline |
| Preferencias simples | `shared_preferences` | Flags de UI no sensibles |
| JWT | `jwt_decoder` | Lectura de `exp` (no verificación de firma) |
| Imágenes remotas | `cached_network_image` | Portadas, avatares, adjuntos |
| Selección de archivos | `file_picker`, `image_picker` | CSV, portadas, adjuntos de tareas/entregas |
| Compresión de imágenes | `flutter_image_compress` | Antes de subir fotos desde cámara |
| Iconografía | `lucide_icons` (o Material Symbols) | Paridad visual con `lucide-react` |
| Fuentes | `google_fonts` (Inter + Poppins) o assets locales `.ttf`/`.otf` | Tipografía de marca |
| Calendario | `table_calendar` | Vista mensual de Calendario/Eventos |
| Rating | `flutter_rating_bar` | Calificación 1-5 estrellas |
| Shimmer/Skeleton | `shimmer` o `skeletonizer` | Estados de carga |
| Paginación infinita | `infinite_scroll_pagination` | Listas grandes (usuarios, notificaciones) |
| Conectividad | `connectivity_plus` | Estado offline |
| Push notifications | `firebase_core`, `firebase_messaging` | FCM (construir desde cero, ver FASE 11) |
| Biometría (mejora) | `local_auth` | Desbloqueo por huella/rostro |
| Fechas/locale | `intl` | Formateo es-CO |
| Logging | `logger` | Debug estructurado |
| Comparación de objetos | `equatable` (si no se usa `freezed` en todos lados) | Entidades comparables |
| Deep link / URL launcher | `url_launcher` | Abrir adjuntos/enlaces externos |
| Permisos de sistema | `permission_handler` | Cámara, almacenamiento, notificaciones |
| Testing | `mocktail`, `flutter_test`, `integration_test` | Unit/widget/e2e |

---

<a name="fase-16"></a>
## FASE 16 — Checklist final

### Pantallas (33)
- [ ] Login · [ ] Forgot Password · [ ] Reset Password · [ ] Wizard Primer Login · [ ] Sesiones activas
- [ ] Dashboard Superadmin · [ ] Dashboard Admin · [ ] Dashboard Docente · [ ] Dashboard Padre
- [ ] Instituciones (lista/CRUD) · [ ] Mi Institución (solo lectura)
- [ ] Usuarios (lista/CRUD) · [ ] Docentes (lista/CRUD + CSV)
- [ ] Cursos (lista/CRUD) · [ ] Hub de Curso (shell + tabs)
- [ ] Tab Módulos · [ ] Tab Tareas · [ ] Tab Calendario (curso) · [ ] Tab Foros (curso) · [ ] Tab Participantes
- [ ] Sub-flujo Entregas (listar) · [ ] Calificar Entrega · [ ] Realizar Entrega
- [ ] Retos (gestión global docente) · [ ] Entregas (calificación global docente)
- [ ] Calendario (agregado global) · [ ] Eventos (CRUD multimedia)
- [ ] Familia: Perfiles · [ ] Familia: Cursos · [ ] Familia: Retos · [ ] Familia: Entregas
- [ ] Foro (vista canónica 3 columnas) — reutilizado también por Familia
- [ ] Notificaciones · [ ] Buzón · [ ] Perfil propio

### Widgets del design system (17)
- [ ] EdumonButton · [ ] EdumonTextField/Textarea/Select/Toggle/Checkbox/Radio · [ ] EdumonCard/StatCard · [ ] AppModalSheet · [ ] EdumonToast · [ ] UserAvatar/SimpleAvatar · [ ] EdumonBadge/NotifBadge/XpBadge · [ ] EdumonMenuButton (Dropdown) · [ ] FileUploadWidget · [ ] IconActionButton · [ ] LoadingScreenWidget · [ ] CalendarWidget · [ ] CsvUploadSheet · [ ] EmptyState · [ ] Skeleton/Shimmer · [ ] SectionHeader · [ ] StarRating

### APIs (~68 endpoints — ver FASE 10 para el detalle completo)
- [ ] Auth (10) · [ ] Usuarios (11) · [ ] Instituciones (6) · [ ] Cursos/Módulos (14) · [ ] Tareas/Entregas (13) · [ ] Foros/Mensajes (10) · [ ] Calendario/Eventos (8) · [ ] Notificaciones/Buzón/Familia (11)

### Modelos (15)
- [ ] User · [ ] Institucion · [ ] Curso · [ ] Modulo · [ ] Tarea · [ ] Entrega · [ ] Calificacion · [ ] Archivo · [ ] Foro · [ ] MensajeForo · [ ] Evento · [ ] Notificacion · [ ] MensajeBuzon · [ ] Perfil · [ ] SesionDispositivo

### Servicios / Repositorios (por feature)
- [ ] AuthRepository · [ ] UserRepository · [ ] InstitucionRepository · [ ] CursoRepository · [ ] ModuloRepository · [ ] TareaRepository · [ ] EntregaRepository · [ ] ForoRepository · [ ] MensajeForoRepository · [ ] CalendarioRepository · [ ] EventoRepository · [ ] NotificacionRepository · [ ] BuzonRepository · [ ] PerfilFamiliarRepository · [ ] SesionRepository · [ ] FcmRepository

### Providers (Riverpod)
- [ ] authProvider · [ ] roleProvider/permissionsProvider · [ ] cursoProvider.family · [ ] tareasProvider.family · [ ] entregasProvider.family · [ ] foroProvider.family + mensajesForoProvider.family (con polling) · [ ] notificacionesProvider (+ conteo no leídas) · [ ] userCacheProvider · [ ] perfilesFamiliaresProvider

### Casos de uso críticos a testear (por rol)
- [ ] Login + primer login + recuperación de contraseña
- [ ] Docente: crear curso → módulo → tarea → calificar entrega
- [ ] Padre: ver curso del hijo → realizar entrega → ver calificación
- [ ] Docente/Padre: participar en foro (mensaje, respuesta, like)
- [ ] Admin: crear institución + admin inicial; crear docente vía CSV
- [ ] Padre: crear perfil familiar adicional y cambiar de perfil activo
- [ ] Expiración de sesión (JWT + inactividad) → logout forzado

### Validaciones a portar
- [ ] Teléfono 10 dígitos + prefijo +57 · [ ] Cédula 6-10 dígitos · [ ] Email regex · [ ] Contraseña ≥6 (+ reglas extra en primer login) · [ ] Código recuperación 4-8 dígitos · [ ] Título de foro 5-200 / descripción 10-2000 · [ ] Asignación de tarea "seleccionados" requiere ≥1 participante · [ ] Entrega requiere texto o ≥1 archivo para "enviar"

### Permisos (23, matriz completa en FASE 9/11)
- [ ] Implementados y cubiertos por tests unitarios de la función `hasPermission(role, permission)`

### Decisiones pendientes de producto (bloqueantes antes de codear ciertas pantallas)
- [ ] ¿Se activa el rol `estudiante` como login propio en esta versión, o se mantiene representado por el padre?
- [ ] ¿Se unifica la escala de calificación (1-5 estrellas vs 0-100) en un solo criterio?
- [ ] ¿Se conectan los datos hoy hardcoded de "Mi Institución" (plan, estado, administradores) o se retira esa sección?
- [ ] ¿Se implementa un sistema de planes/suscripción real, dado que hoy es solo texto de relleno?
- [ ] ¿Se agrega entrada de navegación para Buzón/Eventos/Sesiones (hoy accesibles solo por URL directa en la web)?
- [ ] ¿Se prioriza WebSocket real para foros en vez de polling de 60s?
- [ ] Confirmar con backend el contrato real de `entregasCalificar` (`valoracion` vs `nota`) antes de fijar el DTO definitivo.

---

## Anexo — Hallazgos de deuda técnica de la web (referencia, no migrar)

| # | Hallazgo | Recomendación para Flutter |
|---|---|---|
| 1 | Ruta `/primer-inicio` no registrada; `updateUser()` no existe en `AuthContext` | Implementar el wizard completo y funcional desde el día 1 |
| 2 | Guards muertos (`RoleGuard`, `RequireRole`, `RequireAuth`) | No portar, usar solo el patrón `redirect` de go_router |
| 3 | Dos taxonomías de rol (`administrador` vs `admin`) puenteadas por substring | Un solo enum canónico con mapeo explícito |
| 4 | Rutas sin entrada de menú (`/eventos`, `/buzon`, `/sesiones`) | Decidir con producto si se agregan al nav |
| 5 | Firebase/FCM instalado pero nunca inicializado, `useFCM` no conectado | Implementar FCM desde cero, no hay referencia funcional que copiar |
| 6 | Framer Motion instalado pero no usado (todo es CSS) | Irrelevante para Flutter, ya se especifican animaciones nativas |
| 7 | Foros con triple implementación de detalle (2 legacy + 1 canónica) | Portar solo la canónica (`ForumPage`/3 columnas) |
| 8 | Checkbox "Recordarme" sin efecto funcional | Implementar de verdad o retirar el control |
| 9 | Placeholders hardcoded en Padre Home / Mi Institución | Conectar a datos reales o retirar visualmente |
| 10 | CSV de módulos parseado en cliente vs CSV de participantes parseado en servidor | Replicar la asimetría real (confirmada contra backend) |
| 11 | `RealizarEntrega` sin callback `onSuccess` conectado en un caso | Asegurar que siempre cierre/refresque tras guardar |
| 12 | Escala de calificación inconsistente (1-5 estrellas vs 0-100 en pantallas distintas) | Unificar antes de construir en Flutter |
| 13 | Colores hardcoded fuera de la paleta (`LoadingScreen`, `CalendarWidget`) | Usar exclusivamente los tokens `AppColors` |
| 14 | Patrones N+1 client-side (enriquecimiento de entregas/cursos) | Pedir al backend poblar relaciones; evitar N+1 en móvil |
| 15 | Antipatrón "traer 1000 registros y filtrar en cliente" al buscar | Buscar server-side o paginar localmente sobre datos ya cacheados |
