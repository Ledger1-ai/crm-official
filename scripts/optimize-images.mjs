import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_DIR = './public';
const MAX_WIDTH = 1920;
const QUALITY = 80;

// List of specific large files we found to ensure we tackle them
const PRIORITY_FILES = [
    'public/images/team/member1.png',
    'public/images/team/member2.png',
    'public/images/team/member3.png',
    'public/images/team/member4.png',
    'public/images/team/member5.png',
    'public/images/team/member6.png',
    'public/apple-touch-icon.png',
    'public/apple-touch-icon-precomposed.png'
];

async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

    try {
        const stats = fs.statSync(filePath);
        if (stats.size < 500000) { // Skip files smaller than 500KB unless they are priority
            if (!PRIORITY_FILES.includes(filePath)) return;
        }

        console.log(`Optimizing: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

        const image = sharp(filePath);
        const metadata = await image.metadata();

        let pipeline = image;

        // Resize if too huge
        if (metadata.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH);
        }

        // Compress
        if (ext === '.png') {
            pipeline = pipeline.png({ quality: QUALITY, compressionLevel: 9, palette: true });
        } else {
            pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
        }

        // Write to temp buffer first to safety check
        const buffer = await pipeline.toBuffer();

        // Overwrite original
        fs.writeFileSync(filePath, buffer);

        const newStats = fs.statSync(filePath);
        const saved = stats.size - newStats.size;
        console.log(`  -> Saved ${(saved / 1024 / 1024).toFixed(2)} MB (${((saved / stats.size) * 100).toFixed(0)}%)`);

    } catch (error) {
        console.error(`Error optimizing ${filePath}:`, error.message);
    }
}

async function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await walkDir(filePath);
        } else {
            // Check if it's in our priority list OR regular crawl
            // Using relative path for priority check
            const relPath = path.relative(process.cwd(), filePath);
            if (PRIORITY_FILES.includes(relPath) || PRIORITY_FILES.some(pf => filePath.endsWith(pf))) {
                await optimizeImage(filePath);
            } else {
                await optimizeImage(filePath);
            }
        }
    }
}

console.log("Starting image optimization...");
walkDir(TARGET_DIR).then(() => console.log("Done!"));
