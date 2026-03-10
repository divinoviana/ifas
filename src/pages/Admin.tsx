import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Users, Settings, Download, RefreshCw, CheckCircle2, AlertCircle, XCircle, LogOut, Lock } from 'lucide-react';

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

interface Enrollment {
  nome: string;
  student_turma: string;
  ifa_turma: string;
  projeto_1: string;
  projeto_2: string;
  data_inscricao: string;
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'ifas' | 'enrollments'>('ifas');
  const [ifas, setIfas] = useState<IFA[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setError('');
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setIfas([]);
    setEnrollments([]);
  };

  const fetchIfas = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ifas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return handleLogout();
      const data = await res.json();
      setIfas(data);
    } catch (err: any) {
      setError('Erro ao carregar IFAs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return handleLogout();
      const data = await res.json();
      setEnrollments(data);
    } catch (err: any) {
      setError('Erro ao carregar inscrições');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'ifas') fetchIfas();
      else fetchEnrollments();
    }
  }, [activeTab, token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      
      const res = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      if (res.status === 401) return handleLogout();
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao processar PDF');
      
      setSuccess(data.message);
      fetchIfas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleIfaStatus = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/ifas/${id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return handleLogout();
      if (res.ok) {
        fetchIfas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (enrollments.length === 0) return;
    
    const headers = ['Nome', 'Turma Estudante', 'Turma IFA', 'Projeto 1', 'Projeto 2', 'Data Inscrição'];
    const csvContent = [
      headers.join(','),
      ...enrollments.map(e => 
        `"${e.nome}","${e.student_turma}","${e.ifa_turma}","${e.projeto_1}","${e.projeto_2}","${new Date(e.data_inscricao).toLocaleString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inscricoes_ifa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div>
            <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
              Acesso Administrativo
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="E-mail"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Senha"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Settings className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-slate-900">Admin IFA</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('ifas')}
                  className={`${
                    activeTab === 'ifas'
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerenciar IFAs
                </button>
                <button
                  onClick={() => setActiveTab('enrollments')}
                  className={`${
                    activeTab === 'enrollments'
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Inscritos
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
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

        {activeTab === 'ifas' && (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg p-6 border border-slate-200">
              <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Importar IFAs via PDF</h3>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                    ) : (
                      <Upload className="w-10 h-10 text-slate-400 mb-3" />
                    )}
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold">Clique para fazer upload</span> ou arraste o arquivo
                    </p>
                    <p className="text-xs text-slate-500">PDF com a grade de IFAs</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    id="dropzone-file" 
                    type="file" 
                    accept=".pdf"
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-slate-900">IFAs Cadastrados</h3>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  Total: {ifas.length}
                </span>
              </div>
              <div className="border-t border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Turma</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Projetos</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vagas</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {ifas.map((ifa) => (
                      <tr key={ifa.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {ifa.turma}
                          <div className="text-xs text-slate-500 font-normal mt-1">{ifa.tipo_ifa} • {ifa.turno || 'Matutino'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <div className="mb-2">
                            <span className="font-medium text-slate-900">P1:</span> {ifa.projeto_1} <br/>
                            <span className="text-xs">Prof. {ifa.professor_1}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">P2:</span> {ifa.projeto_2} <br/>
                            <span className="text-xs">Prof. {ifa.professor_2}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(ifa.inscritos / ifa.vagas_maximas) * 100}%` }}></div>
                            </div>
                            <span>{ifa.inscritos}/{ifa.vagas_maximas}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ifa.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {ifa.is_open ? 'Aberto' : 'Fechado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleIfaStatus(ifa.id)}
                            className={`text-${ifa.is_open ? 'red' : 'emerald'}-600 hover:text-${ifa.is_open ? 'red' : 'emerald'}-900`}
                          >
                            {ifa.is_open ? 'Fechar' : 'Abrir'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {ifas.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                          Nenhum IFA cadastrado. Faça o upload de um PDF para começar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border-b border-slate-200 gap-4">
              <h3 className="text-lg leading-6 font-medium text-slate-900">Lista de Inscritos</h3>
              <div className="flex items-center space-x-4">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setEnrollments(enrollments.filter(en => en.student_turma === val || en.ifa_turma === val));
                      // Note: A better approach is to filter from the original list, but for simplicity we can just re-fetch and filter.
                      fetch('/api/admin/enrollments').then(res => res.json()).then(data => {
                        setEnrollments(val === 'all' ? data : data.filter((en: Enrollment) => en.student_turma === val || en.ifa_turma === val));
                      });
                    }
                  }}
                >
                  <option value="all">Todas as Turmas</option>
                  {Array.from(new Set(enrollments.map(e => e.student_turma))).map(t => (
                    <option key={t} value={t}>Turma {t}</option>
                  ))}
                </select>
                <button
                  onClick={exportCSV}
                  disabled={enrollments.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estudante</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Turma</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IFA Escolhido</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {enrollments.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{e.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {e.student_turma}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="font-medium text-slate-900">IFA Turma {e.ifa_turma}</div>
                        <div className="text-xs truncate max-w-xs" title={e.projeto_1}>{e.projeto_1}</div>
                        <div className="text-xs truncate max-w-xs" title={e.projeto_2}>{e.projeto_2}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(e.data_inscricao).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                  {enrollments.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                        Nenhuma inscrição registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
