
import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  addDays, 
  isWithinInterval
} from 'date-fns';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';
import { startOfToday } from 'date-fns/startOfToday';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon,
  Trash2,
  CheckCircle2,
  Droplets,
  Wind,
  Loader2
} from 'lucide-react';
import { AgendaItem, Client, ApplicationType, User as UserType } from '../types';

const dfRound = (val: number): number => {
  let v = Math.round(val * 100) / 100;
  const decimals = v - Math.floor(v);
  if (decimals > 0.95) return Math.ceil(v);
  return v;
};

interface AgendaViewProps {
  agenda: AgendaItem[];
  onAddAgenda: (item: AgendaItem) => Promise<boolean>;
  onDeleteAgenda: (id: string) => Promise<void>;
  clients: Client[];
  user: UserType;
  onEfetivar: (item: AgendaItem) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ agenda, onAddAgenda, onDeleteAgenda, clients, user, onEfetivar }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [hectares, setHectares] = useState(0);
  const [type, setType] = useState<ApplicationType>(ApplicationType.PULVERIZACAO);
  const [notes, setNotes] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedArea = selectedClient?.areas.find(a => a.id === selectedAreaId);

  // Auto-fill hectares when area is selected
  useEffect(() => {
    if (selectedArea) {
      setHectares(selectedArea.hectares);
    }
  }, [selectedArea]);

  const getDayItems = (day: Date) => agenda.filter(item => isSameDay(parseISO(item.date), day));
  
  const upcomingItems = useMemo(() => {
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    return agenda
      .filter(item => {
        const itemDate = parseISO(item.date);
        return isWithinInterval(itemDate, { start: today, end: nextWeek });
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [agenda]);

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedArea) {
      alert("Por favor, selecione um produtor e uma área.");
      return;
    }

    setIsSubmitting(true);

    const newItem: AgendaItem = {
      id: Math.random().toString(36).substr(2, 9),
      date: formDate,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      areaId: selectedArea.id,
      areaName: selectedArea.name,
      hectares: dfRound(hectares),
      type,
      notes,
      createdBy: user.name,
      status: 'pending'
    };

    const success = await onAddAgenda(newItem);
    
    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedAreaId('');
    setHectares(0);
    setNotes('');
    setFormDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-100" />
            <h3 className="font-black uppercase tracking-widest text-[10px]">Próximos 7 Dias</h3>
          </div>
          <div className="space-y-4">
            {upcomingItems.length > 0 ? upcomingItems.map(item => (
              <div key={item.id} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black text-indigo-200 mb-1 uppercase tracking-widest">
                  {format(parseISO(item.date), "dd 'de' MMM", { locale: ptBR })}
                </p>
                <div className="flex items-center justify-between gap-2">
                   <p className="text-sm font-black truncate">{item.clientName}</p>
                   {item.type === ApplicationType.PULVERIZACAO ? <Droplets className="w-4 h-4 shrink-0 text-emerald-400" /> : <Wind className="w-4 h-4 shrink-0 text-amber-400" />}
                </div>
                <p className="text-[10px] font-bold opacity-60 truncate mt-1">{item.areaName} • {item.hectares} ha</p>
              </div>
            )) : (
              <p className="text-xs font-bold opacity-50 italic py-4">Nenhum serviço planejado.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status de Campo</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-lg bg-indigo-500 shadow-sm" />
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Agendamento</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-lg bg-emerald-500 shadow-sm" />
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Execução Realizada</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-200 rounded-xl border border-slate-200 text-slate-600 transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-200 rounded-xl border border-slate-200 text-slate-600 transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Agendar Novo Serviço
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}

          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[120px]" />
          ))}

          {days.map(day => {
            const dayItems = getDayItems(day);
            const isToday = isSameDay(day, startOfToday());
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <div 
                key={day.toString()} 
                onClick={() => setSelectedDay(day)}
                className={`bg-white min-h-[120px] p-2 transition-all cursor-pointer relative border-t border-l border-slate-100 hover:bg-indigo-50/30 ${isSelected ? 'ring-4 ring-inset ring-indigo-500/20 bg-indigo-50/20 z-10' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map(item => (
                    <div key={item.id} className="text-[9px] px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-black truncate uppercase leading-none">
                      {item.clientName}
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-[8px] font-black text-indigo-400 text-center uppercase mt-1">
                      + {dayItems.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDay && (
          <div className="bg-white rounded-[2.5rem] border-2 border-indigo-500 p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                    {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{getDayItems(selectedDay).length} operações planejadas para o dia</p>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X className="w-8 h-8" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getDayItems(selectedDay).map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 relative group hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h5 className="font-black text-slate-800 text-xl leading-tight truncate">{item.clientName}</h5>
                      <p className="text-xs text-indigo-600 font-black flex items-center gap-1 uppercase mt-2 tracking-widest">
                        <MapPin className="w-4 h-4" /> {item.areaName} ({item.hectares} ha)
                      </p>
                    </div>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${item.type === ApplicationType.PULVERIZACAO ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {item.type}
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-6 flex-1 shadow-sm">
                    <p className="text-xs text-slate-600 italic leading-relaxed">"{item.notes || 'Sem observações operacionais.'}"</p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => onEfetivar(item)}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Efetivar Operação
                    </button>
                    <button 
                      onClick={() => onDeleteAgenda(item.id)}
                      className="p-4 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
              {getDayItems(selectedDay).length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl">Nenhuma operação para este dia.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-white relative">
              <h3 className="text-3xl font-black tracking-tight uppercase italic">Agendamento</h3>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mt-2">DroneFlow Intelligence</p>
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full text-white transition-all"><X className="w-8 h-8" /></button>
            </div>
            
            <form onSubmit={handleAddAgenda} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Operação</label>
                   <input 
                    type="date" 
                    required 
                    value={formDate} 
                    onChange={e => setFormDate(e.target.value)} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" 
                  />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área Total (Ha)</label>
                   <input 
                    type="number" 
                    required 
                    step="0.01" 
                    value={hectares || ''} 
                    onChange={e => setHectares(parseFloat(e.target.value))} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produtor / Fazenda</label>
                 <select 
                  required 
                  value={selectedClientId} 
                  onChange={e => { setSelectedClientId(e.target.value); setSelectedAreaId(''); }} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                 >
                  <option value="">Selecione o Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área / Talhão</label>
                 <select 
                  required 
                  disabled={!selectedClientId} 
                  value={selectedAreaId} 
                  onChange={e => setSelectedAreaId(e.target.value)} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-40"
                 >
                  <option value="">Selecione a Área</option>
                  {selectedClient?.areas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.hectares} ha)</option>)}
                 </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidade Técnica</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as ApplicationType)} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value={ApplicationType.PULVERIZACAO}>Pulverização de Líquidos</option>
                  <option value={ApplicationType.DISPERSAO}>Dispersão de Sólidos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações de Campo</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[100px] resize-none" 
                  placeholder="Ex: Condição do solo, pragas identificadas..." 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar Planejamento'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaView;
