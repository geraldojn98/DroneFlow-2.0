
import React, { useState } from 'react';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Briefcase, Ruler, 
  CalendarDays, CheckCircle2, History, Plus, X, DollarSign, Clock, Trash2, FileText,
  Calendar as CalendarIcon
} from 'lucide-react';
import { PartnerSummary, Contribution } from '../types';

// Regra Geral: Arredondamento DroneFlow (> 0.95 vira 1)
const dfRound = (val: number): number => {
  let v = Math.round(val * 100) / 100;
  const decimals = v - Math.floor(v);
  if (decimals > 0.95) return Math.ceil(v);
  return v;
};

// Regra Específica: Arredondamento Aritmético Padrão (2 casas)
const standardRound = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

interface PartnerBalanceProps {
  summaries: PartnerSummary[];
  contributions: Contribution[];
  onAddContribution: (item: Omit<Contribution, 'id'>) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
}

const PartnerBalance: React.FC<PartnerBalanceProps> = ({ summaries, contributions, onAddContribution, onDeleteContribution }) => {
  const [selectedPartnerForContribution, setSelectedPartnerForContribution] = useState<PartnerSummary | null>(null);
  const [selectedPartnerForHistory, setSelectedPartnerForHistory] = useState<PartnerSummary | null>(null);
  const [aporteAmount, setAporteAmount] = useState<string>('0');
  const [aporteDate, setAporteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aporteNotes, setAporteNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPartnerContributions = (partnerName: string) => {
    return contributions.filter(c => c.partnerName === partnerName);
  };

  const getTotalContributed = (partnerName: string) => {
    // Soma os aportes e arredonda o resultado final para evitar erros de ponto flutuante
    const total = getPartnerContributions(partnerName).reduce((acc, c) => acc + c.amount, 0);
    return standardRound(total);
  };

  const handleRegisterAporte = async () => {
    const numValue = parseFloat(aporteAmount.replace(',', '.'));
    if (!selectedPartnerForContribution || isNaN(numValue) || numValue <= 0) return;
    
    setIsSubmitting(true);
    try {
      // Aplica arredondamento aritmético padrão solicitado para este campo
      const roundedValue = standardRound(numValue);
      
      await onAddContribution({
        partnerName: selectedPartnerForContribution.shortName,
        amount: roundedValue,
        date: new Date(aporteDate).toISOString(),
        notes: aporteNotes
      });
      setSelectedPartnerForContribution(null);
      setAporteAmount('0');
      setAporteDate(new Date().toISOString().split('T')[0]);
      setAporteNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
            <CalendarDays className="w-4 h-4 text-emerald-100" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ciclo Operacional</span>
          </div>
          <h3 className="text-xl font-bold opacity-80 mb-2">Divisão de Resultados</h3>
          <p className="text-3xl font-black mb-6 uppercase tracking-tight">Regra: Cotas de 25% por Beneficiário</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Geraldo', 'Kaká', 'Patrick', 'Fundo de Reserva'].map(name => (
              <div key={name} className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">{name}</p>
                <p className="text-lg font-black tracking-widest">25,0%</p>
              </div>
            ))}
          </div>
        </div>
        <ShieldCheck className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaries.map((s, idx) => {
          const totalContributions = getTotalContributed(s.shortName);
          const currentLossOrGain = s.netProfit + (s.salary || 0);
          
          // CRUCIAL: Arredonda o saldo final para 2 casas para evitar -0.00
          const finalBalance = standardRound(currentLossOrGain + totalContributions);
          
          const isGeraldo = s.name.toLowerCase().includes('geraldo');
          const isReserva = s.name.toLowerCase().includes('reserva');

          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full transition-all hover:border-emerald-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isReserva ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{s.name}</h4>
                </div>
                {!isReserva && (
                  <button 
                    onClick={() => setSelectedPartnerForHistory(s)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Ver histórico de aportes"
                  >
                    <History className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4 flex-1">
                {!isGeraldo && !isReserva && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold flex items-center gap-2 uppercase tracking-widest">
                        <Ruler className="w-4 h-4 text-indigo-500" /> Produção
                      </span>
                      <span className="font-black text-indigo-600 uppercase">{s.hectares || 0} Ha</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest">
                    <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> Participação (25%)
                  </span>
                  <span className="font-black text-slate-700">R$ {s.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {s.salary && (
                  <div className="flex justify-between items-center text-sm bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-700">
                    <span className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Briefcase className="w-4 h-4" /> Salário Fixo</span>
                    <span className="font-black">R$ {s.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {s.deductions > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" /> Dedução Hectare
                    </span>
                    <span className="font-bold text-red-600">- R$ {s.deductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {totalContributions > 0 && (
                  <div className="flex justify-between items-center text-sm bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-700">
                    <span className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><DollarSign className="w-4 h-4" /> Aportes Concluídos</span>
                    <span className="font-black">+ R$ {totalContributions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 mt-auto flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Atual em Haver</p>
                    <p className={`text-2xl font-black ${finalBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      R$ {finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {!isReserva && finalBalance < 0 && (
                    <button 
                      onClick={() => {
                        setSelectedPartnerForContribution(s);
                        // Ao abrir, preenche com o saldo devedor arredondado aritmeticamente
                        setAporteAmount(Math.abs(finalBalance).toString());
                        setAporteDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmar Aporte
                    </button>
                  )}
                  {finalBalance >= 0 && !isReserva && (
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Registrar Aporte */}
      {selectedPartnerForContribution && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-7 h-7 text-emerald-400" />
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Registrar Aporte</h3>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sócio: {selectedPartnerForContribution.shortName}</p>
              <button onClick={() => setSelectedPartnerForContribution(null)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6 text-slate-800">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Aporte</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="date" 
                      value={aporteDate} 
                      onChange={e => setAporteDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Pagamento (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={aporteAmount} 
                      onChange={e => setAporteAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10" 
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 ml-1">* Arredondamento aritmético de 2 casas decimais aplicado ao salvar.</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações / Comprovante</label>
                <textarea 
                  value={aporteNotes}
                  onChange={e => setAporteNotes(e.target.value)}
                  placeholder="Ex: Transferência via PIX..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 min-h-[100px] resize-none focus:outline-none"
                />
              </div>
              <button 
                onClick={handleRegisterAporte}
                disabled={isSubmitting}
                className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all uppercase tracking-widest ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'}`}
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Aportes */}
      {selectedPartnerForHistory && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><FileText className="w-7 h-7" /></div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Relatório de Aportes</h3>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Sócio: {selectedPartnerForHistory.shortName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPartnerForHistory(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar text-slate-800">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acumulado Concluído</p>
                  <p className="text-3xl font-black text-indigo-600">R$ {getTotalContributed(selectedPartnerForHistory.shortName).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Aportes</p>
                   <p className="text-lg font-black text-slate-800">{getPartnerContributions(selectedPartnerForHistory.shortName).length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Detalhamento dos Lançamentos</h4>
                {getPartnerContributions(selectedPartnerForHistory.shortName).length > 0 ? (
                  getPartnerContributions(selectedPartnerForHistory.shortName).map(c => (
                    <div key={c.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><Clock className="w-5 h-5" /></div>
                        <div>
                          <p className="text-sm font-black text-slate-800">R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(c.date).toLocaleDateString('pt-BR')} • {c.notes || 'Aporte financeiro'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onDeleteContribution(c.id)}
                        className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-300">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-bold text-sm">Nenhum aporte registrado para este sócio.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedPartnerForHistory(null)} className="px-8 py-4 bg-white border border-slate-300 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Fechar Relatório</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerBalance;
