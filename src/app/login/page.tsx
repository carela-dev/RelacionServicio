'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: authError, data } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message === 'Invalid login credentials'
                    ? 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.'
                    : authError.message)
                setLoading(false)
            } else if (data.session) {
                // Force a router refresh to sync cookies
                router.refresh()
                router.push('/PanelDeControlDeSupervision')
            }
        } catch (err) {
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
            setLoading(false)
        }
    }


    if (!mounted) return null

    return (
        <div className="relative font-sans min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#0a110a]">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#33c738]/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-[440px] z-10">
                {/* Branding Section */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-[#33c738] blur-xl opacity-40 rounded-full animate-pulse"></div>
                        <div className="relative bg-[#1a2e1a] border border-[#33c738]/30 p-4 rounded-2xl shadow-2xl">
                            <ShieldCheck size={48} className="text-[#33c738]" />
                        </div>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight text-center">Relación de Servicios</h1>
                    <p className="text-emerald-500/80 text-sm mt-2 font-medium">Panel de Gestión Administrativa</p>
                </div>

                {/* Glassmorphism Login Card */}
                <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-500 delay-150">
                    <h2 className="text-xl font-semibold text-white mb-8 text-center">Bienvenido al Portal</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-emerald-500/70 uppercase tracking-widest pl-1" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#33c738] transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#33c738]/50 focus:border-[#33c738]/50 transition-all placeholder:text-white/20"
                                    placeholder="usuario@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-emerald-500/70 uppercase tracking-widest pl-1" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#33c738] transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#33c738]/50 focus:border-[#33c738]/50 transition-all placeholder:text-white/20"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#33c738] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full overflow-hidden bg-gradient-to-r from-[#33c738] to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#33c738]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center justify-center gap-2 text-lg">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        Entrar al Sistema
                                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>

                {/* Footer and Additional Info */}
                <div className="mt-10 text-center space-y-4 animate-in fade-in duration-1000 delay-300">
                    <p className="text-white/40 text-xs tracking-wide">
                        SOPORTE TÉCNICO V1.2 • © 2024 SEGURIDAD INTEGRAL
                    </p>
                    <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#33c738]/60">
                        <a href="#" className="hover:text-[#33c738] transition-colors">Estado del Sistema</a>
                        <span className="opacity-20">•</span>
                        <a href="#" className="hover:text-[#33c738] transition-colors">Términos de Servicio</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
