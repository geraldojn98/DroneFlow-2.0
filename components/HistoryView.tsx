
import React, { useState } from 'react';
import { ClosedMonth, PartnerSummary } from '../types';
import { ChevronUp, FileText, Calendar, TrendingUp, Ruler, Users, X, RotateCcw, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';
import { generateClosingPDF } from '../lib/pdfService';

interface HistoryViewProps {
  closedMonths: ClosedMonth[];
  onReopenMonth?: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ closedMonths, onReopenMonth }) => {
  const [selectedMonth, setSelectedMonth] = useState<ClosedMonth | null>(null);
  const [isConfirmingReopen, setIsConfirmingReopen] = useState(false);

  const formatHectares = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleReopen = () => {
    if (selectedMonth && onReopenMonth) {
      onReopenMonth(selectedMonth.monthYear);
      setSelectedMonth(null);
      setIsConfirmingReopen(false);
    }
  };

  const handleDownload = (e: React.MouseEvent, month: ClosedMonth) => {
    e.stopPropagation();
    generateClosingPDF(month);
  };

  const getSafeHectares = (summary: PartnerSummary, month: ClosedMonth) => {
    if (summary.hectares && summary.hectares > 0) return summary.hectares;
    if (summary.name.includes('Kaká')) {
        return month.services
            .filter(s => s.clientName.toLowerCase().includes('kaká'))
            .reduce((acc, s) => acc + s.hectares, 0);
    }
    if (summary.name.includes('Patrick')) {
        return month.services
            .filter(s => s.clientName.toLowerCase().includes('patrick'))
            .reduce((acc, s) => acc + s.hectares, 0);
    }
    return 0;
  };

  if (closedMonths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
        <Calendar className="w-20 h-20 mb-6 opacity-10" />
        <p className="text-sm font-black uppercase tracking-widest italic">Histórico Vazio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {closedMonths.map(month => (
          <div key={month.id} onClick={() => setSelectedMonth(month)} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-900 text-white p-3 rounded-2xl group-hover:bg-emerald-600 transition-colors">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={(e) => handleDownload(e, month)}
                  className="p-3 bg-slate-50 hover:bg-emerald-100 text-slate-300 hover:text-emerald-600 rounded-2xl transition-all"
                  title="Baixar PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 capitalize mb-4 tracking-tight">{month.label}</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Produção</p>
                <p className="font-black text-slate-700 text-sm flex items-center gap-1">{formatHectares(month.hectares)} ha</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Liq.</p>
                <p className={`font-black text-sm ${month.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>R$ {month.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                <span>Relatório Consolidado</span>
                <ChevronUp className="w-4 h-4 rotate-90 opacity-40 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {selectedMonth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between text-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-2 rounded-xl"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight">{selectedMonth.label}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => generateClosingPDF(selectedMonth)}
                  className="p-3 bg-white/10 hover:bg-emerald-600 text-white rounded-2xl transition-all"
                >
                  <Download className="w-6 h-6" />
                </button>
                <button onClick={() => { setSelectedMonth(null); setIsConfirmingReopen(false); }} className="p-3 hover:bg-white/10 rounded-full transition-all"><X className="w-8 h-8" /></button>
              </div>
            </div>
            <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-1 custom-scrollbar text-slate-800">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Hectares</p>
                  <p className="text-xl font-black text-slate-900">{formatHectares(selectedMonth.hectares)} ha</p>
                </div>
                <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Receita</p>
                  <p className="text-xl font-black text-emerald-700">R$ {selectedMonth.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 bg-red-50 rounded-3xl border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-2 tracking-widest">Custos</p>
                  <p className="text-xl font-black text-red-700">R$ {selectedMonth.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 bg-slate-900 rounded-3xl text-white">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Lucro</p>
                  <p className="text-xl font-black text-emerald-400">R$ {selectedMonth.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px] italic">
                    <Users className="w-5 h-5 text-emerald-500" /> Partilha Consolidada
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                  {selectedMonth.partnerSummaries.map((s, idx) => {
                    const totalFinal = s.netProfit + (s.salary || 0);
                    const partnerHectares = getSafeHectares(s, selectedMonth);

                    return (
                      <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem]">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.name}</p>
                            <p className={`text-2xl font-black ${totalFinal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>R$ {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-200 pt-4 text-[10px] font-bold text-slate-500">
                            <div className="flex justify-between">
                                <span className="uppercase tracking-widest font-black opacity-60">Produção</span>
                                <span className="text-slate-800">{formatHectares(partnerHectares)} ha</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="uppercase tracking-widest font-black opacity-60">Repasse</span>
                                <span className="text-slate-800">R$ {s.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {s.deductions > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span className="uppercase tracking-widest font-black opacity-60">Dedução</span>
                                    <span>- R$ {s.deductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              {!isConfirmingReopen ? (
                <button onClick={() => setIsConfirmingReopen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all uppercase text-[10px] tracking-widest">
                    <RotateCcw className="w-4 h-4" /> Reabrir Lançamentos
                </button>
              ) : (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <button onClick={handleReopen} className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Confirmar Reabertura</button>
                   <button onClick={() => setIsConfirmingReopen(false)} className="px-4 py-3 bg-slate-200 text-slate-600 font-black rounded-xl uppercase text-[10px] tracking-widest transition-all">Cancelar</button>
                </div>
              )}
              <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">DroneFlow v2.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
