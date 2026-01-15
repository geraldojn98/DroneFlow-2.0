
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

  const isMonthClosed = useMemo(() => {
    const parts = selectedMonth.split('-');
    const mYear = `${parseInt(parts[1])}/${parts[0]}`;
    return closedMonths.some(cm => cm.monthYear === mYear);
  }, [selectedMonth, closedMonths]);

  const cycleExpenses = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);
    return expenses.filter(e => isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }));
  }, [expenses]);

  const totalCycleExpenses = useMemo(() => 
    cycleExpenses.reduce((acc, e) => acc + e.amount, 0), [cycleExpenses]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => months.add(format(parseISO(e.date), 'yyyy-MM')));
    months.add(format(new Date(), 'yyyy-MM'));
    return Array.from(months).sort().reverse();
  }, [expenses]);

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
      closed: isMonthClosed
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
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden border-b-4 border-emerald-500">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-3 bg-white/5 w-fit px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Compromisso Fixo</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">Geraldo Júnior</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Responsável Operacional</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-5 rounded-3xl border border-white/10 text-right">
              <p className="text-[9px] font-black text-white/50 uppercase mb-1 tracking-widest">Pró-labore</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">R$ {GERALDO_SALARY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <Info className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-4">
                <TrendingDown className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ciclo Atual</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Gastos em {format(new Date(), 'MMM', {locale: ptBR})}</p>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-red-600">R$ {totalCycleExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 flex flex-col gap-4">
            <button 
                onClick={() => isMonthClosed ? alert("Mês fechado.") : setIsModalOpen(true)}
                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isMonthClosed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'}`}
            >
                {isMonthClosed ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                Lançar Gasto
            </button>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico</span>
                </div>
                <div className="p-2 space-y-1 flex lg:flex-col overflow-x-auto lg:overflow-x-visible custom-scrollbar">
                    {availableMonths.map(month => (
                        <button 
                            key={month} 
                            onClick={() => setSelectedMonth(month)}
                            className={`whitespace-nowrap lg:w-full px-5 py-3 rounded-2xl text-left text-[11px] font-black uppercase transition-all ${selectedMonth === month ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {format(parseISO(`${month}-01`), 'MMM yy', { locale: ptBR })}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <LayoutList className="w-4 h-4 text-emerald-500" />
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${isMonthClosed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {isMonthClosed ? 'Fechado' : 'Aberto'}
                    </span>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none" />
                </div>
            </div>

            <div className="divide-y divide-slate-50">
                {historyExpenses.map(exp => (
                    <div 
                        key={exp.id} 
                        onClick={() => setSelectedExpense(exp)} 
                        className="group flex items-center justify-between p-5 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                {format(parseISO(exp.date), 'dd/MM/yy')} • {exp.category}
                            </p>
                            <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{exp.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-black text-red-600 text-sm sm:text-base break-words max-w-[120px]">
                                - R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200 ml-4 group-hover:text-emerald-400 transition-colors" />
                    </div>
                ))}
                {historyExpenses.length === 0 && (
                    <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado.</div>
                )}
            </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="bg-red-600 p-6 sm:p-8 text-white relative shrink-0">
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Novo Gasto</h3>
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X className="w-7 h-7" /></button>
                </div>
                <form onSubmit={addExpense} className="p-6 sm:p-8 space-y-5 overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                        <input required type="text" placeholder="Ex: Manutenção Drone" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                        <input type="text" required value={amount} onChange={e => setAmount(formatCurrencyInput(e.target.value))} className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-black text-2xl text-red-600 outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quem pagou?</label>
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
                    </div>

                    <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition-all">Salvar Gasto</button>
                </form>
            </div>
        </div>
      )}

      {selectedExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-900 p-8 text-white relative">
                    <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                      <Receipt className="w-6 h-6 text-emerald-400" /> Gasto
                    </h3>
                    <button onClick={() => setSelectedExpense(null)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-7 h-7" /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl"><Tag className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</p>
                                <p className="font-black text-slate-800 uppercase text-sm">{selectedExpense.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-4 rounded-2xl"><DollarSign className="w-5 h-5 text-red-500" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                                <p className="font-black text-red-600 text-xl break-words">R$ {selectedExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-50 p-4 rounded-2xl"><UserIcon className="w-5 h-5 text-indigo-500" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagador</p>
                                <p className="font-black text-slate-800 uppercase text-sm">{selectedExpense.paidBy}</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setSelectedExpense(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Fechar</button>
                        {!isMonthClosed && (
                            <button 
                                onClick={() => { onDeleteExpense(selectedExpense.id); setSelectedExpense(null); }} 
                                className="p-4 bg-red-50 text-red-600 rounded-2xl font-black transition-all hover:bg-red-100"
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
