
import React, { useState } from 'react';
// Fix: Added Droplets to the imported icons from lucide-react
import { TrendingUp, Calendar, Landmark, MapPin, CheckCircle2, X, ArrowUpCircle, ArrowDownCircle, Info, ShieldCheck, Droplets } from 'lucide-react';
import { format, endOfMonth, isWithinInterval, endOfYear, eachMonthOfInterval } from 'date-fns';
import { startOfMonth } from 'date-fns/startOfMonth';
import { parseISO } from 'date-fns/parseISO';
import { startOfYear } from 'date-fns/startOfYear';
import { ptBR } from 'date-fns/locale/pt-BR';
import { DashboardStats, ServiceRecord, Expense } from '../types';
import { GERALDO_SALARY } from '../constants';

interface DashboardProps {
  stats: DashboardStats;
  services: ServiceRecord[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, services, expenses }) => {
  const [activeDetail, setActiveDetail] = useState<'hMonth' | 'hYear' | 'sMonth' | 'sYear' | null>(null);

  const formatHectares = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cards = [
    { 
      id: 'hMonth',
      label: 'Hectares no Mês', 
      value: `${formatHectares(stats.hectaresMonth)} ha`, 
      icon: TrendingUp, 
      color: 'bg-emerald-50 text-emerald-600',
      clickable: true
    },
    { 
      id: 'hYear',
      label: 'Hectares no Ano', 
      value: `${formatHectares(stats.hectaresYear)} ha`, 
      icon: MapPin, 
      color: 'bg-blue-50 text-blue-600',
      clickable: true
    },
    { 
      id: 'sMonth',
      label: 'Saldo do Mês', 
      value: `R$ ${stats.balanceMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: Calendar, 
      color: 'bg-amber-50 text-amber-600',
      isCurrency: true,
      clickable: true
    },
    { 
      id: 'sYear',
      label: 'Saldo do Ano', 
      value: `R$ ${stats.balanceYear.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: CheckCircle2, 
      color: 'bg-purple-50 text-purple-600',
      isCurrency: true,
      clickable: true
    },
    { 
      id: 'bank',
      label: 'Fundo de Reserva', 
      value: `R$ ${stats.bankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: Landmark, 
      color: 'bg-slate-100 text-slate-800',
      isCurrency: true,
      clickable: false
    },
  ];

  const now = new Date();
  
  const getMonthServices = () => services.filter(s => !s.closed && isWithinInterval(parseISO(s.date), { 
    start: startOfMonth(now), 
    end: endOfMonth(now) 
  })).sort((a, b) => b.date.localeCompare(a.date));

  const getYearServices = () => services.filter(s => isWithinInterval(parseISO(s.date), { 
    start: startOfYear(now), 
    end: endOfYear(now) 
  })).sort((a, b) => b.date.localeCompare(a.date));

  const getMonthExpenses = () => expenses.filter(e => !e.closed && isWithinInterval(parseISO(e.date), { 
    start: startOfMonth(now), 
    end: endOfMonth(now) 
  }));

  const getYearlyReport = () => {
    const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) });
    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const mServices = services.filter(s => isWithinInterval(parseISO(s.date), { start, end }));
      const mExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
      const revenue = mServices.reduce((acc, s) => acc + s.totalValue, 0);
      const costs = mExpenses.reduce((acc, e) => acc + e.amount, 0) + GERALDO_SALARY;
      return {
        month: format(m, 'MMMM', { locale: ptBR }),
        revenue,
        costs,
        balance: revenue - costs
      };
    });
  };

  const renderDetailModal = () => {
    if (!activeDetail) return null;

    let title = "";
    let content = null;

    if (activeDetail === 'hMonth' || activeDetail === 'hYear') {
      const data = activeDetail === 'hMonth' ? getMonthServices() : getYearServices();
      title = activeDetail === 'hMonth' ? "Ciclo Mensal Ativo" : "Produção Anual";
      content = (
        <div className="space-y-3">
          {data.length > 0 ? data.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="max-w-[60%]">
                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{s.clientName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(s.date), 'dd/MM/yyyy')} • {s.areaName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-600">{formatHectares(s.hectares)} ha</p>
                <p className="text-[10px] font-bold text-slate-400">R$ {s.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )) : <p className="text-center py-12 text-slate-300 font-black uppercase text-xs tracking-widest">Nenhum serviço pendente.</p>}
        </div>
      );
    }

    if (activeDetail === 'sMonth') {
      const mServices = getMonthServices();
      const mExpenses = getMonthExpenses();
      const totalRev = mServices.reduce((acc, s) => acc + s.totalValue, 0);
      const totalVarExp = mExpenses.reduce((acc, e) => acc + e.amount, 0);
      const totalExp = totalVarExp + GERALDO_SALARY;
      title = `Fluxo ${format(now, 'MMM', { locale: ptBR })}`;
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <ArrowUpCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Receita Pendente</span>
              </div>
              <p className="text-xl font-black text-emerald-700">R$ {totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-5 bg-red-50 rounded-3xl border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <ArrowDownCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Custos Atuais</span>
              </div>
              <p className="text-xl font-black text-red-700">R$ {totalExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-black uppercase tracking-widest">Variáveis</span>
                <span className="font-black text-slate-700">R$ {totalVarExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Salário Fixo
                </span>
                <span className="font-black text-slate-700">R$ {GERALDO_SALARY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white text-center shadow-xl">
            <p className="text-[10px] opacity-50 font-black uppercase mb-2 tracking-[0.2em]">Saldo Projetado</p>
            <p className={`text-4xl font-black ${(totalRev - totalExp) < 0 ? 'text-red-400' : 'text-emerald-400'} italic`}>
              R$ {(totalRev - totalExp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }

    if (activeDetail === 'sYear') {
      const report = getYearlyReport();
      const totalYear = report.reduce((acc, m) => acc + m.balance, 0);
      title = "Histórico " + format(now, 'yyyy');
      content = (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-5 py-4 text-left font-black uppercase tracking-widest">Mês</th>
                  <th className="px-5 py-4 text-right font-black uppercase tracking-widest">Receita</th>
                  <th className="px-5 py-4 text-right font-black uppercase tracking-widest">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-black text-slate-700 uppercase italic">{m.month}</td>
                    <td className="px-5 py-4 text-right text-slate-500 font-bold">R$ {m.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
                    <td className={`px-5 py-4 text-right font-black ${m.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      R$ {m.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="px-5 py-5 font-black uppercase tracking-widest">Total</td>
                  <td colSpan={2} className="px-5 py-5 text-right font-black text-xl italic text-emerald-400">
                    R$ {totalYear.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
          <div className="bg-slate-900 px-8 py-6 flex items-center justify-between text-white sticky top-0 z-10">
            <h3 className="text-xl font-black uppercase italic tracking-tight">{title}</h3>
            <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-7 h-7" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderDetailModal()}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => card.clickable && setActiveDetail(card.id as any)}
            className={`
              bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all relative
              ${card.clickable ? 'cursor-pointer hover:scale-[1.02] hover:border-emerald-300 active:scale-[0.98]' : ''} 
              ${idx === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}
            `}
          >
            {card.clickable && (
              <div className="absolute top-4 right-4 p-1 text-slate-300">
                <Info className="w-4 h-4 opacity-30" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">{card.label}</p>
                <h3 className={`text-2xl font-black tracking-tight ${card.isCurrency && (idx === 2 ? stats.balanceMonth < 0 : idx === 4 ? stats.bankBalance < 0 : false) ? 'text-red-600' : 'text-slate-800'}`}>
                  {card.value}
                </h3>
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${card.color}`}>
                <card.icon className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
              <span>{idx === 4 ? 'Acumulado consolidado' : card.clickable ? 'Ciclo mensal temporário' : 'Tempo real'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
            <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Transparência Operacional
            </h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-2xl">
              O DroneFlow utiliza um sistema de compensação automática. O <strong>Fundo de Reserva</strong> é alimentado por 25% de cada operação concluída, garantindo a saúde financeira da empresa a longo prazo.
            </p>
        </div>
        <Droplets className="absolute -bottom-10 -right-10 w-48 h-48 text-slate-50 rotate-12 group-hover:text-emerald-50 transition-colors" />
      </div>
    </div>
  );
};

export default Dashboard;
