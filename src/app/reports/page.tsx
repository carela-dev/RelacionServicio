'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Download,
    Calendar,
    ArrowUpRight,
    Search,
    AlertTriangle
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
        setEndDate(new Date().toISOString().split('T')[0])
    }, [])
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState({
        totalShifts: 0,
        totalShiftsTrend: 0,
        efficiency: 0,
        efficiencyTrend: 0,
        totalExtraHours: 0,
        totalExtraHoursTrend: 0,
        totalGaps: 0,
        totalGapsTrend: 0,
    })
    const [zoneDistribution, setZoneDistribution] = useState<any[]>([])
    const [shiftFrequency, setShiftFrequency] = useState<any[]>([])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            // 0. Calculate Previous Period Range
            const start = new Date(startDate)
            const end = new Date(endDate)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            const prevEnd = new Date(start)
            prevEnd.setDate(prevEnd.getDate() - 1)
            const prevStart = new Date(prevEnd)
            prevStart.setDate(prevStart.getDate() - diffDays)

            const prevStartDateStr = prevStart.toISOString().split('T')[0]
            const prevEndDateStr = prevEnd.toISOString().split('T')[0]

            // 1. Fetch Current Period Data
            const { data: currentData } = await supabase
                .from('shift_reports')
                .select(`
                    *,
                    shift_details(*)
                `)
                .gte('date', startDate)
                .lte('date', endDate)

            // 2. Fetch Previous Period Data
            const { data: prevData } = await supabase
                .from('shift_reports')
                .select(`
                    *,
                    shift_details(*)
                `)
                .gte('date', prevStartDateStr)
                .lte('date', prevEndDateStr)

            const reports = currentData || []
            const prevReports = prevData || []

            // Helper to calculate stats
            const calculateStats = (data: any[]) => {
                const count = data.length
                const allDetails = data.flatMap(r => r.shift_details || [])
                const extra = allDetails.reduce((acc, d) => acc + (d.extra_hours || 0), 0)
                const gaps = allDetails.reduce((acc, d) => acc + (d.empty_posts || 0), 0)

                // Efficiency
                const perfectZones = data.reduce((acc, r) => {
                    const reportGaps = r.shift_details?.reduce((sum: number, d: any) => sum + (d.empty_posts || 0), 0) || 0
                    return reportGaps === 0 ? acc + 1 : acc
                }, 0)
                const efficiency = count > 0 ? Math.round((perfectZones / count) * 100) : 0

                return { count, extra, gaps, efficiency }
            }

            const currentStats = calculateStats(reports)
            const prevStats = calculateStats(prevReports)

            // Helper for Trend %
            const calcTrend = (curr: number, prev: number) => {
                if (prev === 0) return curr > 0 ? 100 : 0
                return Math.round(((curr - prev) / prev) * 100)
            }

            // 3. Process Bottom Charts (Current Period)
            // Shift Frequency
            const frequencyMap: any = {}
            reports.forEach(r => {
                frequencyMap[r.shift_type] = (frequencyMap[r.shift_type] || 0) + 1
            })
            const frequencyList = Object.entries(frequencyMap).map(([type, count]) => ({
                type,
                count: count as number,
                percentage: reports.length > 0 ? Math.round(((count as number) / reports.length) * 100) : 0
            })).sort((a, b) => b.count - a.count)
            setShiftFrequency(frequencyList)

            // Zone Distribution
            const allDetails = reports.flatMap(r => r.shift_details || [])
            const zoneStatsMap: any = {}
            allDetails.forEach(d => {
                if (!zoneStatsMap[d.zone_id]) zoneStatsMap[d.zone_id] = { count: 0 }
                zoneStatsMap[d.zone_id].count++
            })
            const { data: zonesList } = await supabase.from('zones').select('id, name')
            const distribution = (zonesList || []).map(z => ({
                name: z.name,
                count: zoneStatsMap[z.id]?.count || 0,
                percentage: allDetails.length > 0 ? Math.round(((zoneStatsMap[z.id]?.count || 0) / allDetails.length) * 100) : 0
            })).sort((a, b) => b.count - a.count).slice(0, 5)
            setZoneDistribution(distribution)

            setKpis({
                totalShifts: currentStats.count,
                totalShiftsTrend: calcTrend(currentStats.count, prevStats.count),
                efficiency: currentStats.efficiency,
                efficiencyTrend: calcTrend(currentStats.efficiency, prevStats.efficiency),
                totalExtraHours: currentStats.extra,
                totalExtraHoursTrend: calcTrend(currentStats.extra, prevStats.extra),
                totalGaps: currentStats.gaps,
                totalGapsTrend: calcTrend(currentStats.gaps, prevStats.gaps),
            })

        } catch (err) {
            console.error('Error fetching analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (startDate && endDate) fetchAnalytics()
    }, [startDate, endDate])

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="bg-[#f6f8f6] dark:bg-[#131f13] min-h-screen">
            <div className="print:hidden">
                <Sidebar />
            </div>

            <div className="lg:pl-64 flex flex-col min-h-screen print:pl-0">
                <main className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 print:p-0">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Print Header */}
                        <div className="hidden print:block mb-8">
                            <h1 className="text-3xl font-black text-black mb-2">Reportes y Analíticas</h1>
                            <p className="text-sm text-slate-500" suppressHydrationWarning>
                                Fecha de Impresión: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-500">
                                {startDate ? `Rango de Análisis: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` : 'Cargando fechas...'}
                            </p>
                        </div>

                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                            <div>
                                <h1 className="text-2xl font-bold text-[#121712] dark:text-white tracking-tight">Reportes y Analíticas</h1>
                                <p className="text-xs text-[#33c738] font-medium uppercase tracking-wider">Información consolidada de la operación</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <Calendar className="text-[#33c738]" size={16} />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-xs outline-none dark:text-white"
                                    />
                                    <span className="text-slate-400">---</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-xs outline-none dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center justify-center gap-3 px-6 py-2 bg-[#33c738] text-white rounded-lg font-bold text-sm shadow-lg shadow-[#33c738]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Download size={18} /> Imprimir / PDF
                                </button>
                            </div>
                        </header>

                        {/* Top KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ReportKpiCard
                                title="Total Turnos"
                                value={kpis.totalShifts}
                                trend={kpis.totalShiftsTrend}
                                icon={<Calendar size={24} />}
                                color="green"
                            />
                            <ReportKpiCard
                                title="Eficiencia"
                                value={`${kpis.efficiency}%`}
                                trend={kpis.efficiencyTrend}
                                icon={<TrendingUp size={24} />}
                                color="blue"
                            />
                            <ReportKpiCard
                                title="Horas Extras"
                                value={kpis.totalExtraHours}
                                trend={kpis.totalExtraHoursTrend}
                                icon={<BarChart3 size={24} />}
                                color="amber"
                                inverse // Higher is worse generally, but implementation flavor choice. Let's say standard trend logic.
                            />
                            <ReportKpiCard
                                title="Puestos Vacíos"
                                value={kpis.totalGaps}
                                trend={kpis.totalGapsTrend}
                                icon={<AlertTriangle size={24} />}
                                color="red"
                                inverse={true} // Higher gaps is BAD, so positive trend should be red
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Zones Card */}
                            <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900/50 relative overflow-hidden group shadow-sm">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 w-fit mb-4 border border-blue-500/10 group-hover:scale-110 transition-transform">
                                        <PieChart size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#121712] dark:text-white mb-1">Carga por Zona</h3>
                                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">Distribución porcentual de actividad en las zonas activas.</p>
                                    <div className="mt-auto space-y-3">
                                        {zoneDistribution.map((z, idx) => (
                                            <div key={idx} className="group cursor-default">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={z.name}>
                                                        {z.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500">{z.percentage}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 group-hover:bg-blue-600"
                                                        style={{ width: `${z.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                        {zoneDistribution.length === 0 && <p className="text-[10px] italic text-slate-400">Sin datos de zonas</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Shift Frequency */}
                            <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900/50 shadow-sm">
                                <h3 className="text-lg font-bold text-[#121712] dark:text-white mb-4 text-left">Frecuencia de Turnos</h3>
                                <div className="space-y-4">
                                    {shiftFrequency.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between group cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-8 bg-[#33c738]/10 rounded-full group-hover:bg-[#33c738] transition-colors"></div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-[#121712] dark:text-white uppercase tracking-tight">{s.type}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{s.count} Registros</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{s.percentage}%</span>
                                        </div>
                                    ))}
                                    {shiftFrequency.length === 0 && <p className="text-[10px] italic text-slate-400 text-left">Sin registros en este periodo</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    )
}

function ReportKpiCard({ title, value, trend, icon, color, inverse }: any) {
    const colors: any = {
        green: 'bg-[#33c738]/10 text-[#33c738]',
        blue: 'bg-blue-500/10 text-blue-500',
        amber: 'bg-amber-500/10 text-amber-500',
        red: 'bg-red-500/10 text-red-500',
    }

    // Trend logic: normally positive trend is good (green).
    // If 'inverse' is true (e.g. gaps), positive trend is bad (red).
    const isPositive = trend >= 0
    const trendColor = inverse
        ? (isPositive ? 'text-red-500' : 'text-[#33c738]')
        : (isPositive ? 'text-[#33c738]' : 'text-red-500')
    const TrendIcon = isPositive ? ArrowUpRight : ArrowUpRight // Can use ArrowDownRight for negative if imported. For now lets just use sign.

    return (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${colors[color]} w-fit`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-[#121712] dark:text-white">{value}</h3>
                </div>
            </div>
            <div className={`flex items-center text-xs font-bold ${trendColor} bg-slate-50 dark:bg-zinc-800 w-fit px-2 py-1 rounded-full`}>
                <span className="mr-1">{trend > 0 ? '+' : ''}{trend}%</span>
                <span className="text-[10px] text-slate-400 font-medium ml-1">vs periodo anterior</span>
            </div>
        </div>
    )
}
