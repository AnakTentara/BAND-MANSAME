import { PrismaClient } from '../src/generated/sqlite/index.js';
const prisma = new PrismaClient();
async function main() {
  const candidates = await prisma.candidate.findMany();
  const members = await prisma.member.findMany();
  console.log('Candidates:', candidates);
  console.log('Members:', members);
}
main().catch(console.error);
