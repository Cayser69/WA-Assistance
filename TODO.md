# MASTER TODO: Plan de Desarrollo y Arquitectura

Este documento contiene la lista de tareas (checklists) estricta para el desarrollo de WA-Assistance.  
**Instrucción para IAs:** No eliminar tareas antiguas. Marcar con `[x]` cuando estén completadas.

---

## 🛠️ Fase 3: Módulos de Operación Pura

- [x] **Consola Interactiva:**
  - [x] Añadir un botón (escoba `cleaning_services`) a `template.html` para limpiar historial manual.
  - [x] Limitar auto-borrado: buffer de máximo 500 líneas en `index.js` (`consoleEl.removeChild`).
  - [x] Vaciar array de memoria en local (`AppState.clearLogs()` en `state.js`).
- [x] **Optimización de UI y Lag (Fixes):**
  - [x] Fix del QR de WhatsApp: Reemplazar el bucle destructor del Router para que solo actualice el atributo `src` de la imagen en `ui-events.js`, reduciendo el lag a cero.
  - [x] Fix del Scanner: Reparar bloqueos de la regla *Context Isolation* exponiendo funciones precisas (`checkPersistence`, `clearPersistence`) en `preload/index.js` para detener el error `invoke is not a function`.

---

## 🏗️ Fase 4: Reestructuración Arquitectónica UI (Omnicanalidad)

- [ ] **Limpieza de Código Legado:**
  - [ ] Eliminar y purgar todo el código del módulo "Historial" (borrar componente `/pages/historial` y su rastro en el router), por ser inútil para la estrategia de *Cold Outreach*.
- [ ] **Nuevo Panel Lateral (Sidebar):**
  - [ ] Reescribir el CSS y HTML base de `src/renderer/index.html` para agrupar el Sidebar en desplegables.
  - [ ] Menú 1: **WHATSAPP** (Conexión, Campañas, Scanner)
  - [ ] Menú 2: **INSTAGRAM** (Conexión IG, Campañas IG, Scanner IG)
  - [ ] Menú 3: **INTELIGENCIA ARTIFICIAL** (Configuración, Bandeja Autónoma Unificada)
- [ ] **Precauciones Técnicas ("Para que no reviente"):**
  - [ ] Separar `AppState.waStatus` y `AppState.igStatus` para evitar colapsos.
  - [ ] Separar listeners del `preload/index.js` en canales diferenciados (`wa:status` vs `ig:status`).

---

## 🕷️ Fase 5: Arquitectura "Dark Path" para Instagram

- [ ] **Rechazo Oficial:** Descartar por completo el uso de la *Meta Graph API* oficial para saltarse la regla de 24 horas y permitir DMs fríos a desconocidos masivamente.
- [ ] **Desarrollo Headless (Invisible):**
  - [ ] Programar Instagram emulando un navegador fantasma (usando Puppeteer puro o librerías alternativas adaptadas).
  - [ ] Encapsular todo el servidor de IG en la ruta hermana `src/main/providers/instagram/` (aislado del de WhatsApp).
- [ ] **Sistema Anti-Ban:**
  - [ ] Añadir retardos aleatorios altos en la escritura y saltos lógicos simulando ser un comportamiento 100% humano para evadir el "Shadowban" de las auditorías de Meta.

---

## 💰 Fase 6: El Muro de Monetización (Lead Generation)

- [ ] **El Caballo de Troya Gratis:**
  - [ ] El software completo será 100% gratuito para forzar su adopción máxima por parte de comercios y agencias.
- [ ] **Login Wall Obligatorio (App Gate):**
  - [ ] Añadir una pantalla que bloquee por completo el uso de la herramienta hasta que el usuario se cree una cuenta y valide su Email/Contraseña.
- [ ] **Onboarding Form (Perfilado):**
  - [ ] Tras registrarse, forzar un cuestionario rápido (Ej: ¿A qué sector te dedicas?, ¿Eres agencia?, ¿Volumen de envíos?).
- [ ] **Extracción de Datos:** Todo este flujo irá cifrado directo a tu base de datos central en la nube. Convirtiendo a todos los piratas/vendedores en Leads de altísimo poder adquisitivo para que tú luego se los vendas o les cruces servicios.
