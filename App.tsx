
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Users, DollarSign, Plus, 
  TrendingUp, Droplets, History, Menu, X, LogOut, AlertCircle, 
  ClipboardList, User as UserIcon, Sparkles
} from 'lucide-react';
import { format, endOfMonth, isWithinInterval, endOfYear, differenceInMonths } from 'date-fns';
import { startOfMonth } from 'date-fns/startOfMonth';
import { parseISO } from 'date-fns/parseISO';
import { startOfYear } from 'date-fns/startOfYear';
import { ptBR } from 'date-fns/locale/pt-BR';

import { supabase } from './lib/supabase';
import { 
  Client, ServiceRecord, Expense, PartnerSummary, DashboardStats, 
  ClosedMonth, User, AgendaItem, Contribution
} from './types';
import { INITIAL_CLIENTS, PARTNER_SERVICE_RATE, PARTNERS, GERALDO_SALARY } from './constants';

import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ClientManager from './components/ClientManager';
import ExpenseManager from './components/ExpenseManager';
import ServiceForm from './components/ServiceForm';
import PartnerBalance from './components/PartnerBalance';
import HistoryView from './components/HistoryView';
import MonthClosingModal from './components/MonthClosingModal';
import AuthScreen from './components/AuthScreen';
import AgendaView from './components/AgendaView';
import AICalculator from './components/AICalculator';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('df_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'calendar' | 'clients' | 'expenses' | 'partners' | 'history' | 'ai'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [prefilledServiceData, setPrefilledServiceData] = useState<Partial<ServiceRecord> | null>(null);
  const [sourceAgendaId, setSourceAgendaId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [closedMonths, setClosedMonths] = useState<ClosedMonth[]>([]);
  const [selectedClosingInfo, setSelectedClosingInfo] = useState<{ month: number; year: number; isClosed: boolean } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const { data: s } = await supabase.from('services').select('*');
          const { data: e } = await supabase.from('expenses').select('*');
          const { data: a } = await supabase.from('agenda').select('*');
          const { data: c } = await supabase.from('clients').select('*');
          const { data: cm } = await supabase.from('closed_months').select('*');
          const { data: con } = await supabase.from('contributions').select('*');

          if (s) setServices(s);
          if (e) setExpenses(e);
          if (a) setAgenda(a);
          if (c && c.length > 0) setClients(c);
          if (cm) setClosedMonths(cm);
          if (con) setContributions(con);
        } catch (err) {
          console.error("Erro ao carregar dados", err);
        }
      };
      fetchData();
    }
  }, [user]);

  const handleSetClients = async (updater: any) => {
    const nextValue = typeof updater === 'function' ? updater(clients) : updater;
    setClients(nextValue);
    await supabase.from('clients').upsert(nextValue);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir cliente: " + err.message);
    }
  };

  const handleSetExpenses = async (updater: any) => {
    const nextValue = typeof updater === 'function' ? updater(expenses) : updater;
    setExpenses(nextValue);
    await supabase.from('expenses').upsert(nextValue);
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddContribution = async (item: Omit<Contribution, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    try {
      const { error } = await supabase.from('contributions').insert([newItem]);
      if (error) throw error;
      setContributions(prev => [newItem, ...prev]);
    } catch (err: any) {
      alert("Erro ao salvar aporte: " + err.message);
    }
  };

  const handleDeleteContribution = async (id: string) => {
    try {
      const { error } = await supabase.from('contributions').delete().eq('id', id);
      if (error) throw error;
      setContributions(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erro ao remover aporte: " + err.message);
    }
  };

  const handleAddAgendaItem = async (item: AgendaItem): Promise<boolean> => {
    try {
      const { error } = await supabase.from('agenda').insert([item]);
      if (error) throw error;
      setAgenda(prev => [item, ...prev]);
      return true;
    } catch (err: any) {
      alert("Erro ao salvar agendamento: " + err.message);
      return false;
    }
  };

  const handleDeleteAgendaItem = async (id: string) => {
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      setAgenda(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Erro ao remover item da agenda: " + err.message);
    }
  };

  const getCalculationForMonth = (m: number, y: number) => {
    const mStart = startOfMonth(new Date(y, m - 1));
    const mEnd = endOfMonth(new Date(y, m - 1));
    const monthServices = services.filter(s => isWithinInterval(parseISO(s.date), { start: mStart, end: mEnd }));
    const monthExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }));
    
    const totalRev = monthServices.reduce((acc, s) => acc + s.totalValue, 0);
    const totalExp = monthExpenses.reduce((acc, e) => acc + e.amount, 0) + GERALDO_SALARY;
    const hectaresTotal = monthServices.reduce((acc, s) => acc + s.hectares, 0);

    const summaries = PARTNERS.map(p => {
      let deductions = 0;
      let hectaresPartner = 0;
      const netProfitBase = Math.round(((totalRev - totalExp) / 4) * 100) / 100;
      
      const reimbursements = monthExpenses
        .filter(e => e.paidBy === p.name)
        .reduce((acc, e) => acc + e.amount, 0);

      if (p.name === 'Kaká' || p.name === 'Patrick') {
        const partnerClient = clients.find(c => c.partnerName === p.name);
        if (partnerClient) {
          const pServices = monthServices.filter(s => s.clientId === partnerClient.id);
          hectaresPartner = pServices.reduce((acc, s) => acc + s.hectares, 0);
          deductions = Math.round(hectaresPartner * PARTNER_SERVICE_RATE * 100) / 100;
        }
      }
      
      return {
        name: p.fullName,
        shortName: p.name as any,
        grossProfit: netProfitBase,
        deductions: deductions,
        reimbursements: reimbursements,
        netProfit: Math.round((netProfitBase + reimbursements - deductions) * 100) / 100,
        salary: p.name === 'Geraldo' ? GERALDO_SALARY : undefined,
        hectares: hectaresPartner
      };
    });

    return { 
      totalRev, totalExp, hectares: hectaresTotal, monthServices, monthExpenses, summaries, 
      label: format(mStart, 'MMMM yyyy', { locale: ptBR }),
      monthYear: `${m}/${y}`
    };
  };

  const currentMonthData = useMemo(() => {
    const now = new Date();
    return getCalculationForMonth(now.getMonth() + 1, now.getFullYear());
  }, [services, expenses, clients]);

  const stats = useMemo((): DashboardStats => {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearServices = services.filter(s => isWithinInterval(parseISO(s.date), { start: yearStart, end: endOfYear(now) }));
    const yearExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: yearStart, end: endOfYear(now) }));
    const monthsPassed = differenceInMonths(now, yearStart) + 1;
    
    return {
      hectaresMonth: currentMonthData.hectares,
      hectaresYear: yearServices.reduce((acc, s) => acc + s.hectares, 0),
      balanceMonth: currentMonthData.totalRev - currentMonthData.totalExp,
      balanceYear: yearServices.reduce((acc, s) => acc + s.totalValue, 0) - (yearExpenses.reduce((acc, e) => acc + e.amount, 0) + (GERALDO_SALARY * monthsPassed)),
      bankBalance: closedMonths.reduce((acc, m) => acc + (m.partnerSummaries.find(p => p.name.includes('Reserva'))?.netProfit || 0), 0)
    };
  }, [services, expenses, currentMonthData, closedMonths]);

  const handleServiceSubmit = async (data: Omit<ServiceRecord, 'id'>) => {
    const newService = { ...data, id: Math.random().toString(36).substr(2, 9) };
    try {
      const { error } = await supabase.from('services').insert([newService]);
      if (error) throw error;
      setServices(prev => [...prev, newService]);
      if (sourceAgendaId) {
        await supabase.from('agenda').delete().eq('id', sourceAgendaId);
        setAgenda(prev => prev.filter(item => item.id !== sourceAgendaId));
      }
      setIsServiceFormOpen(false);
    } catch (err: any) {
      alert("Erro ao processar serviço: " + err.message);
    }
  };

  const handleConfirmClosing = async () => {
    if (!selectedClosingInfo) return;
    try {
      const calc = getCalculationForMonth(selectedClosingInfo.month, selectedClosingInfo.year);
      const newClosedMonth: ClosedMonth = {
        id: Math.random().toString(36).substr(2, 9),
        monthYear: calc.monthYear,
        label: calc.label,
        totalRevenue: calc.totalRev,
        totalExpenses: calc.totalExp,
        netProfit: calc.totalRev - calc.totalExp,
        hectares: calc.hectares,
        services: calc.monthServices,
        expenses: calc.monthExpenses,
        partnerSummaries: calc.summaries,
        closedAt: new Date().toISOString()
      };
      
      const { error } = await supabase.from('closed_months').insert([newClosedMonth]);
      if (error) throw error;
      
      // Marcar despesas originais como fechadas para segurança
      const ids = calc.monthExpenses.map(e => e.id);
      if (ids.length > 0) {
        await supabase.from('expenses').update({ closed: true }).in('id', ids);
      }

      setClosedMonths(prev => [...prev, newClosedMonth]);
      setIsClosingModalOpen(false);
      alert("Mês fechado com sucesso!");
    } catch (err: any) {
      alert(`Erro ao fechar mês: ${err.message}`);
    }
  };

  const handleReopenMonth = async (monthYear: string) => {
    try {
      const { error } = await supabase.from('closed_months').delete().eq('monthYear', monthYear);
      if (error) throw error;
      
      // Desmarcar despesas como abertas
      const parts = monthYear.split('/');
      const mStart = startOfMonth(new Date(parseInt(parts[1]), parseInt(parts[0]) - 1));
      const mEnd = endOfMonth(new Date(parseInt(parts[1]), parseInt(parts[0]) - 1));
      
      await supabase.from('expenses')
        .update({ closed: false })
        .gte('date', mStart.toISOString())
        .lte('date', mEnd.toISOString());

      setClosedMonths(prev => prev.filter(m => m.monthYear !== monthYear));
      setIsClosingModalOpen(false);
    } catch (err: any) {
      alert("Erro ao reabrir mês: " + err.message);
    }
  };

  // Fix: Added handleLogout function to clear user session and local storage.
  const handleLogout = () => {
    localStorage.removeItem('df_user');
    setUser(null);
    setIsLogoutConfirmOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda de Campo', icon: ClipboardList },
    { id: 'calendar', label: 'Calendário de Serviços', icon: CalendarIcon },
    { id: 'clients', label: 'Clientes & Áreas', icon: Users },
    { id: 'expenses', label: 'Custos/Gastos', icon: DollarSign },
    { id: 'partners', label: 'Sócios & Lucros', icon: TrendingUp },
    { id: 'ai', label: 'IA Agronômica', icon: Sparkles },
    { id: 'history', label: 'Histórico Mensal', icon: History },
  ];

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="bg-emerald-500 p-6 rounded-[2.5rem] shadow-2xl mb-6 animate-pulse"><Droplets className="w-16 h-16 text-white" /></div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">DroneFlow</h1>
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={(u) => { localStorage.setItem('df_user', JSON.stringify(u)); setUser(u); }} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}/>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-500 p-2 rounded-lg"><Droplets className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-black tracking-tight uppercase text-white">DroneFlow</h1>
          </div>
          
          <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar text-slate-400">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'hover:text-white hover:bg-slate-800'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6 border-t border-slate-800">
            <button 
              onClick={() => { setPrefilledServiceData(null); setSourceAgendaId(null); setIsServiceFormOpen(true); }} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-emerald-600/20 transition-all active:scale-95 text-sm uppercase tracking-widest"
            >
              <Plus className="w-5 h-5" /> Lançar Serviço
            </button>

            <div className="p-4 bg-slate-800 rounded-2xl flex items-center gap-3">
              <UserIcon className="w-6 h-6 text-emerald-500" />
              <div className="overflow-hidden"><p className="text-sm font-black truncate text-white">{user.name}</p></div>
            </div>
            <button onClick={() => setIsLogoutConfirmOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 font-bold text-sm">
              <LogOut className="w-5 h-5" /> Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{navItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && <Dashboard stats={stats} services={services} expenses={expenses} />}
          {activeTab === 'agenda' && <AgendaView agenda={agenda} onAddAgenda={handleAddAgendaItem} onDeleteAgenda={handleDeleteAgendaItem} clients={clients} user={user} onEfetivar={(item) => { setSourceAgendaId(item.id); setPrefilledServiceData(item); setIsServiceFormOpen(true); }} />}
          {activeTab === 'calendar' && <CalendarView services={services} closedMonths={closedMonths} onOpenClosing={(info) => { setSelectedClosingInfo(info); setIsClosingModalOpen(true); }} onDeleteService={async (id) => { const { error } = await supabase.from('services').delete().eq('id', id); if (!error) setServices(services.filter(s => s.id !== id)); }} />}
          {activeTab === 'clients' && <ClientManager clients={clients} setClients={handleSetClients} onDeleteClient={handleDeleteClient} />}
          {activeTab === 'expenses' && <ExpenseManager expenses={expenses} setExpenses={handleSetExpenses} onDeleteExpense={handleDeleteExpense} closedMonths={closedMonths} />}
          {activeTab === 'partners' && <PartnerBalance summaries={currentMonthData.summaries} contributions={contributions} onAddContribution={handleAddContribution} onDeleteContribution={handleDeleteContribution} />}
          {activeTab === 'ai' && <AICalculator />}
          {activeTab === 'history' && <HistoryView closedMonths={closedMonths} onReopenMonth={handleReopenMonth} />}
        </div>
      </main>

      {isServiceFormOpen && (
        <ServiceForm 
          onClose={() => { setIsServiceFormOpen(false); setPrefilledServiceData(null); }} 
          onSubmit={handleServiceSubmit} 
          clients={clients} 
          initialData={prefilledServiceData || undefined}
        />
      )}

      {isClosingModalOpen && selectedClosingInfo && (
        <MonthClosingModal 
          onClose={() => setIsClosingModalOpen(false)}
          onConfirm={handleConfirmClosing}
          onReopen={handleReopenMonth}
          isAlreadyClosed={selectedClosingInfo.isClosed}
          closedMonthData={closedMonths.find(m => m.monthYear === `${selectedClosingInfo.month}/${selectedClosingInfo.year}`)}
          data={getCalculationForMonth(selectedClosingInfo.month, selectedClosingInfo.year)}
        />
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-sm:w-[90%] max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-4">Sair agora?</h3>
              <button onClick={handleLogout} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black mb-2">Sim, Sair</button>
              <button onClick={() => setIsLogoutConfirmOpen(false)} className="w-full py-2 text-slate-500 font-bold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
