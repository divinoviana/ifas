import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yikojuwgfdrfpezcnufu.supabase.co';
const supabaseKey = 'sb_publishable_-3vxCmHWNtm7zDqaPm0m8Q_TjkGaeFo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('ifas').select('*, inscricoes(count)');
  console.log(JSON.stringify(data, null, 2));
  console.log('Error:', error);
}
run();
