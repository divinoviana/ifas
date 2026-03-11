import { createClient } from '@supabase/supabase-js';

// Using the anon key is failing due to RLS. I'll need to use the service role key if available, or instruct the user to disable RLS/add a policy.
// Since I don't have the service role key, I will output the SQL for the user to run.

const supabaseUrl = process.env.SUPABASE_URL || 'https://yikojuwgfdrfpezcnufu.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_-3vxCmHWNtm7zDqaPm0m8Q_TjkGaeFo';
const supabase = createClient(supabaseUrl, supabaseKey);

const ifas = [
  {
    turma: '1301',
    tipo_ifa: 'Tipo 1',
    professor_1: 'AFONSO',
    projeto_1: 'RAÍZES E PRESERVAÇÃO DA CULTURA AFRO NO TOCANTINS',
    professor_2: 'DÉFICIT',
    projeto_2: '-',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '1302',
    tipo_ifa: 'Tipo 2',
    professor_1: 'FRANCISCO',
    projeto_1: 'REUTILIZAÇÃO DE GARRAFAS DE VIDRO PARA PROTEÇÃO DO MEIO AMBIENTE / A FISIO-QUÍMICA DA ARGILA E DA CERÂMICA: CIÊNCIA, ARTE E SUSTENTABILIDADE',
    professor_2: 'ROSEVANY',
    projeto_2: 'DINHEIRO EM FOCO',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '1303',
    tipo_ifa: 'Tipo 2',
    professor_1: 'ANA KAROLINA',
    projeto_1: 'MUSEU DA SUSTENTABILIDADE: EDUCAÇÃO PARA UM FUTURO SUSTENTÁVEL',
    professor_2: 'CARLA ANDRÉIA',
    projeto_2: 'ALÉM DO OLHAR: O PODER DAS IMAGENS NA INTERPRETAÇÃO VISUAL DA CONSTRUÇÃO DE SENTIDOS',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '1304',
    tipo_ifa: 'Tipo 2',
    professor_1: 'FLOR',
    projeto_1: 'A QUÍMICA NA PRÁTICA',
    professor_2: 'MARCUS SALES',
    projeto_2: 'BOATEMÁTICA E A CULTURA MAKER',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '1305',
    tipo_ifa: 'Tipo 1',
    professor_1: 'ALEX',
    projeto_1: 'PIONEIROS DO TOCANTINS: A SAGA DOS IMIGRANTES',
    professor_2: 'EDILSON',
    projeto_2: 'ESPANHOL BÁSICO',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '2301',
    tipo_ifa: 'Tipo 1',
    professor_1: 'AFONSO',
    projeto_1: 'RAÍZES E PRESERVAÇÃO DA CULTURA AFRO NO TOCANTINS',
    professor_2: 'CARLA ANDRÉIA',
    projeto_2: 'ALÉM DO OLHAR: O PODER DAS IMAGENS NA INTERPRETAÇÃO VISUAL DA CONSTRUÇÃO DE SENTIDOS',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '2302',
    tipo_ifa: 'Tipo 1',
    professor_1: 'ALEX',
    projeto_1: 'PIONEIROS DO TOCANTINS: A SAGA DOS IMIGRANTES',
    professor_2: 'NÚBIA',
    projeto_2: 'PATRIMÔNIO, CULTURA MATERIAL E IDENTIDADE COLETIVA',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '2303',
    tipo_ifa: 'Tipo 1',
    professor_1: 'MARLZONNI',
    projeto_1: 'VOZES DA ANCESTRALIDADE: UBUNTU TOCANTINENSE',
    professor_2: 'JAQUELINE',
    projeto_2: 'CULTURE',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '2304',
    tipo_ifa: 'Tipo 2',
    professor_1: 'ANA KAROLINA',
    projeto_1: 'MUSEU DA SUSTENTABILIDADE: EDUCAÇÃO PARA UM FUTURO SUSTENTÁVEL',
    professor_2: 'WASHINGTON',
    projeto_2: 'LER, CONTAR, ESCREVER',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '3301',
    tipo_ifa: 'Tipo 1',
    professor_1: 'DÉFICIT',
    projeto_1: '-',
    professor_2: 'WASHINGTON',
    projeto_2: 'LER, CONTAR, ESCREVER',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '3302',
    tipo_ifa: 'Tipo 2',
    professor_1: 'FLOR',
    projeto_1: 'A QUÍMICA NA PRÁTICA',
    professor_2: 'ANA CAROLINA',
    projeto_2: 'PENSAMENTO LÓGICO E ESTRATÉGIAS MATEMÁTICAS PARA DESAFIOS REAIS',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '3303',
    tipo_ifa: 'Tipo 2',
    professor_1: 'FRANCISCO',
    projeto_1: 'REUTILIZAÇÃO DE GARRAFAS DE VIDRO PARA PROTEÇÃO DO MEIO AMBIENTE / A FISIO-QUÍMICA DA ARGILA E DA CERÂMICA: CIÊNCIA, ARTE E SUSTENTABILIDADE',
    professor_2: 'MARCUS SALES',
    projeto_2: 'BOATEMÁTICA E A CULTURA MAKER',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '3304',
    tipo_ifa: 'Tipo 2',
    professor_1: 'CRISTIANE',
    projeto_1: 'QUÍMICA EM TUDO: O ELO INVISÍVEL ENTRE A TEORIA, A SOCIEDADE E A INOVAÇÃO',
    professor_2: 'DÉFICIT',
    projeto_2: '-',
    vagas_maximas: 40,
    is_open: true
  },
  {
    turma: '3309',
    tipo_ifa: 'Tipo 1',
    professor_1: 'MARLZONNI',
    projeto_1: 'VOZES DA ANCESTRALIDADE: UBUNTU TOCANTINENSE',
    professor_2: 'NÚBIA',
    projeto_2: 'PATRIMÔNIO, CULTURA MATERIAL E IDENTIDADE COLETIVA',
    vagas_maximas: 40,
    is_open: true
  }
];

async function seed() {
  console.log('Inserting IFAs...');
  const { data, error } = await supabase.from('ifas').insert(ifas).select();
  
  if (error) {
    console.error('Error inserting IFAs:', error);
  } else {
    console.log('Successfully inserted', data.length, 'IFAs');
  }
}

seed();
