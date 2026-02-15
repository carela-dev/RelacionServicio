'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Filter,
    ArrowUpDown,
    MapPin,
    Calendar,
    Clock,
    ChevronRight,
    FileText
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function HistoryPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedReport, setSelectedReport] = useState<any>(null)

    const [profilesMap, setProfilesMap] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchProfiles = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name')
            if (data) {
                const map = data.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name }), {})
                setProfilesMap(map)
            }
        }
        fetchProfiles()
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        let query = supabase
            .from('shift_reports')
            .select(`
                *,
                profiles(full_name),
                shift_details(id, zone_id, extra_hours, empty_posts, zones(name), entry_hours, incoming_supervisor_id, outgoing_supervisor_id, justification)
            `)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)

        const { data, error } = await query

        if (error) {
            console.error('Error fetching history:', error)
            alert('Error cargando historial: ' + error.message + ' (' + error.code + ')')
            setReports([])
            setLoading(false)
            return
        }

        let filteredData = data || []
        if (searchTerm) {
            filteredData = filteredData.filter(r =>
                r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.shift_type?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setReports(filteredData)
        setLoading(false)
    }

    useEffect(() => {
        fetchHistory()
    }, [startDate, endDate, searchTerm])

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
                            <h1 className="text-3xl font-black text-black mb-2">Historial de Turnos</h1>
                            <p className="text-sm text-slate-500" suppressHydrationWarning>
                                Fecha de Impresión: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                            <div>
                                <h1 className="text-2xl font-bold text-[#121712] dark:text-white tracking-tight">Historial de Turnos</h1>
                                <p className="text-xs text-[#33c738] font-medium uppercase tracking-wider">Registros históricos del sistema</p>
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
                                    {(startDate || endDate) && (
                                        <button onClick={() => { setStartDate(''); setEndDate('') }} className="text-[10px] font-bold text-red-500 hover:underline">Limpiar</button>
                                    )}
                                </div>

                                <div className="relative group md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar supervisor o turno..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-[#33c738] text-sm transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#33c738] text-white rounded-lg text-sm font-bold hover:bg-[#2eb332] transition-all shadow-lg shadow-[#33c738]/20"
                                >
                                    <FileText size={18} />
                                    <span>Imprimir / PDF</span>
                                </button>
                            </div>
                        </header>

                        <div className="bg-white dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm print:shadow-none print:border-0">
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left min-w-[800px] print:min-w-full">
                                    <thead className="bg-[#f8faf8] dark:bg-white/5 text-[#678368] text-[10px] uppercase font-black tracking-[0.2em] border-b border-[#33c738]/5">
                                        <tr>
                                            <th className="px-10 py-6 print:px-4 print:py-2">Fecha / Horario</th>
                                            <th className="px-10 py-6 print:px-4 print:py-2">Supervisor</th>
                                            <th className="px-10 py-6 text-center print:px-4 print:py-2">Entrada</th>
                                            <th className="px-10 py-6 text-center print:px-4 print:py-2">Zonas</th>
                                            <th className="px-10 py-6 text-center text-blue-500 print:px-4 print:py-2">H. Extras</th>
                                            <th className="px-10 py-6 text-center text-red-500 print:px-4 print:py-2">Gaps</th>
                                            <th className="px-10 py-6 text-right print:hidden">Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#33c738]/5 bg-white/30 dark:bg-transparent">
                                        {loading ? (
                                            <tr><td colSpan={6} className="px-10 py-20 text-center text-[#678368] font-black animate-pulse">CARGANDO HISTORIAL...</td></tr>
                                        ) : reports.length === 0 ? (
                                            <tr><td colSpan={6} className="px-10 py-24 text-center text-[#678368] italic">No hay reportes disponibles.</td></tr>
                                        ) : (
                                            reports.map((report) => {
                                                const zoneCount = report.shift_details?.length || 0
                                                const extraHours = report.shift_details?.reduce((acc: number, d: any) => acc + (d.extra_hours || 0), 0) || 0
                                                const gapCount = report.shift_details?.reduce((acc: number, d: any) => acc + (d.empty_posts || 0), 0) || 0

                                                return (
                                                    <tr key={report.id} className="hover:bg-[#33c738]/5 transition-all group print:break-inside-avoid">
                                                        <td className="px-10 py-7 print:px-4 print:py-2">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-[#33c738]/5 text-[#33c738] print:hidden">
                                                                    <Calendar size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-[#121712] dark:text-white">
                                                                        {(() => {
                                                                            if (!report.date) return 'Sin fecha'
                                                                            // Handle both YYYY-MM-DD and ISO timestamp
                                                                            const dateStr = report.date.includes('T') ? report.date.split('T')[0] : report.date
                                                                            return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                                                                        })()}
                                                                    </p>
                                                                    <p className="text-[10px] font-black text-[#33c738] uppercase tracking-widest">{report.shift_type}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7 print:px-4 print:py-2">
                                                            <p className="font-bold text-[#121712] dark:text-slate-200">{report.profiles?.full_name}</p>
                                                            <p className="text-[10px] text-[#678368] font-bold">Supervisor a Cargo</p>
                                                        </td>
                                                        <td className="px-10 py-7 text-center print:px-4 print:py-2">
                                                            <span className="font-black text-[#121712] dark:text-white" suppressHydrationWarning>
                                                                {(() => {
                                                                    const val = report.shift_details?.[0]?.entry_hours
                                                                    if (val === null || val === undefined) return '-'
                                                                    const h = Math.floor(val)
                                                                    const m = Math.round((val - h) * 60)
                                                                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7 text-center print:px-4 print:py-2">
                                                            <div className="flex flex-col gap-1 items-center">
                                                                {(report.shift_details || []).map((detail: any, idx: number) => (
                                                                    <span key={detail.id || idx} className="px-3 py-1 bg-[#33c738]/10 text-[#33c738] rounded-full text-[10px] font-black uppercase tracking-wider print:bg-transparent print:p-0">
                                                                        {detail.zones?.name || 'Zona Desconocida'}
                                                                    </span>
                                                                ))}
                                                                {(!report.shift_details || report.shift_details.length === 0) && (
                                                                    <span className="text-[10px] text-slate-400 italic">Sin zonas</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7 text-center font-black text-[#121712] dark:text-white print:px-4 print:py-2">
                                                            {extraHours}
                                                        </td>
                                                        <td className="px-10 py-7 text-center print:px-4 print:py-2">
                                                            <span className={`font-black ${gapCount > 0 ? 'text-red-500' : 'text-slate-400'} print:text-black`}>{gapCount}</span>
                                                        </td>
                                                        <td className="px-10 py-7 text-right print:hidden">
                                                            <button
                                                                onClick={() => setSelectedReport(report)}
                                                                className="p-2.5 bg-white dark:bg-white/5 rounded-xl border border-[#33c738]/10 text-[#678368] group-hover:text-[#33c738] group-hover:bg-[#33c738]/10 transition-all cursor-pointer"
                                                            >
                                                                <ChevronRight size={20} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Shift Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2c1a] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-[#f8faf8] dark:bg-white/5">
                            <div>
                                <h2 className="text-xl font-black text-[#121712] dark:text-white">Detalles del Turno</h2>
                                <p className="text-xs text-[#33c738] uppercase tracking-widest font-bold">
                                    {(() => {
                                        if (!selectedReport.date) return 'Sin fecha'
                                        const dateStr = selectedReport.date.includes('T') ? selectedReport.date.split('T')[0] : selectedReport.date
                                        return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                    })()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <div className="text-slate-400 font-bold">✕</div>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Supervisor</p>
                                    <p className="font-bold text-[#121712] dark:text-white">{selectedReport.profiles?.full_name}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Tipo de Turno</p>
                                    <p className="font-bold text-[#121712] dark:text-white">{selectedReport.shift_type}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Total Zonas</p>
                                    <p className="font-bold text-[#121712] dark:text-white">{selectedReport.shift_details?.length || 0}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-[#121712] dark:text-white mb-4 border-l-4 border-[#33c738] pl-3">
                                    Desglose por Zona
                                </h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold text-[10px] uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Zona</th>
                                                <th className="px-4 py-3">Entrada (HH:MM)</th>
                                                <th className="px-4 py-3">Sup. Entrante</th>
                                                <th className="px-4 py-3">Sup. Saliente</th>
                                                <th className="px-4 py-3 text-center">Extras</th>
                                                <th className="px-4 py-3 text-center">Gaps</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedReport.shift_details?.map((d: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                    <td className="px-4 py-3 font-bold text-[#33c738]">{d.zones?.name}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                        {(() => {
                                                            const val = d.entry_hours
                                                            if (val === null || val === undefined) return '-'
                                                            const h = Math.floor(val)
                                                            const m = Math.round((val - h) * 60)
                                                            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                        {d.incoming_supervisor_id ? (profilesMap[d.incoming_supervisor_id] || 'ID: ' + d.incoming_supervisor_id.substring(0, 4)) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                        {d.outgoing_supervisor_id ? (profilesMap[d.outgoing_supervisor_id] || 'ID: ' + d.outgoing_supervisor_id.substring(0, 4)) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-blue-500">{d.extra_hours}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-red-500">{d.empty_posts}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {selectedReport.observations && (
                                <div>
                                    <h3 className="text-sm font-bold text-[#121712] dark:text-white mb-4 border-l-4 border-[#33c738] pl-3">
                                        Observaciones Generales
                                    </h3>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                        {selectedReport.observations}
                                    </div>
                                </div>
                            )}

                            {/* Justifications List if any */}
                            {selectedReport.shift_details?.some((d: any) => d.justification) && (
                                <div>
                                    <h3 className="text-sm font-bold text-[#121712] dark:text-white mb-4 border-l-4 border-red-500 pl-3">
                                        Justificaciones de Gaps
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedReport.shift_details.filter((d: any) => d.justification).map((d: any, i: number) => (
                                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                                <span className="text-xs font-bold text-red-500 uppercase min-w-[80px]">{d.zones?.name}</span>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{d.justification}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-white/5 flex justify-end">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-6 py-2 bg-[#121712] dark:bg-white text-white dark:text-black rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
