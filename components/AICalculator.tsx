
import React, { useState } from 'react';
import { 
  Plus, Trash2, Droplets, Beaker, Ruler, Zap, Sparkles, AlertTriangle, 
  FileText, Loader2, CheckCircle2, Package, Info, Calculator, XCircle, AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ProductInput {
  id: string;
  name: string;
  dosage: string; 
  type: 'liquid' | 'powder';
}

type CompatibilityStatus = 'SAFE' | 'CAUTION' | 'INCOMPATIBLE';

interface AnalysisResult {
  status: CompatibilityStatus;
  statusText: string;
  content: string;
}

const dfRound = (val: number): number => {
  let v = Math.round(val * 100) / 100;
  const decimals = v - Math.floor(v);
  if (decimals > 0.95) return Math.ceil(v);
  return v;
};

const AICalculator: React.FC = () => {
  const [hectares, setHectares] = useState<string>('');
  const [tankSize, setTankSize] = useState<string>('500'); 
  const [flowRate, setFlowRate] = useState<string>('10');
  const [products, setProducts] = useState<ProductInput[]>([
    { id: '1', name: '', dosage: '', type: 'liquid' }
  ]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addProduct = () => {
    setProducts([...products, { id: Math.random().toString(36).substr(2, 9), name: '', dosage: '', type: 'liquid' }]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof ProductInput, value: any) => {
    let finalValue = value;
    if (field === 'dosage') {
      const num = parseFloat(value.replace(',', '.'));
      if (!isNaN(num)) {
        finalValue = dfRound(num).toString();
      }
    }
    setProducts(products.map(p => p.id === id ? { ...p, [field]: finalValue } : p));
  };

  const handleNumericInput = (val: string, setter: (v: string) => void) => {
    const sanitized = val.replace(',', '.');
    const num = parseFloat(sanitized);
    if (sanitized === '') {
      setter('');
    } else if (!isNaN(num)) {
      setter(dfRound(num).toString());
    }
  };

  const runAnalysis = async () => {
    const h = parseFloat(hectares);
    const ts = parseFloat(tankSize);
    const fr = parseFloat(flowRate);

    if (!h || h <= 0 || !ts || ts <= 0 || products.some(p => !p.name || !p.dosage)) {
      setError("Preencha todos os campos corretamente.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Aja como um Engenheiro Agrônomo especialista em tecnologia de aplicação UBV (Ultra Baixo Volume) com Drones.
        Analise a COMPATIBILIDADE QUÍMICA desta mistura de ALTA CONCENTRAÇÃO para um MISTURADOR de apoio.
        DADOS OPERACIONAIS:
        - Área Total: ${h} ha
        - Capacidade do Misturador: ${ts} Litros
        - Vazão de Aplicação: ${fr} L/ha
        RECEITA DOS PRODUTOS:
        ${products.map(p => `- ${p.name}: ${p.dosage} ${p.type === 'liquid' ? 'ml/ha' : 'g/ha'}`).join('\n')}
        INSTRUÇÕES:
        1. Identifique o STATUS: [SAFE|CAUTION|INCOMPATIBLE].
        2. FOCO EM DRONES: Calda muito concentrada.
        FORMATO DA RESPOSTA:
        STATUS: [STATUS]
        RESUMO_STATUS: [Breve frase]
        ---
        # RELATÓRIO DE BATIDA (${ts}L)
        ...conteúdo...
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const text = response.text || '';
      const statusMatch = text.match(/STATUS:\s*\[?(SAFE|CAUTION|INCOMPATIBLE)\]?/i);
      const summaryMatch = text.match(/RESUMO_STATUS:\s*(.*)/i);
      const status = (statusMatch?.[1].toUpperCase() || 'CAUTION') as CompatibilityStatus;
      const statusText = summaryMatch?.[1] || 'Análise agronômica concluída.';
      const content = text.split('---')[1] || text;
      setAnalysis({ status, statusText, content });
    } catch (err: any) {
      setError("Falha na análise da IA.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: CompatibilityStatus) => {
    switch (status) {
      case 'SAFE': return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-900', icon: CheckCircle2, label: 'COMPATÍVEL' };
      case 'CAUTION': return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-900', icon: AlertCircle, label: 'ATENÇÃO' };
      case 'INCOMPATIBLE': return { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-900', icon: XCircle, label: 'INCOMPATÍVEL' };
      default: return { color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-900', icon: Info, label: 'ANÁLISE' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden border-b-4 border-emerald-500">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg"><Sparkles className="w-8 h-8 text-white" /></div>
            <div><h2 className="text-3xl font-black uppercase tracking-tight italic">IA Agronômica</h2><p className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Calda Concentrada para Drone</p></div>
          </div>
          <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-2xl italic opacity-80">Cálculos inteligentes para baixa vazão e alta saturação de calda.</p>
        </div>
        <Calculator className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Ruler className="w-4 h-4" /> Parâmetros</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Área (Ha)</label>
              <input type="number" step="0.01" value={hectares} onChange={e => handleNumericInput(e.target.value, setHectares)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Misturador (L)</label>
              <input type="number" step="0.01" value={tankSize} onChange={e => handleNumericInput(e.target.value, setTankSize)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vazão (L/ha)</label>
              <input type="number" step="0.01" value={flowRate} onChange={e => handleNumericInput(e.target.value, setFlowRate)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Beaker className="w-4 h-4" /> Composição</h3>
              <button onClick={addProduct} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
            <div className="space-y-4">
              {products.map((p, idx) => (
                <div key={p.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col gap-4">
                    <input type="text" placeholder="Nome do Produto" value={p.name} onChange={e => updateProduct(p.id, 'name', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                    <div className="flex items-center gap-3">
                      <input type="number" step="0.01" placeholder="Dose" value={p.dosage} onChange={e => updateProduct(p.id, 'dosage', e.target.value)} className="flex-1 px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                      <span className="text-xs font-black text-slate-400 uppercase">{p.type === 'liquid' ? 'ml/ha' : 'g/ha'}</span>
                      {products.length > 1 && <button onClick={() => removeProduct(p.id)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={runAnalysis} disabled={loading} className={`w-full mt-8 py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
              {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Analisando...</> : <><Sparkles className="w-6 h-6" /> Calcular Plano de Mistura</>}
            </button>
          </div>

          {analysis && (
            <div className="space-y-4 animate-in zoom-in-95 duration-500">
              <div className={`${getStatusConfig(analysis.status).bg} border-2 ${analysis.status === 'SAFE' ? 'border-emerald-200' : analysis.status === 'CAUTION' ? 'border-amber-200' : 'border-red-200'} rounded-[2rem] p-6 shadow-lg`}>
                <div className="flex items-start gap-4">
                  <div className={`${getStatusConfig(analysis.status).color} p-4 rounded-2xl text-white shadow-lg`}>{React.createElement(getStatusConfig(analysis.status).icon, { className: "w-8 h-8 text-white" })}</div>
                  <div className="flex-1">
                    <h4 className={`text-xl font-black ${getStatusConfig(analysis.status).text} uppercase tracking-tight`}>{getStatusConfig(analysis.status).label}</h4>
                    <p className={`text-sm font-bold ${getStatusConfig(analysis.status).text} opacity-90 mt-1`}>{analysis.statusText}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl text-slate-800">
                <div className="prose prose-slate max-w-none font-medium leading-relaxed text-sm whitespace-pre-wrap">{analysis.content}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICalculator;
