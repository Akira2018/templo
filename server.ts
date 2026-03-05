import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH || "church.db";
const dbDir = path.dirname(dbPath);
if (dbDir && dbDir !== ".") {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Initialize Database Schema
db.exec(`
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

  CREATE TABLE IF NOT EXISTS professions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS talents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  // Seed some data if empty
  const profCount = db.prepare("SELECT COUNT(*) as count FROM professions").get() as { count: number };
  if (profCount.count === 0) {
    const profs = ['Autônomo(a)', 'Aposentado(a)', 'Estudante', 'Professor(a)', 'Engenheiro(a)', 'Médico(a)', 'Vendedor(a)', 'Empresário(a)', 'Outros'];
    const insertProf = db.prepare("INSERT INTO professions (name) VALUES (?)");
    profs.forEach(p => insertProf.run(p));
  }

  const skillCount = db.prepare("SELECT COUNT(*) as count FROM skills").get() as { count: number };
  if (skillCount.count === 0) {
    const skills = ['Música', 'Canto', 'Instrumentos', 'Pregação', 'Ensino', 'Cozinha', 'Limpeza', 'Som/Mídia', 'Acolhimento', 'Outros'];
    const insertSkill = db.prepare("INSERT INTO skills (name) VALUES (?)");
    skills.forEach(s => insertSkill.run(s));
  }

  const talentCount = db.prepare("SELECT COUNT(*) as count FROM talents").get() as { count: number };
  if (talentCount.count === 0) {
    const talents = ['Artesanato', 'Costura', 'Informática', 'Liderança', 'Organização', 'Comunicação', 'Esportes', 'Outros'];
    const insertTalent = db.prepare("INSERT INTO talents (name) VALUES (?)");
    talents.forEach(t => insertTalent.run(t));
  }

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leader_id INTEGER,
    description TEXT,
    FOREIGN KEY (leader_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER,
    member_id INTEGER,
    PRIMARY KEY (group_id, member_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('income', 'expense')),
    category TEXT, -- Tithe, Offering, Salary, Utility, etc.
    amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    member_id INTEGER, -- Optional, for tithes/offerings
    FOREIGN KEY (member_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Evento', -- Culto, Reunião, Evento, etc.
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS prayer_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER,
    request TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    member_id INTEGER,
    ministry TEXT, -- Worship, Reception, etc.
    date TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
  );
`);

// Seed Data
const seedData = () => {
  const churchCount = db.prepare("SELECT COUNT(*) as count FROM churches").get().count;
  if (churchCount === 0) {
    const insertChurch = db.prepare(`
      INSERT INTO churches (name, pastor_name, email, phone, cidade, estado) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertChurch.run("Ecclesia Central", "Pr. Luiz Israel", "contato@ecclesia.com", "(11) 99999-9999", "São Paulo", "SP");
  }

  const memberCount = db.prepare("SELECT COUNT(*) as count FROM members").get().count;
  if (memberCount === 0) {
    const insertMember = db.prepare(`
      INSERT INTO members (name, email, phone, role, status, birth_date, church_id, marital_status, ministry_leader) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertMember.run("Pr. Luiz Israel", "luiz@ecclesia.com", "(11) 99999-9999", "Pastor(a)", "Ativo(a)", "1985-03-15", 1, "Casado(a)", "Pastor Senior");
    insertMember.run("Ana Silva", "ana@email.com", "(11) 98888-8888", "Membro(a)", "Ativo(a)", "1992-03-22", 1, "Solteiro(a)", "Líder de Ministério de Louvor");
    insertMember.run("João Santos", "joao@email.com", "(11) 97777-7777", "Diácono(nisa)", "Ativo(a)", "1978-04-10", 1, "Casado(a)", "Não ocupa cargo de Liderança");
    insertMember.run("Maria Oliveira", "maria@email.com", "(11) 96666-6666", "Membro(a)", "Ativo(a)", "1995-03-05", 1, "Solteiro(a)", "Não ocupa cargo de Liderança");

    const insertTransaction = db.prepare("INSERT INTO transactions (type, category, amount, description, date) VALUES (?, ?, ?, ?, ?)");
    insertTransaction.run("income", "Dízimo", 1500.00, "Dízimo Mensal - Membro 1", "2026-03-01");
    insertTransaction.run("income", "Oferta", 450.00, "Oferta Culto de Domingo", "2026-03-01");
    insertTransaction.run("expense", "Aluguel", 1200.00, "Aluguel do Templo", "2026-03-02");
    insertTransaction.run("expense", "Energia", 150.00, "Conta de Luz", "2026-03-02");

    const insertEvent = db.prepare("INSERT INTO events (title, description, start_date, location) VALUES (?, ?, ?, ?)");
    insertEvent.run("Culto de Celebração", "Culto principal de domingo", "2026-03-08T18:00:00", "Santuário Principal");
    insertEvent.run("Reunião de Oração", "Momento de intercessão", "2026-03-04T19:30:00", "Sala 2");

    const insertPrayer = db.prepare("INSERT INTO prayer_requests (member_id, request, status) VALUES (?, ?, ?)");
    insertPrayer.run(2, "Oração pela saúde da família", "pending");
    insertPrayer.run(3, "Agradecimento por novo emprego", "pending");
  }
};
seedData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow the static frontend (e.g. GitHub Pages) to call this API.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, dbPath });
  });

  // --- API Routes ---

  // Members
  app.get("/api/members", (req, res) => {
    const members = db.prepare(`
      SELECT m.*, c.name as church_name 
      FROM members m 
      LEFT JOIN churches c ON m.church_id = c.id 
      ORDER BY m.name ASC
    `).all();
    res.json(members);
  });

  app.get("/api/members/birthdays", (req, res) => {
    const currentMonth = new Date().toISOString().slice(5, 7);
    const birthdays = db.prepare(`
      SELECT name, birth_date 
      FROM members 
      WHERE strftime('%m', birth_date) = ? AND status = 'Ativo(a)'
      ORDER BY strftime('%d', birth_date) ASC
    `).all(currentMonth);
    res.json(birthdays);
  });

  app.post("/api/members", (req, res) => {
    const fields = [
      'name', 'photo', 'church_id', 'birth_date', 'marital_status', 'role', 
      'ministry_leader', 'profession', 'skill', 'email', 'phone', 'cpf', 
      'rg', 'cep', 'logradouro', 'complement', 'bairro', 'cidade', 'uf', 
      'nr_imovel', 'observation', 'status', 'baptism_date', 'talents'
    ];
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(f => req.body[f]);
    
    const info = db.prepare(
      `INSERT INTO members (${fields.join(', ')}) VALUES (${placeholders})`
    ).run(...values);
    res.json({ id: info.lastInsertRowid });
  });

  // Churches
  app.get("/api/churches", (req, res) => {
    const churches = db.prepare("SELECT * FROM churches ORDER BY name ASC").all();
    res.json(churches);
  });

  app.post("/api/churches", (req, res) => {
    const { name, pastor_name, email, phone, cep, logradouro, bairro, cidade, estado, nr_imovel, observation } = req.body;
    const info = db.prepare(`
      INSERT INTO churches (name, pastor_name, email, phone, cep, logradouro, bairro, cidade, estado, nr_imovel, observation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, pastor_name, email, phone, cep, logradouro, bairro, cidade, estado, nr_imovel, observation);
    res.json({ id: info.lastInsertRowid });
  });

  // Finances
  app.get("/api/transactions", (req, res) => {
    const { startDate, endDate, category } = req.query;
    let query = "SELECT * FROM transactions WHERE 1=1";
    const params: any[] = [];

    if (startDate) {
      query += " AND date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND date <= ?";
      params.push(endDate);
    }
    if (category && category !== 'all') {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY date DESC";
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  app.get("/api/transactions/categories", (req, res) => {
    const categories = db.prepare("SELECT DISTINCT category FROM transactions").all();
    res.json(categories.map((c: any) => c.category));
  });

  app.post("/api/transactions", (req, res) => {
    const { type, category, amount, description, date, member_id } = req.body;
    const info = db.prepare(
      "INSERT INTO transactions (type, category, amount, description, date, member_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(type, category, amount, description, date, member_id || null);
    res.json({ id: info.lastInsertRowid });
  });

  // Professions & Skills
  app.get("/api/professions", (req, res) => {
    const professions = db.prepare("SELECT * FROM professions ORDER BY name ASC").all();
    res.json(professions);
  });

  app.get("/api/skills", (req, res) => {
    const skills = db.prepare("SELECT * FROM skills ORDER BY name ASC").all();
    res.json(skills);
  });

  app.get("/api/talents", (req, res) => {
    const talents = db.prepare("SELECT * FROM talents ORDER BY name ASC").all();
    res.json(talents);
  });

  // Image Upload (Base64)
  app.post("/api/upload", (req, res) => {
    const { image } = req.body;
    // In a real app, we'd save to disk or S3. Here we just return the base64 or a mock URL.
    // For this demo, we'll just echo it back as if it was saved.
    res.json({ url: image });
  });

  // Events
  app.get("/api/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events ORDER BY start_date ASC").all();
    res.json(events);
  });

  app.post("/api/events", (req, res) => {
    const { title, type, description, start_date, end_date, location } = req.body;
    const info = db.prepare(
      "INSERT INTO events (title, type, description, start_date, end_date, location) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(title, type || 'Evento', description, start_date, end_date, location);
    res.json({ id: info.lastInsertRowid });
  });

  // Prayer Requests
  app.get("/api/prayer-requests", (req, res) => {
    const requests = db.prepare(`
      SELECT pr.*, m.name as member_name 
      FROM prayer_requests pr 
      LEFT JOIN members m ON pr.member_id = m.id 
      ORDER BY pr.created_at DESC
    `).all();
    res.json(requests);
  });

  app.post("/api/prayer-requests", (req, res) => {
    const { member_id, request } = req.body;
    const info = db.prepare(
      "INSERT INTO prayer_requests (member_id, request) VALUES (?, ?)"
    ).run(member_id || null, request);
    res.json({ id: info.lastInsertRowid });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentYear = new Date().getFullYear().toString();

    const memberCount = db.prepare("SELECT COUNT(*) as count FROM members").get().count;
    
    const totalIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income'").get().total || 0;
    const totalExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'").get().total || 0;
    
    const monthIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?").get(currentMonth).total || 0;
    const monthExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?").get(currentMonth).total || 0;

    const yearIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND strftime('%Y', date) = ?").get(currentYear).total || 0;
    const yearExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y', date) = ?").get(currentYear).total || 0;

    const pendingPrayers = db.prepare("SELECT COUNT(*) as count FROM prayer_requests WHERE status = 'pending'").get().count;
    
    res.json({
      memberCount,
      total: {
        balance: totalIncome - totalExpense,
        income: totalIncome,
        expense: totalExpense
      },
      month: {
        balance: monthIncome - monthExpense,
        income: monthIncome,
        expense: monthExpense
      },
      year: {
        balance: yearIncome - yearExpense,
        income: yearIncome,
        expense: yearExpense
      },
      pendingPrayers
    });
  });

  // Reports
  app.get("/api/reports/balance-sheet", (req, res) => {
    const { type } = req.query; // 'monthly' or 'yearly'
    const format = type === 'yearly' ? '%Y' : '%Y-%m';
    
    const report = db.prepare(`
      SELECT 
        strftime('${format}', date) as period,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      GROUP BY period
      ORDER BY period DESC
    `).all();

    const formattedReport = report.map((row: any) => ({
      ...row,
      balance: row.income - row.expense
    }));

    res.json(formattedReport);
  });

  app.get("/api/stats/income-by-category", (req, res) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const data = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE type = 'income' AND strftime('%Y-%m', date) = ?
      GROUP BY category
    `).all(currentMonth);
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      app.get('/', (_req, res) => {
        res.json({
          message: 'Templo API is running',
          health: '/api/health',
        });
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
