
import fs from 'fs';
import path from 'path';

const API_ROOT = path.join(process.cwd(), 'app', 'api', 'v1', 'agent');
const DOCS_FILE = path.join(process.cwd(), 'AGENT_COMMERCE_GUIDE.md');

/**
 * recursively scans directory
 */
function scanDir(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDir(filePath, fileList);
        } else {
            if (file === 'route.ts') {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

function generateDocs() {
    console.log('🔍 Scanning Agent API routes...');

    if (!fs.existsSync(API_ROOT)) {
        console.error('❌ API Root not found:', API_ROOT);
        process.exit(1);
    }

    const routes = scanDir(API_ROOT);
    const endpoints: string[] = [];

    routes.forEach((routePath) => {
        // localized path relative to app root
        const relativePath = path.relative(process.cwd(), routePath);

        // Convert file path to URL path
        // app/api/v1/agent/catalog/route.ts -> /api/v1/agent/catalog
        let urlPath = relativePath
            .replace(/^app\//, '/')
            .replace(/\/route\.ts$/, '');

        // handle dynamic routes [slug] -> :slug
        urlPath = urlPath.replace(/\[([^\]]+)\]/g, ':$1');

        endpoints.push(urlPath);
    });

    console.log('✅ Found endpoints:', endpoints);

    // Update Markdown File
    if (fs.existsSync(DOCS_FILE)) {
        let content = fs.readFileSync(DOCS_FILE, 'utf-8');

        // Simple update logic: Append "Current Status" section if not present
        // Or replace an existing "Current Status" block
        const statusHeader = '## Current API Status (Auto-Generated)';
        const statusBlock = `${statusHeader}\nLast Checked: ${new Date().toISOString()}\n\n${endpoints.map(e => `- \`GET ${e}\``).join('\n')}\n`;

        if (content.includes(statusHeader)) {
            // Replace existing block
            const regex = new RegExp(`${statusHeader}[\\s\\S]*?(?=\n#|$)`, 'g');
            content = content.replace(regex, statusBlock);
        } else {
            // Append to end
            content += `\n${statusBlock}`;
        }

        fs.writeFileSync(DOCS_FILE, content);
        console.log('📝 Updated AGENT_COMMERCE_GUIDE.md');
    } else {
        console.warn('⚠️ AGENT_COMMERCE_GUIDE.md not found, skipping update.');
    }
}

generateDocs();
