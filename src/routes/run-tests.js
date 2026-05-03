// simple test runner for Node (no deps)
const assert = require('assert');

console.log('Running basic security tests...');

const { getPermissionsForRole } = require('../security/roleMatrix');

// Test admin has all permissions
const adminPerms = getPermissionsForRole('admin');
assert(adminPerms.includes('MANAGE_USERS'));
assert(adminPerms.includes('VIEW_REPORTS'));

// Test padre role
const padrePerms = getPermissionsForRole('padre');
assert(padrePerms.includes('VIEW_COURSES'));

console.log('Security tests passed ✔');