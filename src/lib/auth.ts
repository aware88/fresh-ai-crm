import { getServerSession as _getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const getServerSession = () => _getServerSession(authOptions);

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

export async function getSession() {
  return await getServerSession();
}
