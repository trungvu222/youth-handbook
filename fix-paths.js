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
  content = content.replace(/href="\/dong-son/g, `href="${prefix}/dong-son`);
  content = content.replace(/src="\/dong-son/g, `src="${prefix}/dong-son`);
  
  // Handle url() in CSS
  content = content.replace(/url\(\/_next\//g, `url(${prefix}/_next/`);
  content = content.replace(/url\(\/dong-son/g, `url(${prefix}/dong-son`);
  content = content.replace(/url\(\/placeholder/g, `url(${prefix}/placeholder`);
  content = content.replace(/url\("\/dong-son/g, `url("${prefix}/dong-son`);
  content = content.replace(/url\("\/placeholder/g, `url("${prefix}/placeholder`);
  content = content.replace(/url\('\/dong-son/g, `url('${prefix}/dong-son`);
  content = content.replace(/url\('\/placeholder/g, `url('${prefix}/placeholder`);
  
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
  content = content.replace(/"\/dong-son-pattern\.jpg"/g, `"${prefix}/dong-son-pattern.jpg"`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${filePath}`);
}

// Function to fix paths in CSS files
function fixCssPaths(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixCssPaths(filePath);
    } else if (file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix background-image url paths
      content = content.replace(/url\(\/dong-son/g, 'url(../../dong-son');
      content = content.replace(/url\("\/dong-son/g, 'url("../../dong-son');
      content = content.replace(/url\('\/dong-son/g, "url('../../dong-son");
      content = content.replace(/url\(\/placeholder/g, 'url(../../placeholder');
      content = content.replace(/url\("\/placeholder/g, 'url("../../placeholder');
      content = content.replace(/url\('\/placeholder/g, "url('../../placeholder");
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed CSS: ${filePath}`);
    }
  }
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

// Also fix CSS files
const nextDir = path.join(outDir, '_next');
if (fs.existsSync(nextDir)) {
  console.log('Fixing CSS files...');
  fixCssPaths(nextDir);
}

console.log('Done! All paths fixed for Capacitor.');
