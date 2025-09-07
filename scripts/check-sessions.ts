// Test script to check if sessions and verification tokens are being created
import { prisma } from "../src/lib/prisma";

async function checkSessionTables() {
  try {
    console.log("🔍 Checking database connectivity...");

    // Check if we can connect to the database
    await prisma.$connect();
    console.log("✅ Connected to database successfully");

    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);

    // Check sessions
    const sessionCount = await prisma.session.count();
    console.log(`📊 Sessions in database: ${sessionCount}`);

    // Check verification tokens
    const tokenCount = await prisma.verificationToken.count();
    console.log(`🔐 Verification tokens in database: ${tokenCount}`);

    // Check accounts
    const accountCount = await prisma.account.count();
    console.log(`🔗 Accounts in database: ${accountCount}`);

    // Show recent sessions if any exist
    if (sessionCount > 0) {
      const recentSessions = await prisma.session.findMany({
        take: 3,
        orderBy: { expires: "desc" },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      console.log("\n📝 Recent sessions:");
      recentSessions.forEach((session, index) => {
        console.log(
          `  ${index + 1}. User: ${session.user.email} | Expires: ${
            session.expires
          }`
        );
      });
    }

    console.log("\n✅ Database check completed");
  } catch (error) {
    console.error("❌ Database check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessionTables();
