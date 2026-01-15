import React, { useState } from 'react';
import { 
  Plus, Trash2, Droplets, Beaker, Ruler, Zap, Sparkles, AlertTriangle, 
  FileText, Loader2, CheckCircle2, Package, Info, Calculator, XCircle, 
  AlertCircle, ArrowLeft, Download, FlaskConical, Microscope
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generateAIReportPDF } from '../lib/pdfService';

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
  mixingOrder: string;
  jarTestNeeded: boolean;
}

const AICalculator: React.FC = () => {
  const [view, setView] = useState<'form' | 'result'>('form');
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
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleNumericInput = (val: string, setter: (v: string) => void) => {
    const sanitized = val.replace(',', '.');
    setter(sanitized);
  };

  const runAnalysis = async () => {
    const h = parseFloat(hectares);
    const ts = parseFloat(tankSize);
    const fr = parseFloat(flowRate);

    if (!h || h <= 0 || !ts || ts <= 0 || !fr || fr <= 0 || products.some(p => !p.name || !p.dosage)) {
      setError("Preencha todos os campos operacionais (Área, Vazão, Tanque) e os dados dos produtos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Aja como um Engenheiro Agrônomo sênior de elite, especialista em Tecnologia de Aplicação e Química de Defensivos.
        
        CONTEXTO CRÍTICO: Aplicação via DRONE AGRÍCOLA (UBV - Ultra Baixo Volume). 
        A calda é extremamente concentrada (baixa diluição em água), o que aumenta riscos de floculação, decantação e antagonismo químico.

        DADOS DA OPERAÇÃO:
        - Área: ${h} ha
        - Volume de Calda (Vazão): ${fr} L/ha
        - Tanque Misturador: ${ts} Litros
        
        PRODUTOS NA RECEITA:
        ${products.map(p => `- Comercial: ${p.name} | Formulação: ${p.type === 'liquid' ? 'Líquido' : 'Pó/Sólido'} | Dose: ${p.dosage} p/ ha`).join('\n')}

        TAREFAS DE ANÁLISE:
        1. Pesquise e analise a compatibilidade QUÍMICA (reações entre os princípios ativos prováveis destes nomes comerciais) e FÍSICA (formação de cristais, borra ou separação).
        2. Defina o STATUS DE RISCO:
           - [SAFE]: Mistura testada e segura em UBV.
           - [CAUTION]: Risco moderado. Exige obrigatoriamente um Teste de Jarra prévio.
           - [INCOMPATIBLE]: Risco alto ou proibido (ex: Glifosato + 2.4D em alta concentração sem condicionadores específicos).
        3. Se [INCOMPATIBLE], justifique tecnicamente por que o usuário NÃO deve misturá-los.
        4. Determine a ORDEM DE MISTURA correta para esta combinação específica.
        5. Explique resumidamente o procedimento do Teste de Jarra se o status for [CAUTION].

        Siga rigorosamente este formato de saída:
        STATUS: [STATUS]
        RESUMO: [Frase curta de conclusão]
        ANALISE: [Explicação técnica detalhada sobre a interação entre os produtos]
        ORDEM: [Lista numerada da ordem de entrada no tanque]
        JARRA: [Instruções do teste ou 'Não aplicável']
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      const text = response.text || '';
      
      const statusMatch = text.match(/STATUS:\s*\[?(SAFE|CAUTION|INCOMPATIBLE)\]?/i);
      const summaryMatch = text.match(/RESUMO:\s*(.*)/i);
      const analysisMatch = text.match(/ANALISE:\s*([\s\S]*?)(?=ORDEM:)/i);
      const orderMatch = text.match(/ORDEM:\s*([\s\S]*?)(?=JARRA:)/i);
      const jarMatch = text.match(/JARRA:\s*([\s\S]*)/i);

      const status = (statusMatch?.[1].toUpperCase() || 'CAUTION') as CompatibilityStatus;
      
      setAnalysis({
        status,
        statusText: summaryMatch?.[1] || 'Processamento concluído.',
        content: analysisMatch?.[1].trim() || text,
        mixingOrder: orderMatch?.[1].trim() || 'Não informada.',
        jarTestNeeded: status === 'CAUTION' || (jarMatch?.[1] && !jarMatch[1].includes('Não aplicável'))
      });
      setView('result');
    } catch (err: any) {
      console.error(err);
      setError("Erro na consulta. Verifique sua chave de API ou conexão.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: CompatibilityStatus) => {
    switch (status) {
      case 'SAFE': return { color: 'bg-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-900', icon: CheckCircle2, label: 'CALDA SEGURA', border: 'border-emerald-200' };
      case 'CAUTION': return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-900', icon: AlertCircle, label: 'REQUER TESTE DE JARRA', border: 'border-amber-200' };
      case 'INCOMPATIBLE': return { color: 'bg-red-600', bg: 'bg-red-50', text: 'text-red-900', icon: XCircle, label: 'MISTURA PERIGOSA', border: 'border-red-200' };
      default: return { color: 'bg-slate-600', bg: 'bg-slate-50', text: 'text-slate-900', icon: Info, label: 'ANÁLISE', border: 'border-slate-200' };
    }
  };

  if (view === 'result' && analysis) {
    const config = getStatusConfig(analysis.status);
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
            <button onClick={() => setView('form')} className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar e Ajustar Receita
            </button>
            <button onClick={() => {
              generateAIReportPDF({
                label: `Análise de Calda - ${new Date().toLocaleDateString()}`,
                params: { hectares, flowRate, tankSize },
                products,
                analysis
              });
            }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">
                <Download className="w-4 h-4" /> Exportar PDF
            </button>
        </div>

        <div className={`${config.bg} ${config.border} border-2 rounded-[3rem] p-10 shadow-xl`}>
            <div className="flex items-center gap-8">
                <div className={`${config.color} p-6 rounded-[2rem] text-white shadow-lg`}>
                    <config.icon className="w-12 h-12" />
                </div>
                <div>
                    <h3 className={`text-4xl font-black ${config.text} italic uppercase tracking-tighter`}>{config.label}</h3>
                    <p className={`text-lg font-bold ${config.text} opacity-80 mt-1`}>{analysis.statusText}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <Microscope className="absolute -top-10 -right-10 w-48 h-48 text-slate-50 rotate-12" />
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                        <FileText className="w-4 h-4 text-emerald-500" /> Parecer Técnico do Especialista
                    </h4>
                    <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-sm relative z-10">
                        {analysis.content}
                    </div>
                </div>

                {analysis.jarTestNeeded && (
                    <div className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3rem] animate-in slide-in-from-top-4">
                        <h4 className="text-amber-900 font-black uppercase italic tracking-tight flex items-center gap-3 mb-4">
                            <FlaskConical className="w-6 h-6" /> Procedimento de Teste de Jarra
                        </h4>
                        <p className="text-amber-800 text-sm font-medium leading-relaxed">
                            Em aplicações UBV, o teste de jarra é vital. Em um recipiente transparente de 1 litro, 
                            misture água e os produtos na mesma proporção da calda real (respeitando a ordem de mistura). 
                            Aguarde 30 minutos: se houver formação de cristais, borra no fundo, separação de fases ou aquecimento, 
                            a calda NÃO deve ser levada ao drone.
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl border-b-8 border-emerald-500">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Sequência de Mistura
                    </h4>
                    <div className="text-sm font-bold leading-loose space-y-4 whitespace-pre-wrap text-slate-200">
                        {analysis.mixingOrder}
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/10 text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-normal">
                        * Mantenha agitação constante durante toda a adição de produtos.
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Receita Analisada</h4>
                    <div className="space-y-3">
                        {products.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-black text-slate-800 truncate">{p.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{p.dosage} /ha</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-b-4 border-emerald-500">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-500 p-4 rounded-[1.5rem] shadow-xl"><Sparkles className="w-10 h-10 text-white" /></div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tight italic">IA Agronômica</h2>
                <p className="text-emerald-400 font-bold uppercase text-xs tracking-[0.2em]">Consultoria Química de Calda UBV</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-2xl italic opacity-80">
            Drones operam com baixa vazão, o que torna as caldas instáveis. Utilize nossa IA para prever incompatibilidades e evitar prejuízos.
          </p>
        </div>
        <Calculator className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600 text-xs font-black uppercase animate-bounce">
            <AlertTriangle className="w-6 h-6" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Ruler className="w-4 h-4" /> Parâmetros UBV</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Área da Operação (Ha)</label>
              <input type="number" step="0.01" value={hectares} onChange={e => handleNumericInput(e.target.value, setHectares)} placeholder="Ex: 50" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Vazão do Drone (L/ha)</label>
              <input type="number" step="0.01" value={flowRate} onChange={e => handleNumericInput(e.target.value, setFlowRate)} placeholder="Ex: 10" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Capacidade Tanque (L)</label>
              <input type="number" step="0.01" value={tankSize} onChange={e => handleNumericInput(e.target.value, setTankSize)} placeholder="Ex: 500" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10" />
            </div>
            <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Volume Total Calda</p>
                <p className="text-xl font-black text-indigo-700">{(parseFloat(hectares) * parseFloat(flowRate) || 0).toLocaleString()} L</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Beaker className="w-4 h-4" /> Produtos na Calda</h3>
              <button onClick={addProduct} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all">
                <Plus className="w-4 h-4" /> Novo Item
              </button>
            </div>
            
            <div className="space-y-6">
              {products.map((p, idx) => (
                <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <input 
                            type="text" 
                            placeholder="Nome Comercial do Produto" 
                            value={p.name} 
                            onChange={e => updateProduct(p.id, 'name', e.target.value)} 
                            className="flex-1 px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10" 
                        />
                        {products.length > 1 && (
                            <button onClick={() => removeProduct(p.id)} className="p-4 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Dose p/ Hectare</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 2L ou 500g" 
                            value={p.dosage} 
                            onChange={e => updateProduct(p.id, 'dosage', e.target.value)} 
                            className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tipo Formulação</label>
                        <select 
                            value={p.type} 
                            onChange={e => updateProduct(p.id, 'type', e.target.value)} 
                            className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10"
                        >
                            <option value="liquid">Líquido (EC, SL, SC...)</option>
                            <option value="powder">Sólido/Pó (WP, WG, GR...)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
                onClick={runAnalysis} 
                disabled={loading} 
                className={`w-full mt-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'}`}
            >
              {loading ? (
                <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    Analisando Ingredientes...
                </>
              ) : (
                <>
                    <Sparkles className="w-8 h-8" />
                    Realizar Análise Técnica
                </>
              )}
            </button>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] flex gap-5">
            <div className="bg-white p-4 rounded-2xl h-fit shadow-sm"><Info className="w-6 h-6 text-amber-600" /></div>
            <div>
                <h5 className="text-xs font-black text-amber-900 uppercase mb-2 tracking-widest">Segurança Química</h5>
                <p className="text-xs text-amber-800 leading-relaxed font-bold opacity-80">
                    A alta concentração em caldas UBV (Drones) potencializa reações antagonistas. 
                    Sempre verifique o pH da água antes de iniciar a mistura para garantir a estabilidade dos ativos.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICalculator;