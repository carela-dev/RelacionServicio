'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Users,
    UserPlus,
    Trash2,
    Shield,
    Mail,
    User as UserIcon,
    Loader2,
    AlertCircle
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState('supervisor')

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name')

        if (error) setError(error.message)
        else setUsers(data || [])
        setLoading(false)
    }

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault()
        setActionLoading(true)
        setError(null)

        // Note: In a real Supabase setup, you'd typically use a Service Role or Edge Function 
        // to create users in Auth. For this demo/implementation, we'll use signUp.
        // WARNING: This requires the admin to be logged out or use a separate API.
        // For simplicity in this implementation, we will mock the addition and recommend 
        // the Supabase Dashboard for Auth management, or use a custom API route if configured.

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        })

        if (authError) {
            setError(authError.message)
        } else {
            setShowAddModal(false)
            setEmail('')
            setPassword('')
            setFullName('')
            fetchUsers()
        }
        setActionLoading(false)
    }

    async function handleDeleteUser(id: string) {
        if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return

        setActionLoading(true)
        const { error } = await supabase.from('profiles').delete().eq('id', id)

        if (error) setError(error.message)
        else fetchUsers()
        setActionLoading(false)
    }

    return (
        <div className="flex bg-[#f6f8f6] dark:bg-[#0d140d] min-h-screen">
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="max-w-7xl mx-auto space-y-10">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-[#121712] dark:text-white">Gestión de Usuarios</h2>
                                <p className="text-sm text-[#678368] font-medium">Administración de supervisores y permisos del sistema</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-[#33c738] hover:bg-[#33c738]/90 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-[#33c738]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <UserPlus size={20} /> Nuevo Usuario
                            </button>
                        </header>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-[#dde4dd] dark:border-zinc-800 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8faf8] dark:bg-zinc-800/50 text-[#678368] text-xs uppercase font-bold tracking-wider border-b border-[#dde4dd] dark:border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Rol</th>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dde4dd] dark:divide-zinc-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <Loader2 className="animate-spin mx-auto text-[#33c738]" size={32} />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-[#678368]">
                                                No hay usuarios registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-[#f1f4f1]/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#33c738]/10 flex items-center justify-center text-[#33c738]">
                                                            <UserIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#121712] dark:text-white">{user.full_name}</p>
                                                            <p className="text-xs text-[#678368]" suppressHydrationWarning>Registrado el {new Date(user.updated_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        <Shield size={14} />
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-[#678368]">
                                                    {user.id}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={actionLoading}
                                                        className="text-[#678368] hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Add User Modal */}
                        {showAddModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold">Agregar Nuevo Usuario</h3>
                                        <button onClick={() => setShowAddModal(false)} className="text-[#678368] hover:text-[#121712]">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold">Nombre Completo</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#678368]" size={18} />
                                                <input
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-[#dde4dd] rounded-lg focus:ring-2 focus:ring-[#33c738]"
                                                    placeholder="Juan Pérez"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold">Correo Electrónico</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#678368]" size={18} />
                                                <input
                                                    required
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-[#dde4dd] rounded-lg focus:ring-2 focus:ring-[#33c738]"
                                                    placeholder="usuario@empresa.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold">Contraseña Inicial</label>
                                            <input
                                                required
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-2 border border-[#dde4dd] rounded-lg focus:ring-2 focus:ring-[#33c738]"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold">Rol</label>
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="w-full px-4 py-2 border border-[#dde4dd] rounded-lg focus:ring-2 focus:ring-[#33c738]"
                                            >
                                                <option value="supervisor">Supervisor</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="w-full bg-[#33c738] text-white py-3 rounded-lg font-bold shadow-lg shadow-[#33c738]/20 flex items-center justify-center gap-2 mt-6 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />} Crear Usuario
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

function X({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
