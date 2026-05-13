import { Sidebar } from '@/components/admin/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'Admin · BolãoPro',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-admin-bg flex">
        <Sidebar />
        <main className="flex-1 admin-scroll overflow-x-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
