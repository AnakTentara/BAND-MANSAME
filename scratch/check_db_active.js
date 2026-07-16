import { initDatabase } from '../src/config/db.js';
async function main() {
  const { prisma, provider } = await initDatabase();
  console.log('Provider:', provider);
  const candidates = await prisma.candidate.findMany();
  const members = await prisma.member.findMany();
  console.log('Candidates:', candidates);
  console.log('Members:', members);
}
main().catch(console.error);
