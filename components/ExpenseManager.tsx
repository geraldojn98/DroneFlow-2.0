
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Receipt, Search, ShieldCheck, Info, TrendingDown, 
  Calendar as CalendarIcon, X, FileText, DollarSign, Tag, Clock, 
  User as UserIcon, ChevronRight, LayoutList, Filter, CalendarDays, Lock, Unlock
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Expense, ClosedMonth } from '../types';
import { GERALDO_SALARY } from '../constants';

const dfRound = (val: number): number => {
  let v = Math.round(val * 100) / 100;
  const decimals = v - Math.floor(v);
  if (decimals > 0.95) return Math.ceil(v);
  return v;
};

interface ExpenseManagerProps {
  expenses: Expense[];
  setExpenses: (updater: any) => void;
  onDeleteExpense: (id: string) => void;
  closedMonths: ClosedMonth[];
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, setExpenses, onDeleteExpense, closedMonths }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState<string>('0,00');
  const [cat, setCat] = useState('Combustível');
  const [paidBy, setPaidBy] = useState<Expense['paidBy']>('Empresa');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Verifica se o mês selecionado está fechado
  const isMonthClosed = useMemo(() => {
    const parts = selectedMonth.split('-');
    const mYear = `${parseInt(parts[1])}/${parts[0]}`;
    return closedMonths.some(cm => cm.monthYear === mYear);
  }, [selectedMonth, closedMonths]);

  // Calcula despesas do mês atual (para o card de resumo no topo)
  const cycleExpenses = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);
    return expenses.filter(e => isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }));
  }, [expenses]);

  const totalCycleExpenses = useMemo(() => 
    cycleExpenses.reduce((acc, e) => acc + e.amount, 0), [cycleExpenses]);

  // Agrupa meses para o seletor de histórico
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => months.add(format(parseISO(e.date), 'yyyy-MM')));
    months.add(format(new Date(), 'yyyy-MM'));
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Filtra gastos para a listagem
  const historyExpenses = useMemo(() => {
    return expenses
      .filter(e => format(parseISO(e.date), 'yyyy-MM') === selectedMonth)
      .filter(e => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return e.description.toLowerCase().includes(term) || e.category.toLowerCase().includes(term);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, selectedMonth, searchTerm]);

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace('.', '').replace(',', '.'));
    if (!desc || numAmount <= 0) return;
    
    const newExp: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: desc,
      amount: dfRound(numAmount),
      category: cat,
      paidBy,
      date,
      closed: isMonthClosed // Define baseado no estado do mês
    };
    setExpenses((prev: any) => [newExp, ...prev]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDesc('');
    setAmount('0,00');
    setCat('Combustível');
    setPaidBy('Empresa');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const formatCurrencyInput = (val: string) => {
    const digits = val.replace(/\D/g, "");
    const num = (parseInt(digits) || 0) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const categories = ['Combustível', 'Manutenção Drone', 'Produtos', 'Logística', 'Marketing', 'Impostos', 'Diversos'];
  const pagadores = ['Empresa', 'Geraldo', 'Kaká', 'Patrick'];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden border-b-4 border-emerald-500">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-3 bg-white/5 w-fit px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Compromisso Fixo</span>
              </div>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Geraldo Júnior</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Responsável Operacional</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/10 text-right">
              <p className="text-[10px] font-black text-white/50 uppercase mb-1 tracking-widest">Remuneração Base</p>
              <p className="text-4xl font-black text-emerald-400">R$ {GERALDO_SALARY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <Info className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-4">
                <TrendingDown className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-widest">Variáveis do Ciclo</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Gastos registrados em {format(new Date(), 'MMMM', {locale: ptBR})}</p>
          </div>
          <div className="mt-6">
            <p className="text-4xl font-black text-red-600">R$ {totalCycleExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">{cycleExpenses.length} Lançamentos ativos</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Seletora de Mês */}
        <div className="w-full lg:w-64 flex flex-col gap-4">
            <button 
                onClick={() => {
                    if (isMonthClosed) {
                        alert("Este mês já está fechado. Para adicionar novos gastos, reabra o mês no histórico.");
                        return;
                    }
                    setIsModalOpen(true);
                }}
                className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isMonthClosed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'}`}
            >
                {isMonthClosed ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                Adicionar Gasto
            </button>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico Mensal</span>
                </div>
                <div className="p-2 space-y-1">
                    {availableMonths.map(month => (
                        <button 
                            key={month} 
                            onClick={() => setSelectedMonth(month)}
                            className={`w-full px-4 py-3 rounded-2xl text-left text-sm font-black uppercase transition-all ${selectedMonth === month ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ptBR })}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Listagem de Gastos */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-emerald-500" /> Detalhamento de Saídas
                    </h4>
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${isMonthClosed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {isMonthClosed ? <><Lock className="w-3 h-3" /> Mês Fechado</> : <><Unlock className="w-3 h-3" /> Mês Aberto</>}
                    </span>
                </div>
                <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Filtrar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Data</th>
                            <th className="px-8 py-4">Status do Item</th>
                            <th className="px-8 py-4 text-right">Valor Bruto</th>
                            <th className="px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {historyExpenses.map(exp => (
                            <tr key={exp.id} onClick={() => setSelectedExpense(exp)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                                <td className="px-8 py-5 font-black text-slate-500 text-sm">
                                    {format(parseISO(exp.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isMonthClosed ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                        {isMonthClosed ? 'Consolidado' : 'Pendente'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right font-black text-red-600 text-sm">
                                    - R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </td>
                            </tr>
                        ))}
                        {historyExpenses.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Nenhum gasto registrado para este período.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-red-600 p-8 text-white relative">
                    <h3 className="text-3xl font-black uppercase italic tracking-tight">Novo Gasto</h3>
                    <p className="text-red-200 text-[10px] font-black uppercase tracking-[0.3em] mt-2">DroneFlow Financeiro</p>
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full"><X className="w-8 h-8" /></button>
                </div>
                <form onSubmit={addExpense} className="p-8 space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Custo</label>
                        <input required type="text" placeholder="Ex: Combustível para Gerador" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                            <select value={cat} onChange={e => setCat(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 outline-none">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Lançamento (R$)</label>
                        <input type="text" required value={amount} onChange={e => setAmount(formatCurrencyInput(e.target.value))} className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-black text-2xl text-red-600 outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quem realizou o pagamento?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {pagadores.map(p => (
                                <button 
                                    key={p} 
                                    type="button" 
                                    onClick={() => setPaidBy(p as any)}
                                    className={`py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${paidBy === p ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium px-1 italic leading-relaxed">
                            * Pagamentos por sócios serão reembolsados no fechamento mensal pela empresa.
                        </p>
                    </div>

                    <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition-all mt-4">Gravar Despesa</button>
                </form>
            </div>
        </div>
      )}

      {/* Detalhes do Gasto */}
      {selectedExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-6 h-6 text-emerald-400" />
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Detalhes do Gasto</h3>
                    </div>
                    <button onClick={() => setSelectedExpense(null)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between mb-4">
                             <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${isMonthClosed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {isMonthClosed ? <><Lock className="w-3 h-3" /> Mês Fechado</> : <><Unlock className="w-3 h-3" /> Mês Aberto</>}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-4 rounded-2xl"><Tag className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição e Categoria</p>
                                <p className="font-black text-slate-800 uppercase">{selectedExpense.description}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">{selectedExpense.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-4 rounded-2xl"><DollarSign className="w-5 h-5 text-red-500" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor do Gasto</p>
                                <p className="font-black text-red-600 text-xl">R$ {selectedExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-4 rounded-2xl"><UserIcon className="w-5 h-5 text-indigo-500" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pago por</p>
                                <p className="font-black text-slate-800 uppercase">{selectedExpense.paidBy}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-4 rounded-2xl"><Clock className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data do Lançamento</p>
                                <p className="font-black text-slate-800">{format(parseISO(selectedExpense.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setSelectedExpense(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Fechar Detalhes</button>
                        {!isMonthClosed && (
                            <button 
                                onClick={() => { onDeleteExpense(selectedExpense.id); setSelectedExpense(null); }} 
                                className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black transition-all hover:bg-red-100"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
