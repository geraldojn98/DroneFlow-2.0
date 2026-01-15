
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
  const formatHectares = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className={`${isAlreadyClosed ? 'bg-red-600' : 'bg-slate-900'} px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between text-white relative shrink-0`}>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic flex items-center gap-3">
              {isAlreadyClosed ? <Lock className="w-7 h-7" /> : 'Consolidação'}
            </h3>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">{displayData.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAlreadyClosed && displayData.raw && (
              <button onClick={() => generateClosingPDF(displayData.raw!)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"><Download className="w-6 h-6" /></button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all"><X className="w-8 h-8" /></button>
          </div>
        </div>

        <div className="p-6 sm:p-10 overflow-y-auto space-y-10 custom-scrollbar text-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-sm">
               <TrendingUp className="w-4 h-4 text-slate-400 mb-2 sm:mb-3" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hectares</p>
               <p className="text-xl sm:text-2xl font-black text-slate-900">{formatHectares(displayData.hectares)}</p>
            </div>
            <div className="p-4 sm:p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-sm">
               <DollarSign className="w-4 h-4 text-emerald-600 mb-2 sm:mb-3" />
               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Receita</p>
               <p className="text-xl sm:text-2xl font-black text-emerald-700">R$ {displayData.totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</p>
            </div>
            <div className={`col-span-2 sm:col-span-1 p-4 sm:p-6 rounded-[2rem] shadow-xl border ${isPositive ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-red-900 border-red-500 text-white'}`}>
               <CheckCircle2 className={`w-4 h-4 mb-2 sm:mb-3 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`} />
               <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Lucro Liq.</p>
               <p className="text-xl sm:text-2xl font-black">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                <Users className="w-5 h-5 text-emerald-500" /> Repasse Individual
            </h4>
            <div className="space-y-4 pb-6">
              {displayData.summaries.map((s, idx) => {
                const partnerHectares = getSafeHectares(s);
                const isIndependente = s.name.toLowerCase().includes('reserva');

                return (
                  <div key={idx} className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{s.name}</p>
                        <p className={`text-xl sm:text-2xl font-black break-words ${s.netProfit >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                            R$ {s.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {s.reimbursements > 0 && (
                          <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-xl border border-emerald-200 text-[8px] font-black uppercase whitespace-nowrap">
                              Reembolso
                          </div>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-slate-200 pt-4 text-[10px] sm:text-[11px] font-bold text-slate-500">
                      {!isIndependente && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="uppercase tracking-widest font-black opacity-60">Produção</span>
                                <span className="text-slate-800">{formatHectares(partnerHectares)} ha</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="uppercase tracking-widest font-black opacity-60">Repasse (25%)</span>
                                <span className="text-slate-800">R$ {s.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </>
                      )}
                      
                      {s.salary && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span className="uppercase tracking-widest font-black opacity-60">Pró-labore</span>
                          <span>R$ {s.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {s.reimbursements > 0 && (
                        <div className="flex justify-between items-center text-indigo-600 bg-indigo-50 p-2 rounded-xl">
                          <span className="uppercase tracking-widest font-black opacity-60">Aportes Reembolsados</span>
                          <span className="font-black">+ R$ {s.reimbursements.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {s.deductions > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                          <span className="uppercase tracking-widest font-black opacity-60">Dedução ha</span>
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

        <div className="p-6 sm:p-10 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 shrink-0">
          {isAlreadyClosed ? (
            <button onClick={() => onReopen && onReopen(data.monthYear)} className="flex-1 py-5 bg-white border-2 border-red-600 text-red-600 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-all uppercase text-[10px] tracking-widest"><RotateCcw className="w-4 h-4" /> Reabrir Ciclo</button>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-4 sm:py-5 border-2 border-slate-200 rounded-[2rem] font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-100">Cancelar</button>
              <button onClick={handleConfirmAndDownload} className="flex-[1.5] py-4 sm:py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-emerald-700 transition-all uppercase text-[10px] tracking-widest active:scale-95 shadow-emerald-600/20">Confirmar Fechamento</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthClosingModal;
