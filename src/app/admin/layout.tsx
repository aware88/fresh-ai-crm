import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { RoleService } from '@/services/role-service';

// Helper function to check if user is a system admin
async function isAdmin(userId: string) {
  try {
    return await RoleService.isSystemAdmin(userId);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  
  const userId = (session.user as any).id;
  const isUserAdmin = await isAdmin(userId);
  
  if (!isUserAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  CRM Mind
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/admin" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/admin/subscriptions" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Subscriptions
                </Link>
                <Link href="/admin/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Users
                </Link>
                <Link href="/admin/organizations" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Organizations
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Admin
                  </span>
                  <span className="ml-2 text-sm text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
