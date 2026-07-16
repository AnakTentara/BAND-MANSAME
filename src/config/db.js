import { PrismaClient as SQLiteClient } from '../generated/sqlite/index.js';
import { PrismaClient as MySQLClient } from '../generated/mysql/index.js';
import dotenv from 'dotenv';

dotenv.config();

let prismaInstance = null;
let currentDbProvider = 'sqlite';

export async function initDatabase() {
  console.log('[Database] Menginisialisasi koneksi database...');
  
  // 1. Initialize SQLite (always active as local fallback & storage for configs)
  const sqlitePrisma = new SQLiteClient();

  // Try to load MySQL config from SQLite setting table
  let mysqlUrl = process.env.DATABASE_URL;
  
  try {
    const dbSetting = await sqlitePrisma.setting.findUnique({ where: { key: 'MYSQL_CONFIG' } });
    if (dbSetting && dbSetting.value) {
      const config = JSON.parse(dbSetting.value);
      if (config.host && config.username && config.database) {
        // Construct standard connection string
        mysqlUrl = `mysql://${config.username}:${encodeURIComponent(config.password || '')}@${config.host}:${config.port || 3306}/${config.database}`;
      }
    }
  } catch (err) {
    console.warn('[Database] Belum ada konfigurasi MySQL tersimpan di SQLite.');
  }

  // 2. Try connecting to MySQL if URL exists
  if (mysqlUrl && mysqlUrl.startsWith('mysql:')) {
    console.log(`[Database] Mencoba menghubungkan ke MySQL server...`);
    const mysqlPrisma = new MySQLClient({
      datasources: {
        db: {
          url: mysqlUrl
        }
      }
    });

    try {
      // Execute a simple query to verify connection
      await mysqlPrisma.$queryRaw`SELECT 1`;
      console.log('[Database] Koneksi ke MySQL BERHASIL! Database aktif: MySQL.');
      prismaInstance = mysqlPrisma;
      currentDbProvider = 'mysql';
      
      // Close the SQLite client as it is not needed
      await sqlitePrisma.$disconnect();
      return { prisma: prismaInstance, provider: 'mysql' };
    } catch (error) {
      console.warn('[Database] Koneksi ke MySQL GAGAL. Error:', error.message);
      console.warn('[Database] Mengaktifkan FALLBACK ke SQLite lokal.');
    }
  } else {
    console.log('[Database] Belum ada konfigurasi MySQL. Mengaktifkan SQLite lokal.');
  }

  prismaInstance = sqlitePrisma;
  currentDbProvider = 'sqlite';
  return { prisma: prismaInstance, provider: 'sqlite' };
}

// Export the active provider status
export function getDbProvider() {
  return currentDbProvider;
}

// Proxy to dynamic active prisma instance
const prisma = new Proxy({}, {
  get(target, prop) {
    if (!prismaInstance) {
      throw new Error('Database belum diinisialisasi. Panggil initDatabase() terlebih dahulu.');
    }
    return prismaInstance[prop];
  }
});

export default prisma;
