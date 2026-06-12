const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'dist', 'tracker', 'bottleorder');
const dest = path.join(__dirname, 'dist', 'bottleorder');

if (fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
    console.log('Successfully moved bottleorder to dist/bottleorder for root subpath hosting!');
} else {
    console.warn('Warning: dist/tracker/bottleorder not found');
}
