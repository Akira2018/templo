import Database from 'better-sqlite3';

interface LegacyMember {
  [key: string]: unknown;
}

type MappedMember = {
  name: string;
  photo?: string;
  church_id?: number;
  birth_date?: string;
  marital_status?: string;
  role?: string;
  ministry_leader?: string;
  profession?: string;
  skill?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  cep?: string;
  logradouro?: string;
  complement?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  nr_imovel?: string;
  observation?: string;
  status?: string;
  error_cep?: string;
  baptism_date?: string;
  talents?: string;
};

const args = process.argv.slice(2);
const sourceArg = args.find((a) => !a.startsWith('-'));
const dbFlagIndex = args.findIndex((a) => a === '--db' || a === '-db');
const targetDbPath = dbFlagIndex >= 0 ? args[dbFlagIndex + 1] : 'church.db';

if (!sourceArg) {
  console.error('Uso: npm run import:sqlite-members -- caminho/arquivo.sqlite [--db caminho/church.db]');
  process.exit(1);
}

const sourceDbPath = sourceArg;

if (/\.sql$/i.test(sourceDbPath)) {
  console.error('Arquivo .sql detectado. Este comando importa somente banco SQLite (.db/.sqlite/.sqlite3).');
  process.exit(1);
}

const sourceDb = new Database(sourceDbPath, { readonly: true });
const targetDb = new Database(targetDbPath);

const tableExists = (db: Database.Database, table: string): boolean => {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(table) as { name?: string } | undefined;
  return Boolean(row?.name);
};

const ensureSchema = () => {
  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS churches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pastor_name TEXT,
      email TEXT DEFAULT 'naoseioemail@gmail.com',
      phone TEXT UNIQUE,
      cep TEXT,
      logradouro TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      nr_imovel TEXT,
      observation TEXT,
      error_cep TEXT
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      photo TEXT,
      church_id INTEGER,
      birth_date TEXT,
      marital_status TEXT DEFAULT 'Não informou',
      role TEXT DEFAULT 'Membro(a)',
      ministry_leader TEXT DEFAULT 'Não ocupa cargo de Liderança',
      profession TEXT,
      skill TEXT,
      email TEXT,
      phone TEXT,
      cpf TEXT,
      rg TEXT,
      cep TEXT,
      logradouro TEXT,
      complement TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      nr_imovel TEXT,
      observation TEXT,
      status TEXT DEFAULT 'Ativo(a)',
      error_cep TEXT,
      baptism_date TEXT,
      talents TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (church_id) REFERENCES churches(id)
    );
  `);
};

const normalizeDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const ddmmyyyy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  return text;
};

const pick = (row: LegacyMember, keys: string[]): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return undefined;
};

const mapMember = (row: LegacyMember): MappedMember | null => {
  const name = pick(row, ['name', 'nome_membro']);
  if (!name) return null;

  const mapped: MappedMember = {
    name: String(name).trim(),
    photo: pick(row, ['photo', 'foto']) as string | undefined,
    church_id: Number(pick(row, ['church_id', 'igreja_id']) || 0) || undefined,
    birth_date: normalizeDate(pick(row, ['birth_date', 'data_aniversario'])),
    marital_status: (pick(row, ['marital_status', 'estado_civil']) as string | undefined) || 'Não informou',
    role: (pick(row, ['role', 'cargo']) as string | undefined) || 'Membro(a)',
    ministry_leader: (pick(row, ['ministry_leader', 'grupo']) as string | undefined) || 'Não ocupa cargo de Liderança',
    profession: pick(row, ['profession']) as string | undefined,
    skill: pick(row, ['skill']) as string | undefined,
    email: pick(row, ['email']) as string | undefined,
    phone: (pick(row, ['phone', 'numero_telefone']) as string | undefined) || undefined,
    cpf: pick(row, ['cpf']) as string | undefined,
    rg: pick(row, ['rg']) as string | undefined,
    cep: pick(row, ['cep']) as string | undefined,
    logradouro: pick(row, ['logradouro']) as string | undefined,
    complement: pick(row, ['complement']) as string | undefined,
    bairro: pick(row, ['bairro']) as string | undefined,
    cidade: pick(row, ['cidade']) as string | undefined,
    uf: pick(row, ['uf', 'estado']) as string | undefined,
    nr_imovel: pick(row, ['nr_imovel']) as string | undefined,
    observation: pick(row, ['observation', 'observacao']) as string | undefined,
    status: (pick(row, ['status', 'situacao']) as string | undefined) || 'Ativo(a)',
    error_cep: pick(row, ['error_cep', 'erro_cep']) as string | undefined,
    baptism_date: normalizeDate(pick(row, ['baptism_date'])),
    talents: pick(row, ['talents']) as string | undefined,
  };

  return mapped;
};

const readSourceMembers = (): LegacyMember[] => {
  if (tableExists(sourceDb, 'members')) {
    return sourceDb.prepare('SELECT * FROM members').all() as LegacyMember[];
  }
  if (tableExists(sourceDb, 'membros')) {
    return sourceDb.prepare('SELECT * FROM membros').all() as LegacyMember[];
  }

  throw new Error('Tabela de origem não encontrada. Esperado: members ou membros.');
};

const main = () => {
  ensureSchema();

  const churchExistsStmt = targetDb.prepare('SELECT id FROM churches WHERE id = ?');
  const byCpfStmt = targetDb.prepare('SELECT id FROM members WHERE cpf = ?');
  const byEmailStmt = targetDb.prepare('SELECT id FROM members WHERE email = ?');

  const insertStmt = targetDb.prepare(`
    INSERT INTO members (
      name, photo, church_id, birth_date, marital_status, role,
      ministry_leader, profession, skill, email, phone, cpf,
      rg, cep, logradouro, complement, bairro, cidade, uf,
      nr_imovel, observation, status, error_cep, baptism_date, talents
    ) VALUES (
      @name, @photo, @church_id, @birth_date, @marital_status, @role,
      @ministry_leader, @profession, @skill, @email, @phone, @cpf,
      @rg, @cep, @logradouro, @complement, @bairro, @cidade, @uf,
      @nr_imovel, @observation, @status, @error_cep, @baptism_date, @talents
    )
  `);

  const sourceRows = readSourceMembers();
  let inserted = 0;
  let skipped = 0;

  const tx = targetDb.transaction(() => {
    for (const row of sourceRows) {
      const mapped = mapMember(row);
      if (!mapped) {
        skipped += 1;
        continue;
      }

      if (mapped.cpf && byCpfStmt.get(mapped.cpf)) {
        skipped += 1;
        continue;
      }
      if (mapped.email && byEmailStmt.get(mapped.email)) {
        skipped += 1;
        continue;
      }

      if (mapped.church_id && !churchExistsStmt.get(mapped.church_id)) {
        mapped.church_id = undefined;
      }

      insertStmt.run(mapped);
      inserted += 1;
    }
  });

  tx();

  console.log(`Importacao concluida.`);
  console.log(`Origem: ${sourceDbPath}`);
  console.log(`Destino: ${targetDbPath}`);
  console.log(`Total lido: ${sourceRows.length}`);
  console.log(`Inseridos: ${inserted}`);
  console.log(`Ignorados (duplicados/invalidos): ${skipped}`);
};

try {
  main();
} finally {
  sourceDb.close();
  targetDb.close();
}
