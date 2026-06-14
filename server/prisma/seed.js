/**
 * Prisma Seed Script
 *
 * Creates demo data for testing:
 * - 3 users (Alice, Bob, Charlie) with bcrypt-hashed passwords
 * - 1 group ("Weekend Trip") created by Alice
 * - All 3 users added as group members
 *
 * Run: npm run seed
 * Password for all demo users: "password123"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (order matters due to foreign keys)
  await prisma.expenseComment.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // Hash password (same for all demo users)
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create 3 demo users
  const alice = await prisma.user.create({
    data: {
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash,
    },
  });
  console.log(`  ✅ Created user: ${alice.fullName} (${alice.email})`);

  const bob = await prisma.user.create({
    data: {
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      passwordHash,
    },
  });
  console.log(`  ✅ Created user: ${bob.fullName} (${bob.email})`);

  const charlie = await prisma.user.create({
    data: {
      fullName: 'Charlie Brown',
      email: 'charlie@example.com',
      passwordHash,
    },
  });
  console.log(`  ✅ Created user: ${charlie.fullName} (${charlie.email})`);

  // Create 1 demo group (created by Alice)
  const group = await prisma.group.create({
    data: {
      name: 'Weekend Trip',
      description: 'Goa trip with friends',
      createdById: alice.id,
    },
  });
  console.log(`  ✅ Created group: ${group.name}`);

  // Add all 3 users as group members
  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: alice.id },
      { groupId: group.id, userId: bob.id },
      { groupId: group.id, userId: charlie.id },
    ],
  });
  console.log('  ✅ Added all 3 users as group members');

  console.log('\n🎉 Seeding complete!');
  console.log('\nDemo credentials:');
  console.log('  Email: alice@example.com  | Password: password123');
  console.log('  Email: bob@example.com    | Password: password123');
  console.log('  Email: charlie@example.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
