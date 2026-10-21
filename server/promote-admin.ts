import 'dotenv/config';
import { database } from './database';
import { normalizeEmail } from './validation';

const suppliedEmail = process.argv[2];
if (!suppliedEmail) {
  console.error('Usage: npm run promote-admin -- admin@example.com');
  database.close();
  process.exitCode = 2;
} else {
  try {
    const email = normalizeEmail(suppliedEmail);
    const user = database.prepare('SELECT id, email, role, status, email_verified_at FROM users WHERE email = ?')
      .get(email) as { id: string; email: string; role: string; status: string; email_verified_at: string | null } | undefined;
    if (!user) throw new Error('Create the account and verify its email before granting super-admin access.');
    if (user.status !== 'active') throw new Error('The account is suspended; reactivate it before granting super-admin access.');
    if (!user.email_verified_at) throw new Error('Verify the account email before granting super-admin access.');
    if (user.role !== 'super_admin') {
      database.prepare("UPDATE users SET role = 'super_admin' WHERE id = ?").run(user.id);
    }
    console.log(`${user.email} now has super-admin access. Sign in at /admin.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not grant super-admin access.');
    process.exitCode = 1;
  } finally {
    database.close();
  }
}
