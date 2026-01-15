
import React from 'react';
import { X, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Users, Lock, RotateCcw, Ruler, Download, RefreshCw } from 'lucide-react';
import { ServiceRecord, PartnerSummary, ClosedMonth } from '../types';
import { generateClosingPDF } from '../lib/pdfService';

interface MonthClosingModalProps {
  onClose: () => void;
  onConfirm: () => void;
  onReopen?: (monthYear: string) => void;
  isAlreadyClosed: boolean;
  closedMonthData?: ClosedMonth;
  data: {
    totalRev: number;
    totalExp: number;
    hectares: number;
    monthServices: ServiceRecord[];
    summaries: PartnerSummary[];
    label: string;
    monthYear: string;
  };
}

const MonthClosingModal: React.FC<MonthClosingModalProps> = ({ onClose, onConfirm, onReopen, isAlreadyClosed, closedMonthData, data }) => {
  const displayData = isAlreadyClosed && closedMonthData ? {
    totalRev: closedMonthData.totalRevenue,
    totalExp: closedMonthData.totalExpenses,
    hectares: closedMonthData.hectares,
    summaries: closedMonthData.partnerSummaries,
    label: closedMonthData.label,
    servicesCount: closedMonthData.services.length,
    services: closedMonthData.services,
    raw: closedMonthData
  } : {
    totalRev: data.totalRev,
    totalExp: data.totalExp,
    hectares: data.hectares,
    summaries: data.summaries,
    label: data.label,
    servicesCount: data.monthServices.length,
    services: data.monthServices,
    raw: null
  };

  const netProfit = displayData.totalRev - displayData.totalExp;
  const isPositive = netProfit >= 0;

  const handleConfirmAndDownload = () => {
    const fakeClosedMonth: ClosedMonth = {
      id: 'temp',
      monthYear: data.monthYear,
      label: data.label,
      totalRevenue: data.totalRev,
      totalExpenses: data.totalExp,
      netProfit: data.totalRev - data.totalExp,
      hectares: data.hectares,
      services: data.monthServices,
      expenses: [], 
      partnerSummaries: data.summaries,
      closedAt: new Date().toISOString()
    };
    
    onConfirm();
    setTimeout(() => generateClosingPDF(fakeClosedMonth), 500);
  };

  const getSafeHectares = (summary: PartnerSummary) => {
    if (summary.hectares && summary.hectares > 0) return summary.hectares;
    if (summary.name.includes('Kaká')) {
        return displayData.services
            .filter(s => s.clientName.toLowerCase().includes('kaká'))
            .reduce((acc, s) => acc + s.hectares, 0);
    }
    if (summary.name.includes('Patrick')) {
        return displayData.services
            .filter(s => s.clientName.toLowerCase().includes('patrick'))
            .reduce((acc, s) => acc + s.hectares, 0);
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className={`${isAlreadyClosed ? 'bg-red-600' : 'bg-slate-900'} px-10 py-8 flex items-center justify-between text-white`}>
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-3">
              {isAlreadyClosed ? <Lock className="w-8 h-8" /> : 'Consolidação'}
            </h3>
            <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em]">{displayData.label}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAlreadyClosed && displayData.raw && (
              <button onClick={() => generateClosingPDF(displayData.raw!)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Download className="w-6 h-6 text-white" /></button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
          </div>
        </div>

        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-sm">
               <TrendingUp className="w-5 h-5 text-slate-400 mb-3" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hectares Totais</p>
               <p className="text-2xl font-black text-slate-900">{displayData.hectares.toLocaleString()} ha</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-sm">
               <DollarSign className="w-5 h-5 text-emerald-600 mb-3" />
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Faturamento</p>
               <p className="text-2xl font-black text-emerald-700">R$ {displayData.totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className={`p-6 rounded-[2rem] shadow-xl border ${isPositive ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-red-900 border-red-500 text-white'}`}>
               <CheckCircle2 className={`w-5 h-5 mb-3 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`} />
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Lucro Empresa</p>
               <p className="text-2xl font-black">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Users className="w-5 h-5 text-emerald-500" /> Detalhamento por Sócio</h4>
            <div className="space-y-4">
              {displayData.summaries.map((s, idx) => {
                const isGeraldo = s.name.toLowerCase().includes('geraldo');
                const isIndependente = s.name.toLowerCase().includes('reserva');
                const partnerHectares = getSafeHectares(s);

                return (
                  <div key={idx} className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.name}</p>
                        <p className={`text-3xl font-black ${s.netProfit >= 0 ? 'text-slate-900' : 'text-red-700'}`}>R$ {s.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      {s.reimbursements > 0 && (
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 text-[9px] font-black uppercase flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> Reembolso Incluído
                          </div>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-slate-200 pt-4 text-[11px] font-bold text-slate-600">
                      {/* Fix: replaced undefined variable 'isReserva' with 'isIndependente' */}
                      {!isIndependente && (
                        <div className="flex justify-between items-center">
                          <span>Cota Participação (25%):</span>
                          <span>R$ {s.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      
                      {s.salary && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span>Pró-labore Fixo:</span>
                          <span>R$ {s.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {s.reimbursements > 0 && (
                        <div className="flex justify-between items-center text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                          <span>Aportes p/ Despesas (Reembolso):</span>
                          <span className="font-black">+ R$ {s.reimbursements.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {s.deductions > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                          <span>Deduções ({partnerHectares} ha):</span>
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

        <div className="p-10 border-t border-slate-200 bg-slate-50 flex gap-4 shrink-0">
          {isAlreadyClosed ? (
            <button onClick={() => onReopen && onReopen(data.monthYear)} className="flex-1 py-5 bg-white border-2 border-red-600 text-red-600 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-all uppercase text-xs tracking-widest"><RotateCcw className="w-5 h-5" /> Reabrir Operações</button>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-5 border-2 border-slate-300 rounded-[2rem] font-black text-slate-400 uppercase text-xs tracking-widest">Revisar Planilha</button>
              <button onClick={handleConfirmAndDownload} className="flex-[1.5] py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest active:scale-95 shadow-emerald-600/20">Finalizar Fechamento</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthClosingModal;
