
import fs from 'fs';
import path from 'path';
import { CRM_MODULES } from '../lib/role-permissions';

/**
 * permission-check.ts
 * 
 * This script ensures that every physical route in `app/(routes)/crm`
 * has a corresponding entry in `lib/role-permissions.ts`.
 * 
 * It prevents "Shadow IT" pages that are reachable but ungated.
 */

const CRM_ROUTES_ROOT = path.join(process.cwd(), 'app', '(routes)', 'crm');

function getDirectories(source: string) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// Ignore utility folders that aren't pages
const IGNORED_FOLDERS = [
    'components',
    'layout',
    'api',
    'utils',
    'hooks',
    'types',
    'styles'
];

// Helper to flatten modules for easy searching
function getAllModuleIds(modules: typeof CRM_MODULES) {
    const ids: string[] = [];
    // We also want to check if the *route* matches, not just the ID.
    // But for top-level, we often use the ID as the key.
    // Let's gather top-level IDs and Routes.
    return modules.map(m => ({
        id: m.id,
        route: m.route
    }));
}

async function main() {
    console.log("🔍 Starting Permission Integrity Check...");

    if (!fs.existsSync(CRM_ROUTES_ROOT)) {
        console.error(`❌ CRM Routes directory not found at: ${CRM_ROUTES_ROOT}`);
        process.exit(1);
    }

    // 1. Get Physical Routes
    const physicalRoutes = getDirectories(CRM_ROUTES_ROOT)
        .filter(dir => !IGNORED_FOLDERS.includes(dir));

    console.log(`📂 Found ${physicalRoutes.length} physical CRM routes.`);

    // 2. Get Configured Modules
    const configuredModules = getAllModuleIds(CRM_MODULES);
    const configuredRoutes = configuredModules.map(m => m.route).filter(Boolean);
    const configuredIds = configuredModules.map(m => m.id);

    // 3. Compare
    const errors: string[] = [];

    physicalRoutes.forEach(dir => {
        // We expect either a route like '/crm/{dir}' OR an ID that matches '{dir}'
        // Ideally, we check if '/crm/' + dir exists in the mapped routes.

        const expectedRoute = `/crm/${dir}`;
        const isMapped = configuredRoutes.includes(expectedRoute) || configuredIds.includes(dir);

        if (!isMapped) {
            errors.push(`❌ UNGATED ROUTE DETECTED: "${dir}" exists in filesystem but is not in CRM_MODULES.`);
        } else {
            // console.log(`✅ Verified: ${dir}`);
        }
    });

    if (errors.length > 0) {
        console.error("\n🚨 PERMISSION INTEGRITY FAILURE 🚨");
        console.error("The following routes are missing from the permission system:");
        errors.forEach(e => console.error(e));
        console.error("\nFix this by adding them to `lib/role-permissions.ts`.\n");
        process.exit(1); // Fail the build
    } else {
        console.log("✅ Permission Integrity Verified. All routes are gated.");
        process.exit(0);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
