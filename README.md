# StreamView 📡

Visualizador web que combina un stream de **OK.RU** con el **chat de Twitch** en un solo layout, sin instalaciones ni backend.

## 🖥️ Vista rápida

```
┌──────────────────────────────────────────────┬──────────────┐
│  URL OK.RU  [___________________]  Canal Twitch [______] ▶  │
├────────────────────────────────────┬─────────────────────────┤
│                                    │  CHAT  canal_twitch     │
│         iframe OK.RU               │                         │
│         (stream principal)         │   (chat embed Twitch)   │
│                                    │                         │
└────────────────────────────────────┴─────────────────────────┘
```

## 🚀 Deploy en GitHub Pages (paso a paso)

### 1. Crear el repositorio

```bash
git init
git add .
git commit -m "init: StreamView"
```

Ve a [github.com/new](https://github.com/new), crea un repo (ej. `stream-viewer`) y sube el código:

```bash
git remote add origin https://github.com/TU_USUARIO/stream-viewer.git
git branch -M main
git push -u origin main
```

### 2. Activar GitHub Pages

1. En tu repo → **Settings** → **Pages**
2. En *Source* selecciona **Deploy from a branch**
3. Rama: `main` / Carpeta: `/ (root)`
4. Pulsa **Save**

Tu web estará en:
```
https://TU_USUARIO.github.io/stream-viewer/
```

### 3. ⚠️ Importante: el dominio del `parent` de Twitch

El chat de Twitch requiere que el parámetro `parent` coincida con el dominio donde está alojada la web.  
El código detecta `window.location.hostname` automáticamente, así que **en GitHub Pages funcionará solo**.

Si la usas en local (`file://`), el chat de Twitch no aparecerá por restricciones de Twitch. Para testear en local usa:

```bash
npx serve .
# → http://localhost:3000
```

Y asegúrate de que el canal que introduces no tiene restricciones de embed.

## 📁 Archivos

```
stream-viewer/
├── index.html   # Estructura
├── style.css    # Estilos (dark mode gaming)
├── app.js       # Lógica de carga e iframe
└── README.md
```

## 🎮 Uso

1. Pega la URL del stream de OK.RU (ej. `https://ok.ru/live/123456789`)
2. Escribe el nombre del canal de Twitch (ej. `psykez` o la URL completa)
3. Pulsa **▶ Cargar** o presiona **Enter**

Los valores se guardan automáticamente en `localStorage` para que no tengas que volver a introducirlos.

## 📱 Responsive

En móvil el layout cambia a una columna: video arriba, chat debajo.

---

MIT License
