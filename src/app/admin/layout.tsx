import AdminAccessShell from '@/components/admin/admin-access-shell'
import AdminSidebar from '@/components/admin/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessShell>
      <div className="min-h-screen bg-neutral-100" style={{ fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
        <AdminSidebar />
        <main className="min-h-screen p-4 pt-20 lg:ml-64 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </AdminAccessShell>
  )
}
