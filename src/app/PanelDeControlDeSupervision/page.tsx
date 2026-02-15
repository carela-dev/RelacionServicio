'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Bell,
    Settings,
    Map,
    History,
    AlertTriangle,
    Users,
    TrendingUp
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function PanelDeControlDeSupervision() {
    const [reports, setReports] = useState<any[]>([])
    const [stats, setStats] = useState<any>({ zones: 0, covered: 0, coverage: 0, hours: 0, gaps: 0, active: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dateFilter, setDateFilter] = useState('')

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                // Fetch latest reports with details
                let query = supabase
                    .from('shift_reports')
                    .select(`
                        *,
                        profiles!created_by(full_name),
                        shift_details(
                            *,
                            zones(name),
                            incoming:profiles!incoming_supervisor_id(full_name)
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(9)

                if (dateFilter) {
                    query = query.eq('date', dateFilter)
                }

                const { data: reportsData, error: reportsError } = await query

                if (reportsError) {
                    console.error('Error fetching reports:', reportsError)
                    setError(reportsError.message)
                } else {
                    setReports(reportsData || [])
                }

                // Calculate stats (global stats)
                const { data: zonesData } = await supabase.from('zones').select('*')
                const { data: details } = await supabase.from('shift_details').select('extra_hours, empty_posts, incoming_supervisor_id, zone_id')

                const totalZones = zonesData?.length || 0
                const totalHours = details?.reduce((acc: number, d: any) => acc + (d.extra_hours || 0), 0) || 0
                const totalGaps = details?.reduce((acc: number, d: any) => acc + (d.empty_posts || 0), 0) || 0

                // Unique zones with reports
                const coveredZones = new Set(details?.map(d => d.zone_id)).size
                const coveragePct = totalZones > 0 ? Math.round((coveredZones / totalZones) * 100) : 0

                // Active supervisors: unique IDs in details
                const activeSups = new Set(details?.filter(d => d.incoming_supervisor_id).map(d => d.incoming_supervisor_id)).size

                // 3-Day History Calculation
                const threeDaysAgo = new Date()
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                const threeDayStr = threeDaysAgo.toISOString().split('T')[0]

                const { data: recentHistory } = await supabase
                    .from('shift_reports')
                    .select('date, shift_details(extra_hours, empty_posts)')
                    .gte('date', threeDayStr)

                const last3Days = Array.from({ length: 3 }).map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dateVal = d.toISOString().split('T')[0]
                    const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })

                    // Sum for this date
                    const reportsForDay = recentHistory?.filter((r: any) => r.date === dateVal) || []
                    const dayHours = reportsForDay.reduce((acc: number, r: any) =>
                        acc + (r.shift_details?.reduce((sum: number, d: any) => sum + (d.extra_hours || 0), 0) || 0), 0)
                    const dayGaps = reportsForDay.reduce((acc: number, r: any) =>
                        acc + (r.shift_details?.reduce((sum: number, d: any) => sum + (d.empty_posts || 0), 0) || 0), 0)

                    return { label, hours: dayHours, gaps: dayGaps }
                }).reverse()

                setStats({
                    zones: totalZones,
                    covered: coveredZones,
                    coverage: coveragePct,
                    hours: totalHours,
                    gaps: totalGaps,
                    active: activeSups,
                    history: last3Days
                } as any)
            } catch (err: any) {
                console.error('Catastrophic fetch error:', err)
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Error de conexión inesperado')
                }
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [dateFilter])

    return (
        <div className="bg-[#f6f8f6] dark:bg-[#131f13] min-h-screen">
            <Sidebar />

            <div className="lg:ml-64 flex flex-col min-h-screen">
                <main className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="max-w-full mx-auto space-y-8">
                        {/* Top Bar */}
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-[#121712] dark:text-white">Relación de Servicios</h2>
                                <p className="text-xs text-[#33c738] font-medium uppercase tracking-wider">Dashboard de Administración</p>
                            </div>

                            {error && (
                                <div className="flex-1 max-w-xl px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-shake">
                                    <AlertTriangle size={18} />
                                    <p className="font-medium">Error: {error}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-6">
                                <div className="relative w-80 hidden md:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" size={18} />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#33c738] focus:border-transparent outline-none text-sm transition-all"
                                        placeholder="Buscar servicios o zonas..."
                                        type="text"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-[#33c738] transition-colors relative">
                                        <Bell size={20} />
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                                    </button>
                                    <button className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-[#33c738] transition-colors">
                                        <Settings size={20} />
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard
                                title="Cobertura de Zonas"
                                value={`${stats.covered} / ${stats.zones}`}
                                trend={`${stats.coverage || 0}% Cubierto`}
                                icon={<Map size={24} />}
                                color="green"
                                progress={stats.coverage}
                            />
                            <KpiCard
                                title="Horas Extras"
                                value={stats.hours}
                                trend="H. Extras"
                                icon={<History size={24} />}
                                color="blue"
                                history={stats.history?.map((d: any) => ({ label: d.label, value: d.hours }))}
                            />
                            <KpiCard
                                title="Puestos Vacíos"
                                value={stats.gaps}
                                trend={stats.gaps > 0 ? "Atención" : "Estable"}
                                icon={<AlertTriangle size={24} />}
                                color={stats.gaps > 0 ? "red" : "blue"}
                                alert={stats.gaps > 0}
                                history={stats.history?.map((d: any) => ({ label: d.label, value: d.gaps }))}
                            />
                            <KpiCard
                                title="Personal Activo"
                                value={stats.active}
                                trend="En turno"
                                icon={<Users size={24} />}
                                color="amber"
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-8">
                            {/* Latest Shift Table */}
                            <div className="xl:col-span-2 bg-white dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#121712] dark:text-white">Registros Recientes</h3>
                                        <p className="text-[10px] text-slate-500 font-medium">Mostrando hasta 9 reportes</p>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500">Filtrar:</span>
                                            <input
                                                type="date"
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value)}
                                                className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#33c738] transition-all"
                                            />
                                            {dateFilter && (
                                                <button
                                                    onClick={() => setDateFilter('')}
                                                    className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                                                >
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-4">Fecha / Turno</th>
                                                <th className="px-6 py-4">Supervisor</th>
                                                <th className="px-6 py-4 text-center">Entrada</th>
                                                <th className="px-6 py-4">Zonas</th>
                                                <th className="px-6 py-4 text-center text-blue-500">H. Extras</th>
                                                <th className="px-6 py-4 text-center text-red-500">Gaps</th>
                                                <th className="px-6 py-4">Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {loading ? (
                                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">Cargando...</td></tr>
                                            ) : reports.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No hay registros recientes.</td>
                                                </tr>
                                            ) : (
                                                reports.map((report: any) => {
                                                    const zoneCount = report.shift_details?.length || 0
                                                    const extraHours = report.shift_details?.reduce((acc: number, d: any) => acc + (d.extra_hours || 0), 0) || 0
                                                    const gapCount = report.shift_details?.reduce((acc: number, d: any) => acc + (d.empty_posts || 0), 0) || 0

                                                    return (
                                                        <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="font-semibold text-sm text-[#121712] dark:text-white">
                                                                    <span suppressHydrationWarning>
                                                                        {new Date(report.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{report.shift_type}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{report.profiles?.full_name}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-[#33c738]">
                                                                <span suppressHydrationWarning>
                                                                    {(() => {
                                                                        const val = report.shift_details?.[0]?.entry_hours
                                                                        if (val === null || val === undefined) return '-'
                                                                        const h = Math.floor(val)
                                                                        const m = Math.round((val - h) * 60)
                                                                        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                                                    })()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1">
                                                                    {report.shift_details?.slice(0, 3).map((d: any, idx: number) => (
                                                                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded w-fit">
                                                                            {d.zones?.name || 'Zona desconocida'}
                                                                        </span>
                                                                    ))}
                                                                    {(report.shift_details?.length || 0) > 3 && (
                                                                        <span className="text-[10px] text-slate-400 pl-1">
                                                                            +{report.shift_details.length - 3} más...
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-bold text-sm text-blue-500">{extraHours}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`font-bold text-sm ${gapCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>{gapCount}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-[150px] truncate">{report.observations || 'Sin novedades'}</td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* System Insights */}
                            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                                <h3 className="text-lg font-bold mb-4 text-[#121712] dark:text-white">Estado Operativo</h3>
                                <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    Monitoreo en tiempo real de la capacidad operativa.
                                </p>
                                <div className="space-y-6">
                                    <InsightItem
                                        icon={<Map size={18} />}
                                        label="Zonas Activas"
                                        value={`${stats.zones} operando`}
                                        color="green"
                                    />
                                    <InsightItem
                                        icon={<History size={18} />}
                                        label="Esfuerzo Extra"
                                        value={`${stats.hours} Horas`}
                                        color="blue"
                                    />

                                    <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#33c738]/10 p-2 rounded-lg text-[#33c738]">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Eficiencia</p>
                                                <p className="text-sm font-bold text-[#121712] dark:text-white">
                                                    {stats.gaps > 0 ? 'Atención Requerida' : 'Nivel Óptimo'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

function KpiCard({ title, value, trend, icon, color, alert, history, progress }: any) {
    const colors: any = {
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/10',
        green: 'bg-[#33c738]/10 text-[#33c738] border-[#33c738]/10',
        red: 'bg-red-500/10 text-red-500 border-red-500/10',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/10'
    }

    return (
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="flex justify-between items-start">
                <div className={`p-4 rounded-xl border ${colors[color]}`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-current opacity-70`}>
                        {trend}
                    </span>
                    {alert && <span className="mt-2 text-[9px] font-bold text-red-500 animate-pulse">CRÍTICO</span>}
                </div>
            </div>
            <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 opacity-80">{title}</p>
                <p className={`text-2xl font-bold tracking-tight ${alert ? 'text-red-500' : 'text-[#121712] dark:text-white'}`}>
                    {value}
                </p>
                {progress !== undefined && (
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 90 ? 'bg-[#33c738]' :
                                progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        ></div>
                    </div>
                )}
            </div>
            {history && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {history.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 uppercase tracking-tight">{item.label}</span>
                            <span className={`font-bold ${alert && item.value > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function InsightItem({ icon, label, value, color }: any) {
    const colors: any = {
        green: 'text-[#33c738] bg-[#33c738]/10',
        blue: 'text-blue-500 bg-blue-500/10'
    }
    return (
        <div className="flex items-center gap-4 group cursor-default">
            <div className={`p-3 rounded-lg ${colors[color]} group-hover:scale-110 transition-all duration-300`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-bold text-[#121712] dark:text-white">{value}</p>
            </div>
        </div>
    )
}
