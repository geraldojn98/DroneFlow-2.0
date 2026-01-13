
import React from 'react';
import { X, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Users, Lock, RotateCcw, Ruler, Download } from 'lucide-react';
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
    // Ao confirmar, os dados atuais são transformados no objeto que o PDFService espera
    const fakeClosedMonth: ClosedMonth = {
      id: 'temp',
      monthYear: data.monthYear,
      label: data.label,
      totalRevenue: data.totalRev,
      totalExpenses: data.totalExp,
      netProfit: data.totalRev - data.totalExp,
      hectares: data.hectares,
      services: data.monthServices,
      expenses: [], // Opcional para o PDF simples
      partnerSummaries: data.summaries,
      closedAt: new Date().toISOString()
    };
    
    onConfirm();
    // Pequeno delay para garantir que o processo de salvamento iniciou e dar feedback visual
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
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className={`${isAlreadyClosed ? 'bg-red-600' : 'bg-slate-900'} px-8 py-6 flex items-center justify-between text-white`}>
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {isAlreadyClosed ? <Lock className="w-6 h-6" /> : 'Fechamento Mensal'}
            </h3>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">{displayData.label}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAlreadyClosed && displayData.raw && (
              <button 
                onClick={() => generateClosingPDF(displayData.raw!)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="Baixar PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar text-slate-800">
          <div className={`${isAlreadyClosed ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-amber-50 border-amber-200 text-amber-900'} p-4 rounded-xl flex gap-3`}>
            {isAlreadyClosed ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            <div className="text-sm">
              <p className="font-black uppercase tracking-widest mb-1">{isAlreadyClosed ? 'Mês Consolidado' : 'Atenção Operacional'}</p>
              <p className="font-medium">{isAlreadyClosed ? `Fechamento realizado em ${new Date(closedMonthData?.closedAt || '').toLocaleDateString()}.` : 'O fechamento criará um registro histórico permanente e um relatório PDF será baixado automaticamente.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
               <TrendingUp className="w-4 h-4 text-slate-400 mb-2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hectares Totais</p>
               <p className="text-2xl font-black text-slate-900">{displayData.hectares.toLocaleString()} ha</p>
               <p className="text-[10px] text-slate-400 font-bold">{displayData.servicesCount} lançamentos</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
               <DollarSign className="w-4 h-4 text-emerald-600 mb-2" />
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Faturamento</p>
               <p className="text-2xl font-black text-emerald-700">R$ {displayData.totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className={`p-4 rounded-2xl shadow-md border ${isPositive ? 'bg-emerald-100 border-emerald-200 text-emerald-900' : 'bg-red-100 border-red-200 text-red-900'}`}>
               <CheckCircle2 className={`w-4 h-4 mb-2 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`} />
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Lucro Líquido</p>
               <p className="text-2xl font-black">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500" /> Partilha de Lucros Consolidada</h4>
            <div className="space-y-3">
              {displayData.summaries.map((s, idx) => {
                const totalFinal = s.netProfit + (s.salary || 0);
                const isGeraldo = s.name.toLowerCase().includes('geraldo');
                const isIndependente = s.name.toLowerCase().includes('reserva');
                const partnerHectares = getSafeHectares(s);

                return (
                  <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.name}</p>
                        <p className={`text-xl font-black ${totalFinal >= 0 ? 'text-slate-900' : 'text-red-700'}`}>R$ {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                            <span className="flex items-center gap-1 uppercase text-[9px]"><Ruler className="w-3 h-3" /> Produção no Mês:</span>
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
                            <span>Diferença (Saldo Líquido):</span>
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

        <div className="p-8 border-t border-slate-200 bg-slate-50 flex gap-4">
          {isAlreadyClosed ? (
            <button onClick={() => onReopen && onReopen(data.monthYear)} className="flex-1 py-4 bg-white border border-red-600 text-red-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-all uppercase text-xs tracking-widest"><RotateCcw className="w-5 h-5" /> Reabrir Mês</button>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-4 border border-slate-300 rounded-2xl font-black text-slate-600 uppercase text-xs tracking-widest">Revisar Dados</button>
              <button onClick={handleConfirmAndDownload} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest active:scale-95">Confirmar Fechamento</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthClosingModal;
