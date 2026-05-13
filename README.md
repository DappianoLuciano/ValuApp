# ML Provincia - Procesador de Facturas

Aplicación de escritorio para enriquecer el libro de facturas SKY con información de provincias de compradores desde reportes de MercadoLibre.

## 🚀 Características

- **Interfaz drag & drop** para cargar archivos Excel fácilmente
- **Cruce inteligente de datos** con tres métodos de matching:
  1. Por DNI (más confiable)
  2. Por nombre exacto
  3. Por nombre fuzzy (tolerante a tildes, mayúsculas y espacios)
- **Estadísticas detalladas** del procesamiento
- **Distribución por provincia** con porcentajes
- **Exportación a Excel** del archivo enriquecido

## 📋 Requisitos

- Node.js 18 o superior
- npm o yarn

## 🛠️ Instalación

1. Clona o descarga este repositorio

2. Instala las dependencias:
```bash
npm install
```

## 💻 Uso en Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run electron:dev
```

Esto iniciará Vite dev server y Electron simultáneamente con hot reload.

## 📦 Compilar para Producción

### Para macOS:
```bash
npm run electron:build
```

Esto generará el instalador `.dmg` y el archivo `.zip` en la carpeta `release/`.

### Para Windows:
```bash
npm run electron:build
```

Esto generará el instalador `.exe` en la carpeta `release/`.

## 📊 Formato de Archivos

### Archivo ML (MercadoLibre)
- Debe ser un archivo `.xlsx` exportado desde MercadoLibre
- Los encabezados deben estar en la **fila 6**
- Columnas requeridas:
  - `# de venta` (col 0)
  - `Comprador` (col 35)
  - `DNI` (col 37)
  - `Estado` (col 40) - contiene la provincia

### Archivo SKY (Libro de Facturas)
- Debe tener una hoja llamada `Hoja1`
- Columnas requeridas:
  - `Denominación Comprador`
  - `Nro. Doc. Comprador` (DNI)
  - Otras columnas: Fecha, Tipo, Punto de Venta, etc.

## 🔄 Proceso de Matching

La aplicación intenta encontrar la provincia de cada comprador en el siguiente orden:

1. **Match por DNI**: Cruza el DNI del archivo SKY con el DNI del archivo ML (más preciso)
2. **Match por nombre exacto**: Compara los nombres exactamente como aparecen
3. **Match por nombre fuzzy**: Normaliza ambos nombres (sin tildes, lowercase, sin espacios extras) y compara

Si no encuentra coincidencia, marca el registro como "No encontrado".

## 📤 Resultado

El archivo exportado contendrá:
- Todas las columnas originales del archivo SKY
- Una nueva columna `Provincia` con la provincia del comprador
- Mismo formato Excel (.xlsx)

## 🏗️ Tecnologías Utilizadas

- **Electron** - Framework para aplicaciones de escritorio
- **React** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **SheetJS (xlsx)** - Librería para manipular archivos Excel
- **electron-builder** - Para empaquetar la aplicación

## 📝 Scripts Disponibles

- `npm run dev` - Inicia Vite dev server (solo React)
- `npm run electron:dev` - Inicia la app completa en modo desarrollo
- `npm run build` - Compila el código React
- `npm run electron:build` - Compila la app completa para distribución

## 🐛 Troubleshooting

### La app no inicia
- Asegúrate de tener Node.js 18 o superior instalado
- Elimina `node_modules` y `package-lock.json`, luego ejecuta `npm install` nuevamente

### Error al procesar archivos
- Verifica que los archivos Excel tengan el formato correcto
- Asegúrate de que el archivo ML tenga los encabezados en la fila 6
- Verifica que el archivo SKY tenga una hoja llamada "Hoja1"

### El archivo exportado está vacío
- Revisa que los archivos originales tengan datos válidos
- Verifica que las columnas requeridas existan en ambos archivos

## 📄 Licencia

MIT
