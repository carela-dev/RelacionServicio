'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    PlusCircle,
    History,
    BarChart3,
    ShieldCheck,
    LogOut,
    User,
    Menu,
    X,
    ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const [profile, setProfile] = useState<any>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
        }
        getProfile()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/PanelDeControlDeSupervision' },
        { label: 'Nuevo Registro', icon: PlusCircle, href: '/register-shift' },
        { label: 'Historial', icon: History, href: '/history' },
        { label: 'Reportes', icon: BarChart3, href: '/reports' },
    ]

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#131f13]/80 backdrop-blur-md border-b border-[#33c738]/10 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2">
                    <div className="bg-[#33c738]/10 p-1.5 rounded-lg text-[#33c738]">
                        <ShieldCheck size={24} />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-[#121712] dark:text-white">Servicios App</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-[#678368] hover:text-[#33c738] transition-colors"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#131f13] border-r border-[#33c738]/10 
                flex flex-col z-50 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-[#33c738]/10 p-2 rounded-lg text-[#33c738]">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight text-[#121712] dark:text-white">Servicios App</h1>
                        <p className="text-[10px] text-[#33c738] font-medium uppercase tracking-wider">Administración</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-[#33c738]/10 text-[#33c738] font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#33c738]/5 hover:text-[#33c738]'
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-[#f8faf8] dark:bg-white/5 rounded-[1.5rem] p-4 border border-[#33c738]/10 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#33c738]/10 flex items-center justify-center text-[#33c738] overflow-hidden border-2 border-white dark:border-zinc-800 shadow-inner">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} />
                                )
                                }
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-black truncate text-[#121712] dark:text-white leading-none mb-1">{profile?.full_name || 'Usuario'}</p>
                                <p className="text-[10px] text-[#33c738] font-black uppercase tracking-widest opacity-80">{profile?.role || 'Personal'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/5 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-red-500/10"
                        >
                            <LogOut size={14} />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
