
import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { Client, ApplicationType, ServiceRecord } from '../types';
import { PARTNER_SERVICE_RATE } from '../constants';

const dfRound = (val: number): number => {
  let v = Math.round(val * 100) / 100;
  const decimals = v - Math.floor(v);
  if (decimals > 0.95) return Math.ceil(v);
  return v;
};

interface ServiceFormProps {
  onClose: () => void;
  onSubmit: (data: Omit<ServiceRecord, 'id'>) => void;
  clients: Client[];
  initialData?: Partial<ServiceRecord>;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onClose, onSubmit, clients, initialData }) => {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || '');
  const [selectedAreaId, setSelectedAreaId] = useState(initialData?.areaId || '');
  const [hectares, setHectares] = useState(initialData?.hectares || 0);
  const [type, setType] = useState<ApplicationType>(initialData?.type || ApplicationType.PULVERIZACAO);
  const [unitPrice, setUnitPrice] = useState<number>(initialData?.unitPrice || 0);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedArea = selectedClient?.areas.find(a => a.id === selectedAreaId);

  useEffect(() => {
    if (selectedArea && !initialData?.hectares) setHectares(selectedArea.hectares);
  }, [selectedArea, initialData]);

  useEffect(() => {
    if (selectedClient?.isPartner && !initialData?.unitPrice) setUnitPrice(PARTNER_SERVICE_RATE);
  }, [selectedClientId, selectedClient, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedArea) return;
    
    const finalHectares = dfRound(hectares);
    const finalPrice = dfRound(unitPrice);
    
    onSubmit({
      date,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      areaId: selectedArea.id,
      areaName: selectedArea.name,
      hectares: finalHectares,
      type,
      unitPrice: finalPrice,
      totalValue: dfRound(finalHectares * finalPrice)
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between text-white">
          <h3 className="text-xl font-black uppercase tracking-tight">{initialData ? 'Execução Operacional' : 'Novo Lançamento'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
               <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidade</label>
               <select value={type} onChange={e => setType(e.target.value as ApplicationType)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500">
                 <option value={ApplicationType.PULVERIZACAO}>Pulverização</option>
                 <option value={ApplicationType.DISPERSAO}>Dispersão</option>
               </select>
            </div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Fazenda</label>
             <select required value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setSelectedAreaId(''); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500">
               <option value="">Selecione o Cliente</option>
               {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.isPartner ? '(Sócio)' : ''}</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Talhão de Aplicação</label>
             <select required disabled={!selectedClientId} value={selectedAreaId} onChange={e => setSelectedAreaId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">
               <option value="">Selecione a Área</option>
               {selectedClient?.areas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.hectares} ha)</option>)}
             </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hectares (Ha)</label>
               <input type="number" step="0.01" required value={hectares || ''} onChange={e => setHectares(parseFloat(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço (R$/ha)</label>
               <input type="number" step="0.01" required value={unitPrice || ''} onChange={e => setUnitPrice(parseFloat(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700 outline-none" />
            </div>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <Calculator className="w-4 h-4" /> Total Estimado
            </div>
            <span className="text-xl font-black text-slate-900">R$ {(dfRound(hectares * unitPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 border border-slate-300 rounded-2xl font-black text-slate-600 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest active:scale-95">Gravar Serviço</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
