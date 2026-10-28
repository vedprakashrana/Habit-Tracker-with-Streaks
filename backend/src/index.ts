import app from './app';
import { checkDatabaseConnection } from './db/prisma';
import { seedInMemoryDemoData } from './db/store';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🚀 Starting HabitFlow API Server...');

  // Check database connectivity
  await checkDatabaseConnection();

  // Always seed demo data into memory store so development/review is instantly usable
  await seedInMemoryDemoData();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`✨ HabitFlow Backend API is running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
