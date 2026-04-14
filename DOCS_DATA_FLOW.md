# Arquitectura de Flujo de Datos: WA-Assistance (MVP) 🛰️

Este documento sirve como mapa maestro para entender cómo interactúan los componentes del sistema. **Regla de oro:** Cualquier cambio en la comunicación entre procesos debe quedar reflejado aquí.

---

## 🏗️ Arquitectura de Procesos
La aplicación utiliza el modelo de arquitectura de Electron:
1.  **Main Process:** Lógica pesada, motor de WhatsApp, acceso a base de datos y sistema de archivos.
2.  **Preload Script:** Puente seguro (`contextBridge`) que expone APIs específicas al Renderer.
3.  **Renderer Process:** Interfaz de usuario (SPA), gestión de estado y visualización.

---

## 🧠 1. Gestión de Estado (Frontend)
El archivo `src/renderer/js/core/state.js` actúa como el **Single Source of Truth** para la interfaz.
- **AppState:** Almacena el estado volátil (QR, estatus de conexión, logs en memoria, leads seleccionados).
- **Relación con IPC:** Los listeners en `ui-events.js` reciben señales del Main y actualizan el `AppState`, que a su vez delega la actualización a los componentes (`Hub`, `Sidebar`, `Consola`).

---

## 🗄️ 2. Capa de Persistencia (SQLite)
Se utiliza SQLite para datos que deben sobrevivir al cierre de la aplicación.
- **Tablas Principales:**
    - `leads`: Agenda y prospectos. Incluye campos `tipo` (`contacto`, `prospecto`, `manual`) y `meta_id` (ID técnico de WhatsApp Business).
    - `logs`: Historial de mensajes (enviados/recibidos).

### 🛰️ IPC: Canales de Comunicación
- `db:truncate-leads`: Vacía la tabla de leads (Mantenimiento).
- `wa:sync-contacts`: Sincronización manual de la agenda de WhatsApp.
- `db:get-chats` / `db:get-chat-messages`: Recuperación de historial para el CRM.
- `wa:qr-update` / `wa:status`: Estados de conexión en tiempo real.

### 👥 Módulo: Audiencia (Diferenciación y Limpieza)
- **Origen y Mapeo:** 
    - **Meta ID:** Se guarda en `meta_id`. Es un identificador técnico largo.
    - **Teléfono Real:** Se guarda en `telefono`. Es el número al que se envían los mensajes.
- **Lógica de Limpieza:** 
    - Al sincronizar, si el `nombre` del contacto es igual a su `teléfono`, el sistema lo limpia y lo marca como `NULL` (mostrando "Desconocido" en la UI) para evitar ruido visual.
- **UI:** La tabla en `audiencia.js` muestra el Teléfono como dato principal y oculta los IDs técnicos.
    - `templates`: Plantillas de mensajes con soporte multimedia.
    - `settings`: Ajustes de configuración (API Keys, últimos mensajes).
    - `persistence`: Estado de tareas en curso (para reanudar tras caídas).

---

## 📡 3. Canales IPC (Data Flow Interno)

### 🟢 Módulo: Conexión WhatsApp
1.  **Renderer:** `Router.navigate('conexiones')` -> `Conexiones.init()`.
2.  **IPC (Preload):** `getWAStatus()`, `logout()`, `onQRUpdate()`.
3.  **Main (Service):** `waClient` gestiona la sesión con `whatsapp-web.js`.
4.  **Feedback:** Ante un cambio de estado, el Main emite `wa:status`, que el Renderer captura para actualizar el icono global y la Sidebar.

### 🚀 Módulo: Campañas (Envío)
- **Inicio:** `MensajeTab.js` -> `window.api.startCampaign(params)`.
- **Mapeo de Datos:**
    - `params.mensaje`: Texto base.
    - `params.delayMin/Max`: Rango de espera base 60s + aleatorio.
    - `params.useAI`: Boolean para activar variaciones.
- **Motor:** `executor.js` orquesta el envío. Si falla un contacto, persiste el `currentIndex` en la tabla `persistence` para permitir reintentos.

### 🔎 Módulo: Scanner (Validación)
- **Flujo:** `ScannerTab.js` -> `window.api.startScanner(config)`.
- **Acción:** El Main itera por el rango de números usando `client.getNumberId()`.
- **Actualizaciones Reales:** Envía `scanner:status` en cada número verificado para que la barra de progreso del Renderer se mueva en tiempo real.

### 💬 Módulo: Chat y Mensajería
- **Sincronización:** Al recibir un mensaje en el Main, se emite `wa:message-received`.
- **Persistencia:** Todos los mensajes (entrantes y salientes) se guardan automáticamente en la tabla `logs`.
- **Vista:** El componente `Chat` consulta `db:get-chats` para mostrar la lista de conversaciones activas.

### 🤖 Módulo: IA Smart (Motor)
- **Configuración:** `AI.js` envía `ai:config` con la API Key y personalidad.
- **Ejecución:** Durante las campañas o respuestas automáticas, el Main invoca `aiClient.getReply()` antes del envío final por WhatsApp.

---

## 🛣️ Ciclo de Vida de un Dato (Ejemplo: Nuevo Lead)
1.  **Captura:** El usuario introduce un número en `AudienciaTab.js`.
2.  **Validación UI:** Se limpia el formato.
3.  **Petición:** `window.api.insertLead(telefono)`.
4.  **Backend:** `leads.js (model)` ejecuta `INSERT INTO leads...`.
5.  **Refresco:** El Renderer recibe la confirmación y vuelve a llamar a `db:getLeads` para repoblar la tabla.

---

## 🛡️ Trazabilidad de Errores
Cualquier error en el Main Process que deba ser visto por el usuario se canaliza a través de:
- `wa:log`: Muestra un mensaje en la consola integrada.
- `window.onerror` (en `index.html`): Captura fallos críticos de carga de módulos en el Renderer.
