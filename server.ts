import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
// @ts-expect-error pdf-parse types are weird
import * as pdfParseModule from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yikojuwgfdrfpezcnufu.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_-3vxCmHWNtm7zDqaPm0m8Q_TjkGaeFo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer setup for PDF upload
const upload = multer({ dest: 'uploads/' });

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Routes

// Admin: Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json({ success: true, token: data.session.access_token });
  } catch (error: any) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
  }
});

// Helper to get authenticated supabase client
const getAuthClient = (req: express.Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return supabase;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

// Get IFAs for a specific turma's series
app.get('/api/ifas', async (req, res) => {
  const { turma } = req.query;
  try {
    const { data: ifas, error } = await supabase.from('ifas').select('*, inscricoes(count)');
    if (error) throw error;

    let filteredIfas = ifas;

    if (turma && typeof turma === 'string') {
      const cleanTurma = turma.replace(/\D/g, '');
      if (cleanTurma.length > 0) {
        const serie = cleanTurma.charAt(0);
        console.log('Filtering for serie:', serie);
        filteredIfas = ifas.filter(ifa => {
          const ifaTurmaStr = String(ifa.turma).replace(/\D/g, '');
          const match = ifaTurmaStr.startsWith(serie);
          console.log(`IFA Turma: ${ifa.turma}, Clean: ${ifaTurmaStr}, Match: ${match}`);
          return match;
        });
      }
    }

    // Map to match expected format
    const formattedIfas = filteredIfas.map(ifa => ({
      ...ifa,
      inscritos: ifa.inscricoes?.[0]?.count || 0
    }));

    res.json(formattedIfas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll a student
app.post('/api/enroll', async (req, res) => {
  const { nome, turma, ifa_id } = req.body;
  
  if (!nome || !turma || !ifa_id) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Check if IFA exists and is open
    const { data: ifa, error: ifaError } = await supabase.from('ifas').select('*').eq('id', ifa_id).single();
    if (ifaError || !ifa) throw new Error('IFA não encontrado.');
    if (!ifa.is_open) throw new Error('Inscrições encerradas para este IFA.');

    // Check vacancies
    const { count, error: countError } = await supabase.from('inscricoes').select('*', { count: 'exact', head: true }).eq('ifa_id', ifa_id);
    if (countError) throw countError;
    if ((count || 0) >= ifa.vagas_maximas) {
      throw new Error('Vagas esgotadas para este IFA.');
    }

    // Check if student already enrolled
    const { data: existingStudent, error: existingStudentError } = await supabase.from('students').select('id').eq('nome', nome).eq('turma', turma).maybeSingle();
    if (existingStudentError) throw existingStudentError;

    let studentId;
    
    if (existingStudent) {
      const { data: alreadyEnrolled, error: alreadyEnrolledError } = await supabase.from('inscricoes').select('id').eq('student_id', existingStudent.id).maybeSingle();
      if (alreadyEnrolledError) throw alreadyEnrolledError;

      if (alreadyEnrolled) {
        throw new Error('Estudante já está inscrito em um IFA.');
      }
      studentId = existingStudent.id;
    } else {
      const matricula = `N/A-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const { data: newStudent, error: studentError } = await supabase.from('students').insert({ nome, turma, matricula }).select('id').single();
      if (studentError) throw studentError;
      studentId = newStudent.id;
    }

    // Register enrollment
    const { error: enrollError } = await supabase.from('inscricoes').insert({ student_id: studentId, ifa_id: ifa_id });
    if (enrollError) {
      if (enrollError.code === '23505') { // Postgres unique violation
        throw new Error('Estudante já está inscrito em um IFA.');
      }
      throw new Error(enrollError.message);
    }
    
    res.json({ success: true, message: 'Inscrição realizada com sucesso!' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Get all IFAs with stats
app.get('/api/admin/ifas', async (req, res) => {
  try {
    const client = getAuthClient(req);
    const { data: ifas, error } = await client.from('ifas').select('*, inscricoes(count)').order('turma', { ascending: true });
    if (error) throw error;

    const formattedIfas = ifas.map(ifa => ({
      ...ifa,
      inscritos: ifa.inscricoes?.[0]?.count || 0
    }));

    res.json(formattedIfas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all enrollments
app.get('/api/admin/enrollments', async (req, res) => {
  try {
    const client = getAuthClient(req);
    const { data: enrollments, error } = await client
      .from('inscricoes')
      .select(`
        id,
        data_inscricao,
        students (nome, matricula, turma),
        ifas (turma, projeto_1, projeto_2)
      `)
      .order('data_inscricao', { ascending: false });
      
    if (error) throw error;

    // Flatten the response to match previous SQLite structure
    const formattedEnrollments = enrollments.map((en: any) => ({
      nome: en.students.nome,
      student_turma: en.students.turma,
      ifa_turma: en.ifas.turma,
      projeto_1: en.ifas.projeto_1,
      projeto_2: en.ifas.projeto_2,
      data_inscricao: en.data_inscricao
    }));

    res.json(formattedEnrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Toggle IFA status
app.post('/api/admin/ifas/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const client = getAuthClient(req);
    const { data: ifa, error: fetchError } = await client.from('ifas').select('is_open').eq('id', id).single();
    if (fetchError || !ifa) return res.status(404).json({ error: 'IFA não encontrado.' });
    
    const newStatus = !ifa.is_open;
    const { error: updateError } = await client.from('ifas').update({ is_open: newStatus }).eq('id', id);
    if (updateError) throw updateError;

    res.json({ success: true, is_open: newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Upload PDF and parse with Gemini
app.post('/api/admin/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Use Gemini to parse the text into structured JSON
    const prompt = `
      Analise o texto extraído de um PDF contendo a grade de Itinerários Formativos (IFAs) para o ensino médio.
      O texto contém tabelas com as colunas: Turma, Projeto 1 (com nome do projeto e professor) e Projeto 2 (com nome do projeto e professor).
      
      Extraia os dados e retorne um array JSON com a seguinte estrutura para cada turma encontrada:
      {
        "turma": "string (ex: 1301, 13.01, 2305)",
        "projeto_1": "string (nome do projeto 1)",
        "professor_1": "string (nome do professor 1)",
        "projeto_2": "string (nome do projeto 2)",
        "professor_2": "string (nome do professor 2)"
      }
      
      Regras:
      - Limpe os nomes das turmas para conter apenas números (ex: "13.06" vira "1306").
      - Separe o nome do projeto do nome do professor. Geralmente estão separados por hífen ou nova linha.
      - Se não houver professor, deixe vazio.
      - Retorne APENAS o JSON válido, sem markdown.
      
      Texto do PDF:
      ${text}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              turma: { type: Type.STRING },
              projeto_1: { type: Type.STRING },
              professor_1: { type: Type.STRING },
              projeto_2: { type: Type.STRING },
              professor_2: { type: Type.STRING }
            },
            required: ["turma", "projeto_1", "projeto_2"]
          }
        }
      }
    });

    const parsedIfas = JSON.parse(response.text || '[]');

    // Insert into database
    const client = getAuthClient(req);
    const ifasToInsert = parsedIfas.map((ifa: any) => ({
      turma: ifa.turma.replace(/\D/g, ''),
      tipo_ifa: ifa.projeto_1.toLowerCase().includes('humanas') || ifa.projeto_1.toLowerCase().includes('linguagem') ? 'Tipo 1' : 'Tipo 2',
      projeto_1: ifa.projeto_1,
      professor_1: ifa.professor_1 || '',
      projeto_2: ifa.projeto_2,
      professor_2: ifa.professor_2 || '',
      vagas_maximas: 40
    }));

    const { error: insertError } = await client.from('ifas').insert(ifasToInsert);
    if (insertError) throw insertError;

    res.json({ success: true, message: `${parsedIfas.length} IFAs importados com sucesso.`, data: parsedIfas });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: 'Erro ao processar o PDF: ' + error.message });
  }
});


// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
