#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const { exec } = require('child_process');
const tar = require('tar');

const VERSION = process.env.MDBOOK_VERSION || '0.4.37'; // replace with the version you want
const MDBOOK_HASH = process.env.MDBOOK_HASH || "93f9a98032be3f4b7b4bab42fdc97d58b5d69d81eef910a5c8fa68e03fbf8a8d";
const url = `https://github.com/rust-lang/mdBook/releases/download/v${VERSION}/mdbook-v${VERSION}-x86_64-unknown-linux-gnu.tar.gz`;

async function downloadFile(url, path) {
    const writer = fs.createWriteStream(path);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function calculateHash(path) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(path);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

async function main() {
    const buildPath = './build';
    try {
        await fsp.mkdir(buildPath, { recursive: true })
    } catch (e) {
        console.error(`👎️ Could not create build directory ${e}`);
        process.exit(2);
    }
    const zipLoc = `${buildPath}/mdbook.tar.gz`;
    await downloadFile(url, zipLoc);
    const hash = await calculateHash(zipLoc);
    if (hash !== MDBOOK_HASH) {
        console.error(`👎️ Hash mismatch. expected ${MDBOOK_HASH} but got ${hash}`);
        process.exit(1);
    }
    console.log(`👍️ MDBook release hash matches ${hash}`);
    await tar.x({ file: zipLoc, C: buildPath });
    exec(`${buildPath}/mdbook build -d ./book`, (error, stdout, stderr) => {
        if (error) {
            console.error(`👎️ exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

main().catch(console.error);
