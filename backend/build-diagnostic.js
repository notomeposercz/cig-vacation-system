const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Výpis diagnostických informací
console.log('=== Build Diagnostic Information ===');
console.log(`Node Version: ${process.version}`);
console.log(`Current Directory: ${process.cwd()}`);

// Kontrola existence souborů
const criticalFiles = ['package.json', 'tsconfig.json', 'src/main.ts', 'vercel.json'];
console.log('\nVerifying critical files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.resolve(process.cwd(), file));
  console.log(`- ${file}: ${exists ? 'Found' : 'MISSING'}`);
});

// Kontrola nainstalovaných závislostí
console.log('\nVerifying installed packages:');
try {
  const packages = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'))).dependencies;
  const criticalPackages = ['@nestjs/core', '@nestjs/common', '@nestjs/config'];
  
  criticalPackages.forEach(pkg => {
    console.log(`- ${pkg}: ${packages[pkg] ? packages[pkg] : 'MISSING'}`);
  });
} catch (err) {
  console.error('Failed to check packages:', err.message);
}

// Pokus o spuštění build procesu s detailním výpisem
console.log('\nAttempting build process with verbose logging:');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build successful!');
} catch (err) {
  console.error('Build failed:', err.message);
}
