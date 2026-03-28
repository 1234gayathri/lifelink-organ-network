const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');
const oldUrl = 'http://localhost:5000';
const newUrl = 'https://lifelink-organ-network.onrender.com';

function replaceUrlInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldUrl)) {
        content = content.replace(new RegExp(oldUrl, 'g'), newUrl);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            replaceUrlInFile(fullPath);
        }
    }
}

walkDir(directoryPath);
console.log('All frontend URLs updated to the cloud!');
