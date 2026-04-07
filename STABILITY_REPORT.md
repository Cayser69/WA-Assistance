# Reporte de Estabilización y Solución de Errores Críticos (Abril 2026)

Este documento detalla los fallos críticos encontrados durante el desarrollo de la arquitectura ESM en Electron 30 y las soluciones definitivas aplicadas para garantizar un arranque estable en Windows.

---

## 1. Error: `TypeError: Cannot read properties of undefined (reading 'isPackaged')`
### Contexto:
Al intentar acceder al objeto `app` de Electron en el proceso principal, el sistema devolvía un error indicando que `app` era `undefined`.

### Diagnóstico Técnico:
*   **Shadowing de Módulos**: En Windows, cuando existe una carpeta `electron` en `node_modules`, el cargador de Node.js a veces intercepta el comando `require('electron')` antes que el motor de Electron.
*   **Crisis de Identidad**: El proceso se lanzaba en "Modo Node" en lugar de "Modo Browser". En este modo, `require('electron')` devuelve simplemente una cadena de texto (la ruta al ejecutable) en lugar del objeto API.

### Solución Definitiva:
Se modificó el script de inicio en `package.json` para llamar directamente al binario ejecutable y pasarle la ruta del archivo de entrada (`src/main/index.js`) de forma explícita.
```json
"start": "electron.exe src/main/index.js"
```
Esto garantiza que el proceso se identifique correctamente como el proceso principal (Main Process) desde el segundo cero.

---

## 2. Error: "Error cargando componente sidebar/hub/dashboard"
### Contexto:
La aplicación arrancaba pero la interfaz permanecía vacía o con mensajes de error en los placeholders de los componentes.

### Diagnóstico Técnico:
*   **Cualquier cambio en el punto de entrada altera `app.getAppPath()`**: Al lanzar la app apuntando directamente a `src/main/index.js`, la función `app.getAppPath()` devolvía el directorio `src/main/` en lugar de la raíz del proyecto.
*   **Fallo de Localización**: El cargador de plantillas intentaba buscar los archivos HTML/CSS dentro de `src/main/src/renderer/...`, lo cual no existe.

### Solución Definitiva:
Se refactorizaron los manejadores IPC (`app:read-template` y `app:getPath`) para utilizar `process.cwd()` (Directorio de Trabajo Actual). Dado que el terminal siempre inicia en la raíz, esto garantiza una resolución de rutas consistente sin importar la ubicación del script de inicio.

---

## 3. Error: `Protocol error: Session closed / Target closed` (WhatsApp)
### Contexto:
El cliente de WhatsApp intentaba inicializarse pero cerraba el navegador inmediatamente o fallaba al conectar.

### Diagnóstico Técnico:
*   **Bandera Obsoleta `--single-process`**: Esta bandera en la configuración de Puppeteer causa desconexiones inmediatas del protocolo de depuración en versiones modernas de Chrome (utilizadas por Electron 30).
*   **Bloqueo de Sesión**: Instancias anteriores cerradas de forma incorrecta dejaban archivos `lockfile` y procesos zombis de Chrome bloqueando la carpeta de datos.

### Solución Definitiva:
1.  **Eliminación de Flags**: Se eliminó `--single-process` de los argumentos de lanzamiento en `src/main/providers/whatsapp/client/session.js`.
2.  **Sistema Anti-Zombies**: Se implementó una lógica de reparación de sesión que mata procesos huérfanos y elimina archivos de bloqueo (`SingletonLock`, `DevToolsActivePort`) antes de cada arranque.

---

## 💡 Lecciones para el Futuro:
1.  **Directo al Archivo**: En Windows, lanza siempre Electron apuntando al archivo `.js` principal, no al directorio `.`.
2.  **CWD sobre AppPath**: Para cargar recursos locales en desarrollo, `process.cwd()` es más robusto que `app.getAppPath()`.
3.  **Higiene de Procesos**: Puppeteer en Electron requiere una limpieza agresiva de procesos antes de reintentar una conexión.

---
*Este reporte fue generado automáticamente tras la estabilización exitosa del sistema el 07/04/2026.*
