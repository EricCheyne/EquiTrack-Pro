import Link from "next/link";
import { Menu } from "lucide-react";

type DashboardLayoutProps = {
    children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
                    <span className="font-bold text-gray-900">EquiTrack Pro</span>
                </div>

                <nav className="space-y-2">
                    <Link
                        href="/dashboard"
                        className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/horses"
                        className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                        Horses
                    </Link>
                    <Link
                        href="/dashboard/events"
                        className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                        Events
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Bar */}
                <header className="border-b border-gray-200 bg-white px-8 py-4 sticky top-0 z-40">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <div className="flex items-center gap-4">
                            <button className="rounded-lg p-2 hover:bg-gray-100">
                                <Menu className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">{children}</main>
            </div>
        </div>
    );
}
