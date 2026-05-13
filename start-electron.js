const { spawn } = require('child_process');
const path = require('path');

// Eliminar ELECTRON_RUN_AS_NODE del entorno
delete process.env.ELECTRON_RUN_AS_NODE;

// Path al ejecutable de Electron
const electronPath = require('electron');

// Argumentos (el '.' para indicar el directorio actual)
const args = process.argv.slice(2);

// Ejecutar Electron
const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  process.exit(code);
});
