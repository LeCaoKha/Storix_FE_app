const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let allFiles = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
                allFiles = allFiles.concat(getFiles(fullPath));
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            allFiles.push(fullPath);
        }
    }
    return allFiles;
}

const dirs = ['features', 'components', 'app', 'services', 'hooks', 'constants'];
for (const d of dirs) {
    if (fs.existsSync(d)) {
        const files = getFiles(d);
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const openBrace = (content.match(/{/g) || []).length;
            const closeBrace = (content.match(/}/g) || []).length;
            const openParen = (content.match(/\(/g) || []).length;
            const closeParen = (content.match(/\)/g) || []).length;

            if (openBrace !== closeBrace || openParen !== closeParen) {
                console.log(`${file}: {${openBrace} vs ${closeBrace}} | (${openParen} vs ${closeParen})`);
            }
        }
    }
}
