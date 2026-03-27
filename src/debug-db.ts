import { db } from './lib/db';

async function main() {
  const users = await db.user.findMany({ take: 5 });
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));
  
  const clubs = await db.userClub.findMany({ take: 20 });
  console.log('Total clubs:', clubs.length);
  clubs.forEach(c => {
    console.log(`  Club: ${c.clubName}, Distance: ${c.estimatedDistance}, UserId: ${c.userId}`);
  });
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
