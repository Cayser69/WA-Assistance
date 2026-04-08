# WA-Assistance (WhatsApp Cold Sales Assistant)

Aplicación de escritorio gratuita diseñada para automatizar flujos de ventas y asistencia a través de WhatsApp. Desarrollada con Electron, Node.js y Vanilla JS, esta herramienta integra WhatsApp Web de forma "headless" para orquestar campañas, escanear chats y gestionar leads de manera masiva y estable.

---

## 🚀 Fases y Estado Actual del Proyecto

Actualmente, el proyecto se encuentra en una etapa avanzada de estabilización técnica y definición del "Chasis" o esqueleto principal. 

### ✅ Fase 1: Arquitectura Base y UI Modular (Completado)
- **Motor Modular:** Creación de un `TemplateLoader` que inyecta HTML y CSS dinámicamente bajo demanda sin recargar la pantalla (`loader.js`).
- **Navegación Fluida:** Router en Vanilla JS que permite cambiar de vistas manteniendo estados de componentes intactos.
- **Hub de Conectividad:** Panel visual que monitorea constantemente en tiempo real (Iconos interactivos con estados de conexión).
  - Estado de WhatsApp (Conectado / Desconectado / Sincronizando)
  - Estado de Campaña (Inactiva / Pausada / Ejecutando)
  - Estado del Scanner (Inactivo / Ejecutando / Pausado)
  - Estado de IA (Conectada / Desconectada)

### ✅ Fase 2: Control Estricto de WhatsApp y Sesiones (Completado)
- **Persistencia Aislada:** Todos los datos (caché y sesiones) se redirigen a local en la carpeta `.app_data` para evitar problemas de permisos de sistema (`0x5 Error` en Windows).
- **Zombie-Killer:** Sistema activo de limpieza de procesos huérfanos de Chrome/Puppeteer con PowerShell integrado para evitar bloqueos fantasma de SQLite y Puppeteer.
- **Lanzador Estabilizado:** Desvío inteligente de los logs para que no sature la consola (`npm run start:debug` configurado) y retraso inteligente (3 segundos post-arranque de UI) para inicializar WhatsApp de manera segura.
- **Base de Datos SQLite:** Inserción, lectura y gestión local para Leads, Plantillas e Historiales con IPC Bridge cerrado y expuesto por contexto (Context Isolation Level 5).

### 🚧 Fase 3: Módulos de Operación Pura (En Progreso)
- **Módulo Campañas:** Creación de listas de envíos, personalización, gestión de imágenes/multimedia y capacidad nativa de reanudar envíos truncados o pausados por limitaciones de la plataforma.
- **Módulo Scanner:** Escaneo sistemático en ráfagas automatizadas y gestión anti-baneo pasiva.
- **Módulo Consola / Logs:** Visualización 100% in-app interactiva (estilo CMD/Terminal). Incluye limpieza manual y gestión automatizada del buffer (límite de líneas) para evitar la sobrecarga de la UI cuando hay miles de eventos.

### 🗓️ Fase 4: Integración AI y Analíticas (Próximamente)
- **Módulo OpenAI Smart:** Intercepción directa de LLMs para responder al vuelo o clasificar intención de los Leads extraídos de las campañas.
- **Módulo Analíticas (Dashboard):** Métricas de lectura, conversión o fallos del embudo de ventas frío en tiempo real.

### 🗓️ Fase 5: Distribución y Cierre (Futuro)
- Limpieza final de código huérfano.
- Integración de Auto-Updater (Sincronizado vía Github Releases).
- Empaquetado formal del ejecutable `.exe` vía Electron Packager / Builder para usuarios finales.

### 🗓️ Fase 6: Omnicanalidad y Autonomía IA (Futuro)
- **Integración con Instagram (IG Direct):** Módulo paralelo para gestionar embudos y prospecciones directamente desde Instagram.
- **Bandeja de Entrada Unificada:** Interfaz centralizada (All-in-One Hub) para controlar WhatsApp, Instagram y futuras redes sociales en la misma ventana.
- **Agente conversacional IA Total:** Capacidad para que el motor de OpenAI no solo lea y clasifique, sino que "hable por nosotros", gestionando respuestas a objeciones y resolviendo comentarios de manera 100% automática a través de los diversos canales.

---

## 🛠️ Entorno de Desarrollo y Comandos

**Requisitos Previos:**
- Node.js versión moderna instalada.
- Windows 10/11 preferiblemente debido a las secuencias nativas del recolector de zombis de Chrome en PowerShell.

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el entorno de desarrollo estándar (Logs limpios)
npm start

# 3. Iniciar el entorno de desarrollo profundo (Diagnósticos, errores y todos los console.log)
npm run start:debug
```

---

## 📂 Estructura del Proyecto (Versión Modular v2)

Para mantener la escalabilidad, el código se divide en responsabilidades claras:

```text
src/
├── main/ (Proceso Principal / Motor)
│   ├── index.js (Punto de entrada Electron)
│   ├── ipc/ (Controladores de comunicación)
│   ├── providers/
│   │   └── whatsapp/ (Core, Managers y Servicios de WA)
│   └── services/ (Base de Datos, IA)
└── renderer/ (Proceso de Renderizado / Frontend)
    ├── index.html (Contenedor base)
    ├── js/
    │   ├── index.js (Bootstrap de UI)
    │   ├── loader.js (Motor de carga de plantillas)
    │   ├── router.js (Gestor de navegación)
    │   ├── components/ (Sidebar, Hub, Consola)
    │   └── views/ (Dashboard, Campañas, Plantillas)
    ├── style/
    │   ├── global.css (Diseño base y animaciones)
    │   └── modules/ (Variables y temas)
    └── templates/ (Fragmentos HTML dinámicos)
```

---

## 🛠️ Estabilidad y Solución de Problemas (Lecciones Aprendidas)

- **Ejecución en Windows**: Siempre arrancar Electron apuntando directamente al archivo `src/main/index.js` para evitar problemas de shadowing de módulos.
- **Rutas Relativas**: Utilizar `process.cwd()` para la resolución de recursos locales en lugar de `app.getAppPath()`, garantizando consistencia en entornos de desarrollo.
- **Gestión de Sesiones**: Mantener la higiene de procesos matando instancias huérfanas de Chrome/Puppeteer antes de cada inicialización.


---

## 🛠️ Estabilidad y Solución de Problemas (Lecciones Aprendidas)

- **Ejecución en Windows**: Siempre arrancar Electron apuntando directamente al archivo `src/main/index.js` para evitar problemas de shadowing de módulos.
- **Rutas Relativas**: Utilizar `process.cwd()` para la resolución de recursos locales en lugar de `app.getAppPath()`, garantizando consistencia en entornos de desarrollo.
- **Gestión de Sesiones**: Mantener la higiene de procesos matando instancias huérfanas de Chrome/Puppeteer antes de cada inicialización.

\`\`\`
