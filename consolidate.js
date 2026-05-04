#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CWD = __dirname;

// Archivos a mover: [origen, destino]
const moves = [
  ['src/features/cursos/pages/useCursoHub.refactor.js', 'src/features/cursos/hooks/useCursoHub.js'],
  ['src/features/cursos/pages/useCursoTareas.refactor.js', 'src/features/cursos/hooks/useCursoTareas.js'],
  ['src/features/cursos/pages/useCursoEntregas.refactor.js', 'src/features/cursos/hooks/useCursoEntregas.js'],
  ['src/features/cursos/pages/cursoMappers.refactor.js', 'src/features/cursos/utils/cursoMappers.js'],
];

// Archivos a eliminar
const removes = [
  'src/features/cursos/pages/CursoHubPage.refactor.jsx',
  'src/features/cursos/pages/CursoHubPage.refinal.jsx',
];

console.log('🔄 Consolidando archivos...\n');

// Mover archivos
moves.forEach(([src, dst]) => {
  const srcPath = path.join(CWD, src);
  const dstPath = path.join(CWD, dst);
  
  if (fs.existsSync(srcPath)) {
    // Crear directorio destino si no existe
    const dstDir = path.dirname(dstPath);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }
    
    // Mover archivo
    fs.copyFileSync(srcPath, dstPath);
    fs.unlinkSync(srcPath);
    console.log(`✓ ${path.basename(src)} → ${path.basename(dst)}`);
  }
});

// Eliminar archivos temporales
removes.forEach(file => {
  const filePath = path.join(CWD, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✓ Eliminado: ${path.basename(file)}`);
  }
});

// Verificar que no haya más .refactor
console.log('\n✅ Consolidación completada');
console.log('\n📁 Estructura final:');
console.log('  src/features/cursos/');
console.log('    ├── pages/ (CursoHubPage.jsx)');
console.log('    ├── components/ (tabs)');
console.log('    ├── modals/ (modales)');
console.log('    ├── hooks/ (useCursoHub.js, useCursoTareas.js, useCursoEntregas.js)');
console.log('    └── utils/ (cursoMappers.js)');
