import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Función para normalizar strings (quitar tildes, lowercase, espacios extras)
function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/\s+/g, ' ')
    .trim();
}

function App() {
  const [mlFile, setMlFile] = useState(null);
  const [skyFile, setSkyFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const mlInputRef = useRef(null);
  const skyInputRef = useRef(null);

  // Handlers para drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, setFile) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setFile(file);
    }
  };

  // Handler para selección de archivo
  const handleFileSelect = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  // Handler para botón de selección (usando Electron dialog si está disponible)
  const handleBrowseClick = async (setFile) => {
    if (window.electronAPI) {
      const filePath = await window.electronAPI.openFileDialog([
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ]);
      if (filePath) {
        // En Electron, necesitamos crear un File object desde el path
        // Como no podemos acceder directamente al fs desde renderer,
        // usamos el input file como fallback
        alert('Por favor usa el botón "Seleccionar archivo" o arrastra el archivo');
      }
    }
  };

  // Procesar archivos
  const processFiles = async () => {
    if (!mlFile || !skyFile) return;

    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      // Leer archivo ML
      const mlBuffer = await mlFile.arrayBuffer();
      const mlWorkbook = XLSX.read(mlBuffer, { type: 'array' });
      const mlSheet = mlWorkbook.Sheets[mlWorkbook.SheetNames[0]];
      const mlAllRows = XLSX.utils.sheet_to_json(mlSheet, { header: 1, defval: '' });

      // Headers en fila 6 (índice 5), datos desde fila 7 (índice 6)
      const mlHeaders = mlAllRows[5];
      const mlDataRows = mlAllRows.slice(6);

      // Crear un mapa de objetos para facilitar el acceso
      const mlData = mlDataRows.map(row => {
        const obj = {};
        mlHeaders.forEach((header, idx) => {
          obj[header] = row[idx];
        });
        return obj;
      });

      // Crear índices para búsqueda rápida
      const mlByDNI = new Map();
      const mlByNameExact = new Map();
      const mlByNameNormalized = new Map();

      mlData.forEach(row => {
        const dni = String(row['DNI'] || '').trim();
        const comprador = String(row['Comprador'] || '').trim();
        const provincia = String(row['Estado'] || '').trim();

        if (dni) {
          mlByDNI.set(dni, provincia);
        }
        if (comprador) {
          mlByNameExact.set(comprador, provincia);
          mlByNameNormalized.set(normalize(comprador), provincia);
        }
      });

      // Leer archivo SKY
      const skyBuffer = await skyFile.arrayBuffer();
      const skyWorkbook = XLSX.read(skyBuffer, { type: 'array' });
      const skySheet = skyWorkbook.Sheets['Hoja1'] || skyWorkbook.Sheets[skyWorkbook.SheetNames[0]];
      const skyData = XLSX.utils.sheet_to_json(skySheet, { defval: '' });

      // Estadísticas
      let matchByDNI = 0;
      let matchByNameExact = 0;
      let matchByNameFuzzy = 0;
      let noMatch = 0;
      const provinceCount = {};

      // Procesar cada fila de SKY
      const enrichedData = skyData.map(row => {
        const dni = String(row['Nro. Doc. Comprador'] || '').trim();
        const nombre = String(row['Denominación Comprador'] || '').trim();
        let provincia = '';
        let matchType = '';

        // 1. Buscar por DNI
        if (dni && mlByDNI.has(dni)) {
          provincia = mlByDNI.get(dni);
          matchByDNI++;
          matchType = 'DNI';
        }
        // 2. Buscar por nombre exacto
        else if (nombre && mlByNameExact.has(nombre)) {
          provincia = mlByNameExact.get(nombre);
          matchByNameExact++;
          matchType = 'Nombre exacto';
        }
        // 3. Buscar por nombre normalizado (fuzzy)
        else if (nombre) {
          const nombreNorm = normalize(nombre);
          if (mlByNameNormalized.has(nombreNorm)) {
            provincia = mlByNameNormalized.get(nombreNorm);
            matchByNameFuzzy++;
            matchType = 'Nombre fuzzy';
          } else {
            provincia = 'Buenos Aires';
            noMatch++;
            matchType = 'Sin match (entrega en sucursal)';
          }
        } else {
          provincia = 'Buenos Aires';
          noMatch++;
          matchType = 'Sin match (entrega en sucursal)';
        }

        // Si la provincia está vacía o es null, asignar Buenos Aires (entrega en sucursal)
        if (!provincia || provincia.trim() === '') {
          provincia = 'Buenos Aires';
        }

        // Contar provincias
        if (provincia) {
          provinceCount[provincia] = (provinceCount[provincia] || 0) + 1;
        }

        // Agregar columna Provincia
        return {
          ...row,
          Provincia: provincia
        };
      });

      // Guardar datos procesados para exportar
      setProcessedData({ workbook: skyWorkbook, data: enrichedData, sheetName: 'Hoja1' });

      // Preparar resultados
      const provinceStats = Object.entries(provinceCount)
        .sort((a, b) => b[1] - a[1])
        .map(([provincia, cantidad]) => ({ provincia, cantidad }));

      setResults({
        total: skyData.length,
        matchByDNI,
        matchByNameExact,
        matchByNameFuzzy,
        noMatch,
        provinceStats
      });

    } catch (err) {
      console.error('Error procesando archivos:', err);
      setError(`Error al procesar archivos: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Exportar resultado
  const exportResult = async () => {
    if (!processedData) return;

    try {
      // Crear nuevo workbook con los datos enriquecidos
      const ws = XLSX.utils.json_to_sheet(processedData.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, processedData.sheetName);

      // Generar archivo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });

      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SKY_con_Provincia.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exportando archivo:', err);
      setError(`Error al exportar archivo: ${err.message}`);
    }
  };

  // Cancelar y limpiar todo
  const handleCancel = () => {
    setMlFile(null);
    setSkyFile(null);
    setResults(null);
    setProcessedData(null);
    setError(null);

    // Limpiar los inputs de archivo para permitir resubir
    if (mlInputRef.current) mlInputRef.current.value = '';
    if (skyInputRef.current) skyInputRef.current.value = '';
  };

  return (
    <div className="app">
      <div className="header">
        <h1>ML Provincia - Procesador de Facturas</h1>
        <p>Enriquece tu libro de facturas SKY con provincias de MercadoLibre</p>
      </div>

      <div className="file-section">
        {/* Archivo ML */}
        <div
          className={`file-uploader ${mlFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setMlFile)}
          onClick={() => mlInputRef.current?.click()}
        >
          <h3>📊 Reporte MercadoLibre</h3>
          <p>Arrastra el archivo .xlsx o haz clic para seleccionar</p>
          <input
            ref={mlInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileSelect(e, setMlFile)}
            style={{ display: 'none' }}
          />
          {mlFile && <div className="file-name">✓ {mlFile.name}</div>}
        </div>

        {/* Archivo SKY */}
        <div
          className={`file-uploader ${skyFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setSkyFile)}
          onClick={() => skyInputRef.current?.click()}
        >
          <h3>📋 Libro de Facturas SKY</h3>
          <p>Arrastra el archivo .xlsx o haz clic para seleccionar</p>
          <input
            ref={skyInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileSelect(e, setSkyFile)}
            style={{ display: 'none' }}
          />
          {skyFile && <div className="file-name">✓ {skyFile.name}</div>}
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={processFiles}
          disabled={!mlFile || !skyFile || processing}
        >
          {processing ? 'Procesando...' : '🚀 Procesar'}
        </button>
        {results && (
          <button
            className="btn btn-success"
            onClick={exportResult}
            disabled={!processedData}
          >
            💾 Exportar Resultado
          </button>
        )}
        {(mlFile || skyFile || results) && !processing && (
          <button
            className="btn btn-cancel"
            onClick={handleCancel}
          >
            ❌ Cancelar
          </button>
        )}
      </div>

      {processing && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Procesando archivos...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="results">
          <h2>📈 Resultados del Procesamiento</h2>

          <div className="stats">
            <div className="stat-card">
              <h3>Total de Registros</h3>
              <p>{results.total}</p>
            </div>
            <div className="stat-card">
              <h3>Match por DNI</h3>
              <p>{results.matchByDNI}</p>
            </div>
            <div className="stat-card">
              <h3>Match Nombre Exacto</h3>
              <p>{results.matchByNameExact}</p>
            </div>
            <div className="stat-card">
              <h3>Match Nombre Fuzzy</h3>
              <p>{results.matchByNameFuzzy}</p>
            </div>
            <div className="stat-card">
              <h3>Entrega en Sucursal</h3>
              <p>{results.noMatch}</p>
            </div>
          </div>

          {results.provinceStats.length > 0 && (
            <div className="province-table">
              <h3>Distribución por Provincia</h3>
              <table>
                <thead>
                  <tr>
                    <th>Provincia</th>
                    <th>Cantidad</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {results.provinceStats.map((stat, idx) => (
                    <tr key={idx}>
                      <td>{stat.provincia}</td>
                      <td>{stat.cantidad}</td>
                      <td>{((stat.cantidad / results.total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
