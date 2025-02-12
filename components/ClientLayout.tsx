'use client';
import { usePathname } from 'next/navigation';
import { SidebarSection } from '../components/Sidebar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get current route
  const isLoginPage = pathname === '/login'; // Check if current route is /login

  return (
    <>
      {!isLoginPage && (
        <div className="flex h-screen">
          <aside className="w-64 bg-gray-900 text-white p-4">
            <SidebarSection />
          </aside>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      )}

      {isLoginPage && children}
    </>
  );
}