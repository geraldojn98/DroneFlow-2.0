
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Map, UserPlus, AlertCircle, Phone, Edit2, Shield, 
  ChevronRight, Search, X, MapPin, User as UserIcon,
  ArrowLeft, Settings2
} from 'lucide-react';
import { Client, Area } from '../types';

const dfRound = (val: number): number => {
  let v = Math.round(val * 100) / 100;
  const decimals = v - Math.floor(v);
  if (decimals > 0.95) return Math.ceil(v);
  return v;
};

interface ClientManagerProps {
  clients: Client[];
  setClients: (updater: any) => void;
  onDeleteClient: (id: string) => Promise<void>;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, setClients, onDeleteClient }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingArea, setEditingArea] = useState<{ clientId: string; area: Area } | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [showAddAreaForm, setShowAddAreaForm] = useState(false);

  const [newClient, setNewClient] = useState({ name: '', contact: '', isPartner: false });
  const [newArea, setNewArea] = useState({ name: '', hectares: 0 });

  const filteredClients = useMemo(() => {
    return clients
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId), 
  [clients, selectedClientId]);

  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    if (phoneNumber.length < 3) return phoneNumber;
    if (phoneNumber.length < 8) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.contact) return;
    const created: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClient.name,
      contact: newClient.contact,
      isPartner: newClient.isPartner,
      areas: []
    };
    setClients((prev: Client[]) => [...prev, created]);
    setNewClient({ name: '', contact: '', isPartner: false });
    setIsAddingClient(false);
    setSelectedClientId(created.id);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setClients((prev: Client[]) => prev.map(c => c.id === editingClient.id ? editingClient : c));
    setEditingClient(null);
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    await onDeleteClient(clientToDelete);
    setClientToDelete(null);
    setSelectedClientId(null);
  };

  const handleCreateArea = () => {
    if (!selectedClientId || !newArea.name || newArea.hectares <= 0) return;
    const created: Area = {
      id: Math.random().toString(36).substr(2, 9),
      name: newArea.name,
      hectares: dfRound(newArea.hectares)
    };
    setClients((prev: Client[]) => prev.map(c => 
      c.id === selectedClientId ? { ...c, areas: [...c.areas, created] } : c
    ));
    setNewArea({ name: '', hectares: 0 });
    setShowAddAreaForm(false);
  };

  const handleUpdateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    const updatedArea = { ...editingArea.area, hectares: dfRound(editingArea.area.hectares) };
    setClients((prev: Client[]) => prev.map(c => 
      c.id === editingArea.clientId ? { ...c, areas: c.areas.map(a => a.id === updatedArea.id ? updatedArea : a) } : c
    ));
    setEditingArea(null);
  };

  const handleDeleteArea = (areaId: string) => {
    if (!selectedClientId) return;
    setClients((prev: Client[]) => prev.map(c => 
      c.id === selectedClientId ? { ...c, areas: c.areas.filter(a => a.id !== areaId) } : c
    ));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Sidebar List - Hidden on mobile if viewing/adding client */}
      <div className={`w-full lg:w-80 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden shrink-0 ${(selectedClientId || isAddingClient) ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar produtor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredClients.map(client => (
            <button key={client.id} onClick={() => { setSelectedClientId(client.id); setIsAddingClient(false); }} className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all group ${selectedClientId === client.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="text-left overflow-hidden">
                <p className={`font-black text-sm truncate ${selectedClientId === client.id ? 'text-white' : 'text-slate-800'}`}>{client.name}</p>
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedClientId === client.id ? 'text-emerald-100' : 'text-slate-400'}`}>{client.areas.length} áreas</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 group-hover:translate-x-1 ${selectedClientId === client.id ? 'text-white' : 'text-slate-300'}`} />
            </button>
          ))}
          <button onClick={() => { setIsAddingClient(true); setSelectedClientId(null); }} className="w-full mt-4 p-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 text-xs font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative flex flex-col ${(!selectedClientId && !isAddingClient) ? 'hidden lg:flex' : 'flex'}`}>
        {selectedClient ? (
          <div className="h-full flex flex-col overflow-hidden animate-in slide-in-from-right-6">
            <div className="bg-slate-900 p-8 md:p-10 text-white relative">
              <button onClick={() => setSelectedClientId(null)} className="lg:hidden absolute top-8 left-8 p-2 bg-white/10 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-8 lg:mt-0">
                <div className="flex gap-6">
                  <div className="bg-emerald-500 p-5 rounded-[2rem] shadow-2xl shrink-0"><UserIcon className="w-10 h-10 text-white" /></div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tight uppercase italic">{selectedClient.name}</h2>
                    <div className="flex gap-6 text-slate-400 font-bold text-sm mt-2">
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> {selectedClient.contact}</div>
                      {selectedClient.isPartner && <span className="bg-emerald-500/20 text-emerald-400 px-2 rounded-lg text-xs border border-emerald-500/30">Sócio</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditingClient(selectedClient)} className="px-6 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Editar</button>
                  <button onClick={() => setClientToDelete(selectedClient.id)} className="p-4 bg-red-500 hover:bg-red-600 rounded-2xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <h3 className="text-2xl font-black text-slate-800 uppercase italic">Talhões</h3>
                <button onClick={() => setShowAddAreaForm(true)} className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus className="w-4 h-4" /> Novo Talhão</button>
              </div>
              {showAddAreaForm && (
                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                  <input type="text" placeholder="Nome da Área" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} className="w-full p-4 bg-white border border-emerald-200 rounded-2xl font-bold" />
                  <input type="number" step="0.01" placeholder="Hectares" value={newArea.hectares || ''} onChange={e => setNewArea({...newArea, hectares: parseFloat(e.target.value)})} className="w-full p-4 bg-white border border-emerald-200 rounded-2xl font-bold" />
                  <div className="flex gap-2"><button onClick={handleCreateArea} className="flex-1 bg-emerald-600 text-white font-black rounded-2xl">Salvar</button><button onClick={() => setShowAddAreaForm(false)} className="px-6 bg-white border border-slate-200 rounded-2xl font-bold">X</button></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {selectedClient.areas.map(area => (
                  <div key={area.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col group hover:border-emerald-400 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-white p-3 rounded-2xl border shadow-sm"><MapPin className="w-6 h-6 text-emerald-600" /></div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingArea({ clientId: selectedClient.id, area })} className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 border rounded-xl"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteArea(area.id)} className="p-2.5 bg-white text-slate-400 hover:text-red-600 border rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <h4 className="font-black text-slate-800 text-xl uppercase">{area.name}</h4>
                    <p className="text-emerald-600 font-black text-xs uppercase mt-1">{area.hectares} Hectares</p>
                  </div>
                ))}
                {selectedClient.areas.length === 0 && !showAddAreaForm && <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">Nenhuma área registrada.</div>}
              </div>
            </div>
          </div>
        ) : isAddingClient ? (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50/50">
            <div className="w-full max-w-lg bg-white p-12 rounded-[4rem] border border-slate-200 shadow-2xl animate-in zoom-in-95">
              <button onClick={() => setIsAddingClient(false)} className="lg:hidden absolute top-8 left-8 p-2 bg-slate-100 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><UserPlus className="w-10 h-10 text-emerald-600" /></div>
                <h2 className="text-3xl font-black text-slate-900 uppercase italic">Novo Produtor</h2>
              </div>
              <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome</label><input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telefone</label><input required type="text" maxLength={15} value={newClient.contact} onChange={e => setNewClient({...newClient, contact: formatPhone(e.target.value)})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold" /></div>
                <label className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-200 cursor-pointer"><p className="font-black text-slate-800">Sócio DroneFlow?</p><input type="checkbox" checked={newClient.isPartner} onChange={e => setNewClient({...newClient, isPartner: e.target.checked})} className="w-6 h-6 rounded accent-emerald-600" /></label>
                <div className="flex gap-3"><button type="button" onClick={() => setIsAddingClient(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-xs">Cancelar</button><button type="submit" className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-2xl">Salvar</button></div>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-slate-50/20">
            <div className="w-32 h-32 bg-slate-100 rounded-[3.5rem] flex items-center justify-center mb-8 shadow-inner"><UserIcon className="w-12 h-12 text-slate-300" /></div>
            <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-4">Gestão de Clientes</h2>
            <p className="text-slate-500 font-bold max-w-sm mb-10">Selecione um cliente ou cadastre um novo produtor para gerenciar talhões.</p>
            <button onClick={() => setIsAddingClient(true)} className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-emerald-700 transition-all">Novo Cliente</button>
          </div>
        )}
      </div>

      {editingArea && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-indigo-600 p-10 text-white relative">
              <h3 className="text-2xl font-black uppercase">Editar Área</h3>
              <button onClick={() => setEditingArea(null)} className="absolute top-10 right-10 p-3 hover:bg-white/10 rounded-full">X</button>
            </div>
            <form onSubmit={handleUpdateArea} className="p-10 space-y-6">
              <input required type="text" value={editingArea.area.name} onChange={e => setEditingArea({ ...editingArea, area: { ...editingArea.area, name: e.target.value } })} className="w-full px-6 py-5 bg-slate-50 border rounded-2xl font-bold" />
              <input required type="number" step="0.01" value={editingArea.area.hectares} onChange={e => setEditingArea({ ...editingArea, area: { ...editingArea.area, hectares: parseFloat(e.target.value) } })} className="w-full px-6 py-5 bg-slate-50 border rounded-2xl font-bold" />
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg">Atualizar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
