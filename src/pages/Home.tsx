import React, { useState, useEffect } from 'react';
import { BookOpen, User, GraduationCap, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IFA {
  id: number;
  turma: string;
  turno?: string;
  tipo_ifa: string;
  projeto_1: string;
  professor_1: string;
  projeto_2: string;
  professor_2: string;
  vagas_maximas: number;
  is_open: number;
  inscritos: number;
}

export default function Home() {
  const [nome, setNome] = useState('');
  const [turma, setTurma] = useState('');
  const [ifas, setIfas] = useState<IFA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchIfas = async (turmaToSearch: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/ifas?turma=${turmaToSearch}`);
      if (!response.ok) throw new Error('Erro ao buscar IFAs');
      const data = await response.json();
      setIfas(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !turma) {
      setError('Preencha todos os campos para continuar.');
      return;
    }
    fetchIfas(turma);
  };

  const handleEnroll = async (ifaId: number) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, turma, ifa_id: ifaId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar inscrição');
      }
      
      setSuccess(data.message);
      // Refresh IFAs to update vacancies
      fetchIfas(turma);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link 
        to="/admin" 
        className="absolute top-4 right-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Settings className="h-4 w-4 mr-2" />
        Acesso Restrito
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <GraduationCap className="mx-auto h-16 w-16 text-indigo-600" />
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900 tracking-tight">
            Escolha seu Itinerário Formativo
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Inscreva-se nos Projetos Integradores disponíveis para a sua série.
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md flex items-start">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {!searched ? (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-8 sm:p-10">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-slate-700">Nome Completo</label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="block w-full pl-10 py-3 border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border bg-slate-50"
                      placeholder="João da Silva"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
                  <div>
                    <label htmlFor="turma" className="block text-sm font-medium text-slate-700">Turma</label>
                    <input
                      type="text"
                      id="turma"
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      className="mt-2 block w-full py-3 px-4 border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border bg-slate-50"
                      placeholder="Ex: 1301"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">Apenas números (ex: 1301, 2305)</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Buscando...' : 'Ver IFAs Disponíveis'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <p className="text-sm text-slate-500">Estudante</p>
                <p className="font-medium text-slate-900">{nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Turma</p>
                <p className="font-medium text-slate-900">{turma} ({turma.replace(/\D/g, '').charAt(0)}ª Série)</p>
              </div>
              <button 
                onClick={() => setSearched(false)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Alterar dados
              </button>
            </div>

            {ifas.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhum IFA encontrado</h3>
                <p className="mt-1 text-sm text-slate-500">Não há Itinerários Formativos cadastrados para a sua série.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {ifas.map((ifa) => {
                  const vagasRestantes = ifa.vagas_maximas - ifa.inscritos;
                  const isEsgotado = vagasRestantes <= 0;
                  const isFechado = !ifa.is_open;
                  const disabled = isEsgotado || isFechado || loading;

                  return (
                    <div key={ifa.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                      <div className="bg-slate-900 px-6 py-4">
                        <div className="flex justify-between items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200">
                            IFA — Turma {ifa.turma} ({ifa.turno || 'Matutino'})
                          </span>
                          {ifa.tipo_ifa && (
                            <span className="text-xs text-slate-400">{ifa.tipo_ifa}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="space-y-6 flex-1">
                          <div>
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">Projeto 1</h4>
                            <p className="text-lg font-bold text-slate-900 leading-tight">{ifa.projeto_1}</p>
                            {ifa.professor_1 && (
                              <p className="text-sm text-slate-500 mt-1">Prof. {ifa.professor_1}</p>
                            )}
                          </div>
                          
                          <div className="h-px bg-slate-100 w-full"></div>
                          
                          <div>
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">Projeto 2</h4>
                            <p className="text-lg font-bold text-slate-900 leading-tight">{ifa.projeto_2}</p>
                            {ifa.professor_2 && (
                              <p className="text-sm text-slate-500 mt-1">Prof. {ifa.professor_2}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <p className="text-sm font-medium text-slate-500">Vagas restantes</p>
                              <p className={`text-2xl font-bold ${isEsgotado ? 'text-red-600' : 'text-emerald-600'}`}>
                                {vagasRestantes} <span className="text-sm font-normal text-slate-500">/ {ifa.vagas_maximas}</span>
                              </p>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isEsgotado ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (ifa.inscritos / ifa.vagas_maximas) * 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleEnroll(ifa.id)}
                            disabled={disabled}
                            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                              isFechado 
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                : isEsgotado
                                ? 'bg-red-50 text-red-600 cursor-not-allowed border border-red-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                            }`}
                          >
                            {isFechado ? 'Inscrições Encerradas' : isEsgotado ? 'Vagas Esgotadas' : 'Inscrever-se'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
