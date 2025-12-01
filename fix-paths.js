/**
 * Script to fix absolute paths to relative paths for Capacitor
 * This fixes CSS/JS loading issues in Android WebView
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');

// Function to recursively find all HTML files
function findHtmlFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to fix paths in HTML file
function fixHtmlPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Calculate relative prefix based on file depth
  const relativePath = path.relative(path.dirname(filePath), outDir);
  const prefix = relativePath === '' ? '.' : relativePath.replace(/\\/g, '/');
  
  // Replace ALL absolute paths with relative paths
  // Handle href and src attributes
  content = content.replace(/href="\/_next\//g, `href="${prefix}/_next/`);
  content = content.replace(/src="\/_next\//g, `src="${prefix}/_next/`);
  content = content.replace(/href="\/manifest\.json/g, `href="${prefix}/manifest.json`);
  content = content.replace(/href="\/placeholder/g, `href="${prefix}/placeholder`);
  content = content.replace(/src="\/placeholder/g, `src="${prefix}/placeholder`);
  
  // Handle escaped quotes in JSON/script content (critical for RSC data)
  content = content.replace(/\\"href\\":\"\/_next\//g, `\\"href\\":\\"${prefix}/_next/`);
  content = content.replace(/\\"href\\":\\"\/manifest\.json\\"/g, `\\"href\\":\\"${prefix}/manifest.json\\"`);
  content = content.replace(/\\"href\\":\\"\/placeholder/g, `\\"href\\":\\"${prefix}/placeholder`);
  content = content.replace(/\\"src\\":\\"\/placeholder/g, `\\"src\\":\\"${prefix}/placeholder`);
  
  // Handle single quotes
  content = content.replace(/href='\/_next\//g, `href='${prefix}/_next/`);
  content = content.replace(/src='\/_next\//g, `src='${prefix}/_next/`);
  
  // Handle inline script references
  content = content.replace(/"\/_next\//g, `"${prefix}/_next/`);
  content = content.replace(/'\/manifest\.json/g, `'${prefix}/manifest.json`);
  
  // Handle URLs in JSON without escaped quotes
  content = content.replace(/"\/manifest\.json"/g, `"${prefix}/manifest.json"`);
  content = content.replace(/"\/placeholder-logo\.png"/g, `"${prefix}/placeholder-logo.png"`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${filePath}`);
}

// Main execution
console.log('Fixing absolute paths for Capacitor...');
console.log('Output directory:', outDir);

if (!fs.existsSync(outDir)) {
  console.error('Error: out directory does not exist!');
  process.exit(1);
}

const htmlFiles = findHtmlFiles(outDir);
console.log(`Found ${htmlFiles.length} HTML files`);

for (const file of htmlFiles) {
  fixHtmlPaths(file);
}

console.log('Done! All paths fixed for Capacitor.');
