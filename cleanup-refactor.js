#!/usr/bin/env node
/**
 * Script para eliminar archivos .refactor del proyecto
 * Uso: node cleanup-refactor.js
 */

const fs = require('fs');
const path = require('path');

const REFACTOR_FILES = [
  'src/features/cursos/pages/CursoHubPage.refactor.jsx',
  'src/features/cursos/pages/CursoHubPage.refinal.jsx',
  'src/features/cursos/pages/useCursoHub.refactor.js',
  'src/features/cursos/pages/useCursoTareas.refactor.js',
  'src/features/cursos/pages/useCursoEntregas.refactor.js',
  'src/features/cursos/pages/cursoMappers.refactor.js',
  'consolidate.js', // Este script también puede auto-eliminarse
];

console.log('\n🧹 Limpiando archivos .refactor...\n');

let deleted = 0;
let errors = 0;

REFACTOR_FILES.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Eliminado: ${file}`);
      deleted++;
    }
  } catch (err) {
    console.error(`✗ Error al eliminar ${file}: ${err.message}`);
    errors++;
  }
});

console.log(`\n✅ Resultado: ${deleted} archivos eliminados${errors > 0 ? `, ${errors} errores` : ''}\n`);

// Verificar estructura final
console.log('📁 Estructura final:');
const hooksPath = path.join(process.cwd(), 'src/features/cursos/hooks');
const utilsPath = path.join(process.cwd(), 'src/features/cursos/utils');
const pagesPath = path.join(process.cwd(), 'src/features/cursos/pages');

if (fs.existsSync(hooksPath)) {
  const hooks = fs.readdirSync(hooksPath).filter(f => !f.startsWith('.'));
  console.log(`  hooks/ (${hooks.length} archivos)`);
}

if (fs.existsSync(utilsPath)) {
  const utils = fs.readdirSync(utilsPath).filter(f => !f.startsWith('.'));
  console.log(`  utils/ (${utils.length} archivos)`);
}

if (fs.existsSync(pagesPath)) {
  const pages = fs.readdirSync(pagesPath).filter(f => !f.startsWith('.') && !f.endsWith('.refactor') && !f.endsWith('.refinal'));
  console.log(`  pages/ (${pages.length} archivos producción)`);
}

console.log('\n✨ Limpieza completada\n');
