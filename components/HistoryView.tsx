
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
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed text-slate-400">
        <Calendar className="w-16 h-16 mb-4 opacity-10" />
        <p className="text-lg font-medium">Nenhum mês fechado no histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {closedMonths.map(month => (
          <div key={month.id} onClick={() => setSelectedMonth(month)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-emerald-600 transition-colors">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => handleDownload(e, month)}
                  className="p-2 bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                  title="Baixar PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">Fechado em {format(parseISO(month.closedAt), 'dd/MM/yy')}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 capitalize mb-4">{month.label}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hectares</p>
                <p className="font-bold text-slate-700 flex items-center gap-1"><Ruler className="w-3 h-3 text-slate-400" /> {month.hectares.toLocaleString()} ha</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo</p>
                <p className={`font-bold ${month.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>R$ {month.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform uppercase tracking-widest">VER DETALHES <ChevronUp className="w-4 h-4 rotate-90 text-emerald-600" /></div>
          </div>
        ))}
      </div>

      {selectedMonth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between text-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-2 rounded-xl"><FileText className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="text-2xl font-bold capitalize">{selectedMonth.label}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Relatório Mensal de Operações</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => generateClosingPDF(selectedMonth)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" /> Baixar PDF
                </button>
                <button onClick={() => { setSelectedMonth(null); setIsConfirmingReopen(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto space-y-10 flex-1 custom-scrollbar text-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Hectares Mensais</p>
                  <p className="text-2xl font-black text-slate-900">{selectedMonth.hectares.toLocaleString()} ha</p>
                </div>
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Faturamento</p>
                  <p className="text-2xl font-black text-emerald-700">R$ {selectedMonth.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-2 tracking-widest">Custos Totais</p>
                  <p className="text-2xl font-black text-red-700">R$ {selectedMonth.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 bg-slate-900 rounded-2xl text-white">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Resultado Líquido</p>
                  <p className="text-2xl font-black text-emerald-400">R$ {selectedMonth.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs"><Users className="w-5 h-5 text-emerald-500" /> Partilha de Lucros Consolidada</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMonth.partnerSummaries.map((s, idx) => {
                    const totalFinal = s.netProfit + (s.salary || 0);
                    const isGeraldo = s.name.toLowerCase().includes('geraldo');
                    const isIndependente = s.name.toLowerCase().includes('reserva');
                    const partnerHectares = getSafeHectares(s, selectedMonth);

                    return (
                      <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{s.name}</p>
                            <p className={`text-2xl font-black ${totalFinal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>R$ {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-200 pt-3 text-[11px] font-bold text-slate-600">
                          {isGeraldo ? (
                            <div className="flex justify-between items-center">
                              <span>Salário Fixo + Participação Lucro (25%)</span>
                              <span>R$ {s.salary?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ {s.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ) : !isIndependente ? (
                            <>
                              <div className="flex justify-between items-center text-indigo-700">
                                <span className="flex items-center gap-1 uppercase text-[9px]"><Ruler className="w-3 h-3" /> Produção Consolidada no Mês:</span>
                                <span>{partnerHectares} hectares pulverizados</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Participação de Lucro (25%):</span>
                                <span>R$ {s.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center text-red-600">
                                <span>Dedução Individual:</span>
                                <span>- R$ {s.deductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-slate-900">
                                <span>Diferença (Saldo Final):</span>
                                <span className={s.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>R$ {s.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span>Participação Fundo de Reserva (25%)</span>
                              <span>R$ {s.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DroneFlow Agriculture &copy; 2024</p>
              {!isConfirmingReopen ? (
                <button onClick={() => setIsConfirmingReopen(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-600 font-black rounded-xl shadow-sm hover:bg-slate-100 uppercase text-xs tracking-widest"><RotateCcw className="w-4 h-4" /> Revisar Mês</button>
              ) : (
                <div className="flex items-center gap-3">
                   <span className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase"><AlertTriangle className="w-4 h-4" /> Abrir para edição?</span>
                   <button onClick={handleReopen} className="px-4 py-2 bg-red-600 text-white font-black rounded-lg uppercase text-xs tracking-widest shadow-md">Sim</button>
                   <button onClick={() => setIsConfirmingReopen(false)} className="px-4 py-2 bg-slate-200 text-slate-600 font-black rounded-lg uppercase text-xs tracking-widest">Não</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
