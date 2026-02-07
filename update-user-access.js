const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const email = 'dal@crecoin.co';
    const teamId = '6934998c7038863976a7a5fd'; // BasaltHQ Team
    const roleId = '69353cceb2774739acf7b6b2'; // Admin Role

    console.log(`Updating user ${email}...`);

    const updatedUser = await prisma.users.update({
        where: { email },
        data: {
            team_id: teamId,
            roleId: roleId,
            team_role: 'ADMIN',
            is_admin: true, // Legacy compatibility
            is_account_admin: true, // Ensuring they have admin visibility
            userStatus: 'ACTIVE'
        }
    });

    console.log('User updated successfully:');
    console.log(JSON.stringify(updatedUser, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
