// ejecutor de pruebas simple para Node (sin dependencias)
const assert = require('assert');


const { getPermissionsForRole } = require('../security/roleMatrix');

// Verifica que el admin tiene todos los permisos
const adminPerms = getPermissionsForRole('admin');
assert(adminPerms.includes('MANAGE_USERS'));
assert(adminPerms.includes('VIEW_REPORTS'));

// Verifica el rol padre
const padrePerms = getPermissionsForRole('padre');
assert(padrePerms.includes('VIEW_COURSES'));

