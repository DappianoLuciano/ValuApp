# 📦 Cómo Compilar para macOS

## Opción 1: GitHub Actions (Recomendado) ✅

GitHub Actions compilará automáticamente tu aplicación para **macOS y Windows** en la nube.

### Pasos:

1. **Crea un repositorio en GitHub** (si no lo tienes):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Crea el repositorio en GitHub.com**:
   - Ve a https://github.com/new
   - Crea un nuevo repositorio (puede ser privado)
   - Copia la URL del repositorio

3. **Sube el código a GitHub**:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

4. **GitHub Actions compilará automáticamente**:
   - Ve a tu repositorio en GitHub
   - Click en la pestaña "Actions"
   - Verás el workflow "Build/Release" ejecutándose
   - Espera 5-10 minutos a que termine

5. **Descarga los instaladores**:
   - En la página de Actions, click en el workflow completado
   - Baja hasta "Artifacts"
   - Descarga:
     - `macos-installers` → Contiene el `.dmg` para Mac
     - `windows-installers` → Contiene el `.exe` para Windows

---

## Opción 2: Compilar Manualmente en una Mac

Si tienes acceso a una Mac:

```bash
# 1. Copia el proyecto a la Mac
# 2. Instala dependencias
npm install

# 3. Compila
npm run electron:build
```

Los instaladores estarán en la carpeta `release/`:
- `ML Provincia.dmg` - Instalador para macOS
- `ML Provincia-mac.zip` - Versión portable

---

## 📝 Notas Importantes

- **GitHub Actions es GRATIS** para repositorios públicos
- Para repositorios privados tienes **2000 minutos gratis/mes**
- Cada build toma ~5-10 minutos
- Se generan instaladores para macOS (.dmg) y Windows (.exe) automáticamente

---

## 🚀 Ejecutar en Desarrollo

Para probar la app sin compilar:

```bash
npm run electron:dev
```

---

## ❓ Problemas Comunes

**P: El workflow falla en GitHub Actions**
R: Verifica que el archivo `.github/workflows/build.yml` esté en el repositorio

**P: No veo los artifacts**
R: Asegúrate de que el workflow haya terminado exitosamente (✅ verde)

**P: El .dmg no abre en Mac**
R: En Mac, click derecho → Abrir (la primera vez, por seguridad de macOS)
