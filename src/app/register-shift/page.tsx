'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    PlusCircle,
    Calendar,
    Clock,
    Info,
    Save,
    X,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function RegisterShift() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [zones, setZones] = useState<any[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [shiftType, setShiftType] = useState('Turno 1 (Mañana)')
    const [observations, setObservations] = useState('')
    const [currentDate, setCurrentDate] = useState('') // Client-side only date
    const [rows, setRows] = useState<any[]>([
        { zone_id: '', incoming_sup: '', outgoing_sup: '', entry: 8, extra: 0, gaps: 0, justification: '', status: 'Completo' }
    ])

    const REQUIRED_ZONES = [
        'Village',
        'Zona 6',
        'Aguila 16',
        'Club Med',
        'Hotel',
        'Corales',
        'Golf',
        'Gate Turistico',
        'Gate de Servicio'
    ]

    useEffect(() => {
        // Set date on client side to match server/client render
        setCurrentDate(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }))

        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()

            const { data: zonesData } = await supabase.from('zones').select('*')
            const { data: profilesData } = await supabase.from('profiles').select('*')

            let finalZones = zonesData || []

            // Auto-seed missing zones if user is admin
            if (profile?.role === 'admin') {
                const missingZones = REQUIRED_ZONES.filter(
                    name => !finalZones.some(z => z.name === name)
                )

                if (missingZones.length > 0) {
                    const { data: newInserted } = await supabase
                        .from('zones')
                        .insert(missingZones.map(name => ({ name })))
                        .select()

                    if (newInserted) {
                        finalZones = [...finalZones, ...newInserted]
                    } else {
                        // Re-fetch if insert select didn't return (RLS might be tricky with insert select)
                        const { data: reFetched } = await supabase.from('zones').select('*')
                        if (reFetched) finalZones = reFetched
                    }
                }
            }

            setZones(finalZones)
            if (profilesData) setProfiles(profilesData)
        }
        fetchData()
    }, [])

    const addRow = () => {
        setRows([...rows, { zone_id: '', incoming_sup: '', outgoing_sup: '', entry: 8.0, extra: 0, gaps: 0, justification: '', status: 'Completo' }])
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, field: string, value: any) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [field]: value }
        setRows(newRows)
    }

    const handleSubmit = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Filter valid rows (must have a zone)
        const validRows = rows.filter(r => r.zone_id && r.zone_id !== '')

        if (validRows.length === 0) {
            alert('Por favor, seleccione al menos una zona válida para registrar.')
            setLoading(false)
            return
        }

        // 2. Create Shift Report
        const { data: report, error: reportError } = await supabase
            .from('shift_reports')
            .insert({
                shift_type: shiftType,
                observations: observations.trim(),
                created_by: user.id,
                date: new Date().toISOString().split('T')[0] // Save YYYY-MM-DD
            })
            .select()
            .single()

        if (reportError) {
            alert('Error creating report: ' + reportError.message)
            setLoading(false)
            return
        }

        // 3. Create Shift Details
        const details = validRows.map(r => ({
            report_id: report.id,
            zone_id: r.zone_id,
            incoming_supervisor_id: r.incoming_sup?.trim() || null,
            outgoing_supervisor_id: r.outgoing_sup?.trim() || null,
            entry_hours: r.entry || 0,
            extra_hours: r.extra || 0,
            empty_posts: r.gaps || 0,
            justification: r.justification?.trim() || '',
            status: r.status
        }))

        const { error: detailsError } = await supabase.from('shift_details').insert(details)

        if (detailsError) {
            console.error('Error saving details:', detailsError)
            alert('Error al guardar detalles: ' + detailsError.message)
        } else {
            router.push('/PanelDeControlDeSupervision')
        }
        setLoading(false)
    }

    return (
        <div className="flex bg-[#f6f8f6] dark:bg-[#131f13] min-h-screen">
            <Sidebar />
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pt-16 lg:pt-0">
                <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-[#33c738] p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white shadow-lg shadow-[#33c738]/20">
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-xl font-bold text-[#121712] dark:text-white leading-tight">Registro de Turno</h1>
                                <p className="text-[9px] sm:text-[10px] text-[#33c738] font-bold uppercase tracking-wider hidden sm:block">Operaciones Diarias</p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <button
                                onClick={() => router.push('/PanelDeControlDeSupervision')}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 sm:gap-2 min-h-[44px]"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Cancelar</span>
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-[#33c738] hover:bg-[#33c738]/90 text-white px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-lg shadow-[#33c738]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 sm:gap-2 disabled:opacity-50 min-h-[44px]"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />} Guardar
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col min-h-screen">
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
                            {/* Metadata Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[#121712] dark:text-white">Turno</label>
                                    <select
                                        value={shiftType}
                                        onChange={(e) => setShiftType(e.target.value)}
                                        className="w-full h-11 sm:h-12 px-3 sm:px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#33c738]/20 focus:border-[#33c738] outline-none transition-all"
                                    >
                                        <option>Turno 1 (Mañana)</option>
                                        <option>Turno 2 (Tarde)</option>
                                        <option>Turno 3 (Noche)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[#121712] dark:text-white">Fecha</label>
                                    <div className="relative">
                                        <input
                                            className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#33c738]/20 focus:border-[#33c738] outline-none transition-all"
                                            type="text"
                                            readOnly
                                            value={currentDate}
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#678368] dark:text-[#33c738]" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                                    <label className="text-sm font-semibold text-[#121712] dark:text-white">Estado General</label>
                                    <div className="flex items-center gap-3 h-11 sm:h-12 px-4 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                                        <span className="w-3 h-3 rounded-full bg-[#33c738] animate-pulse"></span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Turno en Proceso</span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[1200px]">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-slate-700">
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-48">Zona</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-56">Sup. Entrante</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-56">Sup. Saliente</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-24 text-center">Horas Ent.</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-24 text-center">H. Extras</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-24 text-center">P. Vacíos</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-64">Detalles / Justificación</th>
                                                <th className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-32 text-center">Estado</th>
                                                <th className="px-4 py-4 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {rows.map((row, index) => (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={row.zone_id}
                                                            onChange={(e) => updateRow(index, 'zone_id', e.target.value)}
                                                            className="w-full text-sm border-none focus:ring-0 bg-transparent dark:bg-transparent font-medium text-slate-900 dark:text-white"
                                                        >
                                                            <option value="">Seleccionar Zona</option>
                                                            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={row.incoming_sup}
                                                            onChange={(e) => updateRow(index, 'incoming_sup', e.target.value)}
                                                            className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded px-2 py-1.5 focus:ring-1 focus:ring-[#33c738]"
                                                        >
                                                            <option value="">Seleccionar Sup.</option>
                                                            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={row.outgoing_sup}
                                                            onChange={(e) => updateRow(index, 'outgoing_sup', e.target.value)}
                                                            className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded px-2 py-1.5 focus:ring-1 focus:ring-[#33c738]"
                                                        >
                                                            <option value="">Seleccionar Sup.</option>
                                                            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="time"
                                                            value={(() => {
                                                                // Convert decimal hours back to HH:MM for input
                                                                if (!row.entry && row.entry !== 0) return ''
                                                                const h = Math.floor(row.entry)
                                                                const m = Math.round((row.entry - h) * 60)
                                                                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                                            })()}
                                                            onChange={(e) => {
                                                                const [h, m] = e.target.value.split(':').map(Number)
                                                                const decimal = h + (m / 60)
                                                                updateRow(index, 'entry', decimal) // Store as float
                                                            }}
                                                            className="w-24 mx-auto block text-center text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded py-1.5"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            value={row.extra}
                                                            onChange={(e) => updateRow(index, 'extra', parseInt(e.target.value))}
                                                            className="w-16 mx-auto block text-center text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded py-1.5"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            value={row.gaps}
                                                            onChange={(e) => updateRow(index, 'gaps', parseInt(e.target.value))}
                                                            className={`w-16 mx-auto block text-center text-sm border rounded py-1.5 ${row.gaps > 0 ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <textarea
                                                            value={row.justification}
                                                            onChange={(e) => updateRow(index, 'justification', e.target.value)}
                                                            className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded p-2 h-10 resize-none focus:h-24 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                            placeholder="Agregar justificación..."
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <select
                                                            value={row.status}
                                                            onChange={(e) => updateRow(index, 'status', e.target.value)}
                                                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold border uppercase ${row.status === 'Completo' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700' :
                                                                row.status === 'Pendiente' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700' :
                                                                    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700'
                                                                }`}
                                                        >
                                                            <option>Completo</option>
                                                            <option>Pendiente</option>
                                                            <option>Faltante</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <button onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-[#33c738] hover:text-[#33c738]/80 transition-colors min-h-[44px]">
                                        <PlusCircle size={18} /> Añadir Zona
                                    </button>
                                </div>
                            </div>

                            {/* Observations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-sm font-bold text-[#121712] dark:text-white mb-4 flex items-center gap-2">
                                        <Info size={18} /> Observaciones Generales del Turno
                                    </h3>
                                    <textarea
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        className="w-full h-32 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-[#33c738]/20 focus:border-[#33c738] outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="Escriba cualquier novedad relevante..."
                                    />
                                </div>
                                <div className="bg-[#33c738]/5 dark:bg-[#33c738]/10 p-4 sm:p-6 rounded-xl border border-[#33c738]/20 dark:border-[#33c738]/30 flex flex-col justify-center items-center text-center">
                                    <div className="bg-white dark:bg-zinc-800 p-3 rounded-full mb-3 shadow-sm text-[#33c738]">
                                        <Clock size={28} className="sm:w-8 sm:h-8" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[#121712] dark:text-white">Recordatorio</h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-xs">
                                        Valide toda la información antes de guardar. Una vez registrado, el reporte estará disponible en el dashboard de supervisión.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
