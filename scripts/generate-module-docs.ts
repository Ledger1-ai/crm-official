
import fs from 'fs';
import path from 'path';

const CRM_ROOT = path.join(process.cwd(), 'app', '(routes)', 'crm');
const FEATURES_FILE = path.join(process.cwd(), 'CRM_FEATURES_OVERVIEW.md');

/**
 * Ignore these folders when scanning for modules
 */
const IGNORE = ['components', 'layout', 'api', 'utils', 'hooks', 'types', 'styles'];

function scanModules() {
    console.log('🔍 Scanning CRM Modules (Features)...');

    if (!fs.existsSync(CRM_ROOT)) {
        console.error('❌ CRM Root not found:', CRM_ROOT);
        process.exit(1);
    }

    const items = fs.readdirSync(CRM_ROOT, { withFileTypes: true });
    const modules: string[] = [];

    items.forEach((item) => {
        if (item.isDirectory() && !IGNORE.includes(item.name)) {
            modules.push(item.name);
        }
    });

    console.log('✅ Found modules:', modules);

    // Build the Markdown Content
    const title = "# CRM Core Feature List";
    const lastUpdate = `> Last Scan: ${new Date().toLocaleString()}\n`;
    const description = "Automatically updated list of functional modules found in the CRM filesystem.\n";

    let content = `${title}\n\n${lastUpdate}\n${description}\n`;

    content += "## Active Feature Modules\n\n";
    modules.forEach(mod => {
        const capitalized = mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-/g, ' ');
        content += `- **${capitalized}**: Located in \`/crm/${mod}\`\n`;
    });

    content += "\n## System Requirements\n- Every module listed here should have a corresponding policy in `lib/role-permissions.ts`.\n";

    fs.writeFileSync(FEATURES_FILE, content);
    console.log('📝 Updated CRM_FEATURES_OVERVIEW.md');
}

scanModules();
