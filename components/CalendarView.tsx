
import React, { useState, useMemo } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths, isWithinInterval } from 'date-fns';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ChevronLeft, ChevronRight, MapPin, X, Search, History, Trash2, Lock, Calendar as CalendarIcon } from 'lucide-react';
import { ServiceRecord, ApplicationType, ClosedMonth } from '../types';

interface CalendarViewProps {
  services: ServiceRecord[];
  closedMonths: ClosedMonth[];
  onOpenClosing?: (monthData: { month: number; year: number; isClosed: boolean }) => void;
  onDeleteService?: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ services, closedMonths, onOpenClosing, onDeleteService }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const isMonthClosed = useMemo(() => {
    return closedMonths.some(cm => 
      cm.monthYear === `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
    );
  }, [closedMonths, currentDate]);

  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services;
    const term = searchTerm.toLowerCase();
    return services.filter(s => 
      s.clientName.toLowerCase().includes(term) || 
      s.areaName.toLowerCase().includes(term)
    );
  }, [services, searchTerm]);

  const getDayServices = (day: Date) => {
    return filteredServices.filter(s => isSameDay(parseISO(s.date), day));
  };

  const selectedDayServices = selectedDay ? getDayServices(selectedDay) : [];

  const handleClosingClick = () => {
    if (onOpenClosing) {
      onOpenClosing({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isClosed: isMonthClosed
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-black text-slate-800 capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h3>
          <div className="flex gap-1 ml-2">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg border transition-colors text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg border transition-colors text-slate-600"><ChevronRight className="w-4 h-4" /></button>
          </div>
          {onOpenClosing && (
            <button onClick={handleClosingClick} className={`ml-2 px-4 py-2 text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 ${isMonthClosed ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
              {isMonthClosed ? <><Lock className="inline w-3.5 h-3.5 mr-1 text-white" /> Fechado</> : <><History className="inline w-3.5 h-3.5 mr-1 text-emerald-400" /> Fechar Mês</>}
            </button>
          )}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" border-slate-200 placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
        ))}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[100px]" />)}
        {days.map(day => {
          const dayServices = getDayServices(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          return (
            <div key={day.toString()} onClick={() => setSelectedDay(day)} className={`bg-white min-h-[100px] p-2 transition-all cursor-pointer border-t border-l border-slate-100 relative ${isSelected ? 'bg-emerald-50/50 ring-2 ring-inset ring-emerald-500' : 'hover:bg-slate-50'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-xl ${isToday ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{format(day, 'd')}</span>
                {dayServices.length > 0 && (
                   <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg">{dayServices.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayServices.slice(0, 2).map(s => (
                  <div key={s.id} className="text-[8px] font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded truncate">{s.clientName}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 mt-4 shadow-xl relative overflow-hidden text-slate-800">
          {isMonthClosed && <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-tighter"><Lock className="inline w-3.5 h-3.5 mr-1 text-white" /> Mês Fechado</div>}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><CalendarIcon className="w-6 h-6" /></div>
              <div><h4 className="text-2xl font-black text-slate-800">{format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}</h4><p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedDayServices.length} Lançamentos</p></div>
            </div>
            <button onClick={() => { setSelectedDay(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-8 h-8 text-slate-600" /></button>
          </div>
          {selectedDayServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayServices.map(service => (
                <div key={service.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative group">
                  {isMonthClosed && <div className="absolute inset-0 bg-white/40 pointer-events-none" />}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-black text-slate-800 text-lg leading-tight">{service.clientName}</h5>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mt-1"><MapPin className="w-3 h-3 text-emerald-500" /> {service.areaName}</p>
                    </div>
                    {!isMonthClosed && onDeleteService && (
                      <button onClick={() => onDeleteService(service.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
                    <div><p className="text-[9px] text-slate-400 font-black uppercase">Área</p><p className="font-black text-slate-700 text-sm">{service.hectares} ha</p></div>
                    <div><p className="text-[9px] text-slate-400 font-black uppercase">Preço</p><p className="font-black text-slate-700 text-sm">R$ {service.unitPrice}</p></div>
                    <div><p className="text-[9px] text-slate-400 font-black uppercase">Total</p><p className="font-black text-emerald-600 text-sm">R$ {service.totalValue.toLocaleString()}</p></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="py-12 text-center text-slate-400 font-bold">Nenhum serviço registrado.</div>}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
