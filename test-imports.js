import electron from 'electron';
import * as electronStar from 'electron';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('--- DIAGNÓSTICO DE IMPORTACIÓN ---');
console.log('1. import electron from "electron":', typeof electron, electron ? 'OK' : 'NULL');
if (electron && typeof electron === 'object') {
    console.log('   - Propiedades:', Object.keys(electron).slice(0, 5), '...');
    console.log('   - app:', typeof electron.app);
} else {
    console.log('   - Valor:', electron);
}

console.log('\n2. import * as electronStar from "electron":', typeof electronStar);
console.log('   - app:', typeof electronStar.app);

console.log('\n3. require("electron"):', typeof require('electron'));
const reqElectron = require('electron');
if (typeof reqElectron === 'object') {
    console.log('   - app:', typeof reqElectron.app);
} else {
    console.log('   - Valor:', reqElectron);
}
console.log('-----------------------------------');
process.exit(0);
