
import React, { useState } from 'react';
import { TrendingUp, Calendar, Landmark, MapPin, CheckCircle2, X, ArrowUpCircle, ArrowDownCircle, Info, ShieldCheck } from 'lucide-react';
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

  const cards = [
    { 
      id: 'hMonth',
      label: 'Hectares no Mês', 
      value: `${stats.hectaresMonth.toLocaleString()} ha`, 
      icon: TrendingUp, 
      color: 'bg-emerald-50 text-emerald-600',
      clickable: true
    },
    { 
      id: 'hYear',
      label: 'Hectares no Ano', 
      value: `${stats.hectaresYear.toLocaleString()} ha`, 
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
      label: 'Fundo de Reserva (Empresa)', 
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
            <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{s.clientName}</p>
                <p className="text-[10px] text-slate-500">{format(parseISO(s.date), 'dd/MM/yyyy')} - {s.areaName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">{s.hectares} ha</p>
                <p className="text-[10px] text-slate-400">R$ {s.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )) : <p className="text-center py-8 text-slate-400">Nenhum serviço pendente no ciclo.</p>}
        </div>
      );
    }

    if (activeDetail === 'sMonth') {
      const mServices = getMonthServices();
      const mExpenses = getMonthExpenses();
      const totalRev = mServices.reduce((acc, s) => acc + s.totalValue, 0);
      const totalVarExp = mExpenses.reduce((acc, e) => acc + e.amount, 0);
      const totalExp = totalVarExp + GERALDO_SALARY;
      title = `Ciclo Ativo - ${format(now, 'MMMM', { locale: ptBR })}`;
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <ArrowUpCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Receita Pendente</span>
              </div>
              <p className="text-lg font-black text-emerald-700">R$ {totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <ArrowDownCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Custos do Ciclo</span>
              </div>
              <p className="text-lg font-black text-red-700">R$ {totalExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Gastos Variáveis do Ciclo</span>
                <span className="font-bold text-slate-700">R$ {totalVarExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Salário Geraldo (Custo Fixo)
                </span>
                <span className="font-bold text-slate-700">R$ {GERALDO_SALARY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>

          <div className="p-5 bg-slate-900 rounded-2xl text-white text-center">
            <p className="text-xs opacity-60 font-bold uppercase mb-1">Saldo Atual do Ciclo</p>
            <p className={`text-3xl font-black ${(totalRev - totalExp) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              R$ {(totalRev - totalExp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }

    if (activeDetail === 'sYear') {
      const report = getYearlyReport();
      const totalYear = report.reduce((acc, m) => acc + m.balance, 0);
      title = "Acumulado Anual - Ano " + format(now, 'yyyy');
      content = (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase text-[10px]">Mês</th>
                  <th className="px-4 py-3 text-right font-bold uppercase text-[10px]">Receita</th>
                  <th className="px-4 py-3 text-right font-bold uppercase text-[10px]">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-700 capitalize">{m.month}</td>
                    <td className="px-4 py-3 text-right text-slate-500">R$ {m.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
                    <td className={`px-4 py-3 text-right font-black ${m.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      R$ {m.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="px-4 py-4 font-black">TOTAL ANUAL</td>
                  <td colSpan={2} className="px-4 py-4 text-right font-black text-lg">
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white sticky top-0 z-10">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderDetailModal()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => card.clickable && setActiveDetail(card.id as any)}
            className={`
              bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all relative
              ${card.clickable ? 'cursor-pointer hover:scale-[1.02] hover:border-emerald-300 active:scale-[0.98]' : ''} 
              ${idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''}
            `}
          >
            {card.clickable && (
              <div className="absolute top-2 right-2 p-1 text-slate-300">
                <Info className="w-3 h-3" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                <h3 className={`text-2xl font-bold ${card.isCurrency && (idx === 2 ? stats.balanceMonth < 0 : idx === 4 ? stats.bankBalance < 0 : false) ? 'text-red-600' : 'text-slate-800'}`}>
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
              <span>{idx === 4 ? 'Acumulado consolidado nos fechamentos' : card.clickable ? 'Ciclo mensal zerado após fechamento' : 'Atualizado em tempo real'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Informação Rápida</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Bem-vindo ao painel da <strong>DroneFlow</strong>. O card <strong>Fundo de Reserva</strong> representa o caixa acumulado da empresa (25% de todo o lucro líquido gerado). Os demais cards mostram o ciclo <strong>MENSAL ATIVO</strong> que é zerado após cada fechamento.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
