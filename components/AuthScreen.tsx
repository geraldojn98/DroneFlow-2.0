
import React, { useState } from 'react';
import { Droplets, Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    if (phoneNumber.length < 3) return phoneNumber;
    if (phoneNumber.length < 8) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data, error: loginErr } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .eq('password', password)
          .single();

        if (loginErr || !data) {
          throw new Error("E-mail ou senha incorretos.");
        }

        onLogin(data as User);
      } else {
        const { error: regErr } = await supabase
          .from('users')
          .insert([
            { 
              name, 
              email: email.toLowerCase(), 
              phone, 
              password,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` 
            }
          ]);

        if (regErr) {
          if (regErr.code === '23505') throw new Error("Este e-mail já está cadastrado.");
          throw regErr;
        }

        setSuccess("Conta criada com sucesso! Faça login agora.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg mb-4"><Droplets className="w-10 h-10 text-white" /></div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">DroneFlow</h1>
          <p className="text-slate-400 font-bold tracking-wide">Gestão Agrícola de Precisão</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-sm font-black ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Entrar</button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-sm font-black ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Criar Conta</button>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-xs"><AlertCircle className="w-5 h-5" /> {error}</div>}
            {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 font-bold text-xs"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nome Completo</label>
                  <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">E-mail</label>
                <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Celular</label>
                  <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input type="tel" required value={phone} onChange={e => setPhone(formatPhone(e.target.value))} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-colors">{loading ? "Carregando..." : (isLogin ? "Acessar Painel" : "Concluir Cadastro")}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
