
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Receipt, Search, ShieldCheck, Info, TrendingDown, Calendar as CalendarIcon, X, FileText, DollarSign, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Expense } from '../types';
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
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, setExpenses, onDeleteExpense }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [cat, setCat] = useState('Combustível');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const activeExpenses = useMemo(() => expenses.filter(e => !e.closed), [expenses]);
  const totalActiveExpenses = useMemo(() => activeExpenses.reduce((acc, e) => acc + e.amount, 0), [activeExpenses]);

  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return expenses;
    const term = searchTerm.toLowerCase();
    return expenses.filter(e => e.description.toLowerCase().includes(term) || e.category.toLowerCase().includes(term));
  }, [expenses, searchTerm]);

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || amount <= 0) return;
    const newExp: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: desc,
      amount: dfRound(amount),
      category: cat,
      date,
      closed: false
    };
    setExpenses((prev: any) => [newExp, ...prev]);
    setDesc('');
    setAmount(0);
  };

  const categories = ['Combustível', 'Manutenção Drone', 'Produtos', 'Logística', 'Marketing', 'Impostos', 'Diversos'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Compromisso Mensal Fixo</span>
              </div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Salário Geraldo Júnior</h3>
              <p className="text-white/70 text-sm mt-1">Responsável Técnico e Financeiro DroneFlow</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 text-right">
              <p className="text-xs font-bold text-white/60 uppercase mb-1">Valor Mensal</p>
              <p className="text-3xl font-black text-emerald-400">R$ {GERALDO_SALARY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-white/80 font-bold bg-white/5 p-2 rounded-lg inline-flex uppercase tracking-widest">
            <Info className="w-3 h-3 text-emerald-400" /> DEDUZIDO AUTOMATICAMENTE NO FECHAMENTO DO MÊS.
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div><div className="flex items-center gap-2 text-red-600 mb-2"><TrendingDown className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-widest">Variáveis do Ciclo</span></div><p className="text-sm text-slate-500">Gastos em aberto no ciclo mensal atual.</p></div>
          <div className="mt-4"><p className="text-3xl font-black text-red-600">R$ {totalActiveExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{activeExpenses.length} Lançamentos pendentes</p></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-500" /> Novo Gasto Variável</h3>
        <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição</label><input type="text" required placeholder="Ex: Óleo motor" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500" /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label><select value={cat} onChange={e => setCat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor (R$)</label><input type="number" step="0.01" required value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500" /></div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data</label>
              <div className="relative">
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg font-black h-[38px] flex items-center gap-2 hover:bg-red-700 transition-all shadow-md active:scale-95 uppercase text-xs tracking-widest"><Plus className="w-4 h-4 text-white" /> Lançar</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4"><h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Histórico de Gastos</h4>
        <div className="relative flex-1 max-w-xs"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Buscar gasto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-full text-xs outline-none w-full text-slate-800 font-bold" /></div></div>
        <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr className="text-slate-400 font-black uppercase text-[10px] tracking-widest"><th className="px-6 py-3">Data</th><th className="px-6 py-3">Descrição</th><th className="px-6 py-3">Categoria</th><th className="px-6 py-3 text-right">Valor</th><th className="px-6 py-3"></th></tr></thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 cursor-pointer">
            {filteredExpenses.map(exp => (
              <tr key={exp.id} onClick={() => setSelectedExpense(exp)} className={`hover:bg-slate-50 transition-colors ${exp.closed ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 font-bold text-slate-500">{format(parseISO(exp.date), 'dd/MM/yy')}{exp.closed && <span className="ml-2 text-[8px] bg-slate-200 px-1 rounded uppercase">Fechado</span>}</td>
                <td className="px-6 py-4 font-black text-slate-800">{exp.description}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{exp.category}</span></td>
                <td className="px-6 py-4 text-right font-black text-red-600">- R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  {!exp.closed && <button onClick={() => onDeleteExpense(exp.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-sm:w-[90%] max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-black uppercase tracking-tight">Detalhes do Gasto</h3>
              </div>
              <button onClick={() => setSelectedExpense(null)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6 text-white" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl"><Tag className="w-5 h-5 text-slate-400" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</p><p className="font-black text-slate-800">{selectedExpense.description}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl"><DollarSign className="w-5 h-5 text-red-500" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Lançamento</p><p className="font-black text-red-600 text-lg">R$ {selectedExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl"><Clock className="w-5 h-5 text-slate-400" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Gasto</p><p className="font-black text-slate-800">{format(parseISO(selectedExpense.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedExpense(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Voltar</button>
                {!selectedExpense.closed && (
                  <button 
                    onClick={() => { onDeleteExpense(selectedExpense.id); setSelectedExpense(null); }} 
                    className="flex-1 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
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
