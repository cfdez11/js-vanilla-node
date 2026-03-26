# VexJS Extension — Instrucciones de Redeploy

## Requisitos previos

- Node.js instalado
- `@vscode/vsce` instalado globalmente:

```bash
npm install -g @vscode/vsce
```

---

## 1. Actualizar la versión

Edita `package.json` y actualiza el campo `version` siguiendo semver:

```json
"version": "0.2.0"
```

---

## 2. Empaquetar la extensión

Desde la carpeta `vscode-extension/`:

```bash
cd vscode-extension
vsce package
```

Esto genera un archivo `vexjs-x.x.x.vsix` en el mismo directorio.

---

## 3. Instalar localmente (para pruebas)

```bash
code --install-extension vexjs-x.x.x.vsix
```

O desde VS Code:
1. `Ctrl+Shift+P` / `Cmd+Shift+P`
2. **Extensions: Install from VSIX...**
3. Seleccionar el `.vsix` generado

Reinicia VS Code para aplicar los cambios.

---

## 4. Publicar en el Marketplace (opcional)

### 4a. Crear Personal Access Token en Azure DevOps

1. Ve a [dev.azure.com](https://dev.azure.com) e inicia sesión
2. Icono de usuario → **Personal Access Tokens**
3. Crea un token con scope **Marketplace → Manage**
4. Copia el token

### 4b. Autenticarse con `vsce`

```bash
vsce login <nombre-publisher>
# Introduce el token cuando lo pida
```

El publisher debe coincidir con el campo `"publisher"` en `package.json`.

### 4c. Publicar

```bash
vsce publish
```

O para publicar una versión específica sin editar `package.json`:

```bash
vsce publish minor   # sube versión minor automáticamente
vsce publish patch   # sube versión patch automáticamente
```

---

## 5. Actualizar el repositorio en `package.json`

Antes de publicar, asegúrate de que la URL del repositorio es correcta:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/TU_USUARIO/TU_REPO"
}
```

---

## Estructura de archivos relevante

```
vscode-extension/
├── package.json              # Manifiesto de la extensión
├── language-configuration.json
├── icon.png
├── syntaxes/
│   └── vexjs.tmLanguage.json # Gramática de sintaxis
├── README.md
└── vexjs-x.x.x.vsix          # Artefacto generado (no commitear)
```

---

## Notas

- Los archivos `.vsix` no deben commitearse al repositorio. Agrégalos a `.gitignore` si es necesario:
  ```
  vscode-extension/*.vsix
  ```
- Para probar cambios en la gramática sin reempaquetar, abre la carpeta `vscode-extension/` directamente en VS Code y pulsa `F5` para lanzar una ventana de extensión en modo desarrollo.
