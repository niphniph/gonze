const fs = require('fs');
const path = require('path');

function moveFolder(folderName) {
    const src = path.join(__dirname, 'dist', 'tracker', folderName);
    const dest = path.join(__dirname, 'dist', folderName);

    if (fs.existsSync(src)) {
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
        }
        fs.renameSync(src, dest);
        console.log(`Successfully moved ${folderName} to dist/${folderName} for root subpath hosting!`);
    } else {
        console.warn(`Warning: dist/tracker/${folderName} not found`);
    }
}

function moveFile(fileName) {
    const src = path.join(__dirname, 'dist', 'tracker', fileName);
    const dest = path.join(__dirname, 'dist', fileName);

    if (fs.existsSync(src)) {
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { force: true });
        }
        fs.renameSync(src, dest);
        console.log(`Successfully moved ${fileName} to dist/${fileName} for root hosting!`);
    } else {
        console.warn(`Warning: dist/tracker/${fileName} not found`);
    }
}

moveFolder('bottleorder');
moveFolder('ninokvariani');
moveFolder('ninokvariani2');
moveFolder('diet');
moveFolder('portfolio');
moveFile('_redirects');

