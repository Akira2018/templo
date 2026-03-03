import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  LayoutDashboard, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Heart,
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Download,
  Camera,
  Upload,
  MapPin,
  Briefcase,
  Star,
  UserPlus,
  Cake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

// --- Types ---
interface Member {
  id: number;
  name: string;
  photo?: string;
  church_id: number;
  church_name?: string;
  birth_date: string;
  marital_status: string;
  role: string;
  ministry_leader: string;
  profession?: string;
  skill?: string;
  email: string;
  phone: string;
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
  status: string;
  baptism_date?: string;
  talents?: string;
}

interface Church {
  id: number;
  name: string;
  pastor_name: string;
  email: string;
  phone: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  nr_imovel: string;
  observation: string;
}

interface Birthday {
  name: string;
  birth_date: string;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface Event {
  id: number;
  title: string;
  type: string;
  description: string;
  start_date: string;
  location: string;
}

interface PrayerRequest {
  id: number;
  member_name: string;
  request: string;
  status: string;
  created_at: string;
}

interface Stats {
  memberCount: number;
  total: {
    balance: number;
    income: number;
    expense: number;
  };
  month: {
    balance: number;
    income: number;
    expense: number;
  };
  year: {
    balance: number;
    income: number;
    expense: number;
  };
  pendingPrayers: number;
}

interface BalanceSheet {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

interface IncomeByCategory {
  category: string;
  total: number;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-stone-900 text-white shadow-lg' 
        : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, color }: { label: string, value: string | number, icon: any, trend?: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-stone-500 text-sm font-medium mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-stone-900">{value}</h3>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet[]>([]);
  const [incomeByCategory, setIncomeByCategory] = useState<IncomeByCategory[]>([]);
  const [cashFlowTransactions, setCashFlowTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all'
  });
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [professions, setProfessions] = useState<{id: number, name: string}[]>([]);
  const [skills, setSkills] = useState<{id: number, name: string}[]>([]);
  const [talents, setTalents] = useState<{id: number, name: string}[]>([]);
  const [newMember, setNewMember] = useState<Partial<Member>>({
    name: '',
    photo: '',
    church_id: 0,
    birth_date: '',
    marital_status: 'Solteiro(a)',
    role: 'Membro(a)',
    ministry_leader: 'Não',
    profession: '',
    skill: '',
    email: '',
    phone: '',
    cpf: '',
    rg: '',
    cep: '',
    logradouro: '',
    complement: '',
    bairro: '',
    cidade: '',
    uf: '',
    nr_imovel: '',
    observation: '',
    status: 'Ativo(a)',
    baptism_date: '',
    talents: ''
  });
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'Culto',
    description: '',
    start_date: '',
    location: ''
  });

  useEffect(() => {
    fetchStats();
    fetchMembers();
    fetchChurches();
    fetchBirthdays();
    fetchTransactions();
    fetchEvents();
    fetchPrayers();
    fetchBalanceSheet();
    fetchCashFlow();
    fetchCategories();
    fetchIncomeByCategory();
    fetchProfessions();
    fetchSkills();
    fetchTalents();
  }, [reportType, filters]);

  const fetchProfessions = async () => {
    const res = await fetch('/api/professions');
    const data = await res.json();
    setProfessions(data);
  };

  const fetchSkills = async () => {
    const res = await fetch('/api/skills');
    const data = await res.json();
    setSkills(data);
  };

  const fetchTalents = async () => {
    const res = await fetch('/api/talents');
    const data = await res.json();
    setTalents(data);
  };

  const fetchChurches = async () => {
    const res = await fetch('/api/churches');
    const data = await res.json();
    setChurches(data);
  };

  const fetchBirthdays = async () => {
    const res = await fetch('/api/members/birthdays');
    const data = await res.json();
    setBirthdays(data);
  };

  const fetchIncomeByCategory = async () => {
    const res = await fetch('/api/stats/income-by-category');
    const data = await res.json();
    setIncomeByCategory(data);
  };

  const exportToExcel = (data: any[], fileName: string, title?: string) => {
    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;

    if (title) {
      // Create worksheet with title and empty row
      worksheet = XLSX.utils.aoa_to_sheet([[title.toUpperCase()], []]);
      // Add the data starting from the 3rd row
      XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A3' });
      
      // Merge title cells across all columns
      const numCols = Object.keys(data[0] || {}).length;
      if (numCols > 0) {
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
      }
      // Freeze the header row (which is now row 3)
      worksheet['!freeze'] = { xSplit: 0, ySplit: 3 };
    } else {
      worksheet = XLSX.utils.json_to_sheet(data);
      // Freeze the first row
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    }
    
    // Set column widths for better formatting
    const wscols = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => (row[key]?.toString() || "").length)) + 5
    }));
    worksheet['!cols'] = wscols;

    // Apply number formatting to currency columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const headerRow = title ? 2 : 0; // Data headers are on row 3 (index 2) if title exists

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        const cell = worksheet[cell_ref];
        if (!cell || cell.t !== 'n') continue;

        // Check the header for this column
        const header_cell = worksheet[XLSX.utils.encode_cell({ c: C, r: headerRow })];
        if (header_cell && (
          header_cell.v.toString().includes('Valor') || 
          header_cell.v.toString().includes('Saldo') ||
          header_cell.v.toString().includes('Entradas') ||
          header_cell.v.toString().includes('Saídas') ||
          header_cell.v.toString().includes('Receita') ||
          header_cell.v.toString().includes('Despesa')
        )) {
          cell.z = '"R$ "#,##0.00'; // Brazilian currency format
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const fetchCashFlow = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category !== 'all') params.append('category', filters.category);
    
    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json();
    setCashFlowTransactions(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/transactions/categories');
    const data = await res.json();
    setCategories(data);
  };

  const fetchBalanceSheet = async () => {
    const res = await fetch(`/api/reports/balance-sheet?type=${reportType}`);
    const data = await res.json();
    setBalanceSheet(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchMembers = async () => {
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data);
  };

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTransactions(data);
  };

  const fetchEvents = async () => {
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(data);
  };

  const fetchPrayers = async () => {
    const res = await fetch('/api/prayer-requests');
    const data = await res.json();
    setPrayers(data);
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total de Membros" 
          value={stats?.memberCount || 0} 
          icon={Users} 
          color="bg-indigo-500" 
        />
        <StatCard 
          label="Saldo Atual" 
          value={`R$ ${stats?.total.balance.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label="Entradas (Mês)" 
          value={`R$ ${stats?.month.income.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-blue-500" 
        />
        <StatCard 
          label="Pedidos de Oração" 
          value={stats?.pendingPrayers || 0} 
          icon={Heart} 
          color="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Members */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-stone-900">Membros Recentes</h3>
            <button onClick={() => setActiveTab('members')} className="text-sm text-indigo-600 font-semibold hover:underline">Ver todos</button>
          </div>
          <div className="space-y-4">
            {members.slice(0, 5).map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{member.name}</p>
                    <p className="text-xs text-stone-500">{member.role}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Birthdays of the Month */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Heart size={20} className="text-rose-500" fill="currentColor" />
            <h3 className="text-lg font-bold text-stone-900">Aniversariantes do Mês</h3>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {birthdays.length > 0 ? birthdays.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-rose-500 leading-none">{new Date(b.birth_date).getDate()}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase leading-none">{new Date(b.birth_date).toLocaleString('pt-BR', { month: 'short' })}</span>
                  </div>
                  <p className="font-semibold text-stone-900 text-sm">{b.name}</p>
                </div>
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <Plus size={14} />
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-stone-400 italic text-sm">
                Nenhum aniversariante este mês.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-stone-900">Próximos Eventos</h3>
            <button onClick={() => setActiveTab('events')} className="text-sm text-indigo-600 font-semibold hover:underline">Ver agenda</button>
          </div>
          <div className="space-y-4">
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600">
                  <span className="text-xs font-bold uppercase">{new Date(event.start_date).toLocaleString('pt-BR', { month: 'short' })}</span>
                  <span className="text-lg font-bold leading-none">{new Date(event.start_date).getDate()}</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{event.title}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(event.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });
    if (res.ok) {
      setShowMemberModal(false);
      setNewMember({
        name: '', photo: '', church_id: 0, birth_date: '', marital_status: 'Solteiro(a)',
        role: 'Membro(a)', ministry_leader: 'Não', profession: '', skill: '', email: '',
        phone: '', cpf: '', rg: '', cep: '', logradouro: '', complement: '',
        bairro: '', cidade: '', uf: '', nr_imovel: '', observation: '',
        status: 'Ativo(a)', baptism_date: '', talents: ''
      });
      fetchMembers();
      fetchStats();
      fetchBirthdays();
    }
  };

  const handleCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setNewMember(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        const data = await res.json();
        setNewMember(prev => ({ ...prev, photo: data.url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">Gestão de Membresia</h2>
        <button 
          onClick={() => setShowMemberModal(true)}
          className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-800 transition-colors"
        >
          <UserPlus size={20} /> Novo Membro
        </button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-stone-100 card-shadow overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center gap-3">
            <Search size={20} className="text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar membros..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-stone-900 placeholder-stone-400"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Igreja</th>
                  <th className="px-6 py-4 font-semibold">Cargo / Ministério</th>
                  <th className="px-6 py-4 font-semibold">Contato</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-sm overflow-hidden border border-stone-200">
                          {member.photo ? (
                            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-stone-900 block">{member.name}</span>
                          <span className="text-[10px] text-stone-400 uppercase font-bold">{member.marital_status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">{member.church_name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-stone-900 font-medium">{member.role}</div>
                      <div className="text-xs text-stone-500">{member.ministry_leader}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      <div>{member.email}</div>
                      <div className="text-xs text-stone-400">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        member.status === 'Ativo(a)' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-stone-400 hover:text-stone-900 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 card-shadow p-6 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Cake size={20} />
            </div>
            <h3 className="font-bold text-stone-900">Aniversariantes do Mês</h3>
          </div>
          
          <div className="space-y-4">
            {birthdays.length > 0 ? birthdays.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{b.name}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">
                      {new Date(b.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                  Dia {new Date(b.birth_date).getDate()}
                </div>
              </div>
            )) : (
              <p className="text-sm text-stone-400 text-center py-4">Nenhum aniversariante este mês.</p>
            )}
          </div>
        </div>
      </div>

      {/* Member Modal */}
      <AnimatePresence>
        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Cadastro de Membro</h3>
                  <p className="text-sm text-stone-500">Preencha todos os campos para registrar um novo membro.</p>
                </div>
                <button onClick={() => setShowMemberModal(false)} className="text-stone-400 hover:text-stone-900 transition-colors bg-white p-2 rounded-full shadow-sm">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddMember} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Photo Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                      {newMember.photo ? (
                        <img src={newMember.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Camera size={32} className="text-stone-300" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-stone-900 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-stone-800 transition-colors">
                      <Upload size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-900">Foto do Perfil</h4>
                    <p className="text-xs text-stone-500">Tamanho recomendado: 400x400px. Formatos: JPG, PNG.</p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} /> Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome Completo</label>
                      <input required type="text" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Data de Nascimento</label>
                      <input required type="date" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.birth_date} onChange={e => setNewMember({...newMember, birth_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Estado Civil</label>
                      <select className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        value={newMember.marital_status} onChange={e => setNewMember({...newMember, marital_status: e.target.value})}>
                        <option>Solteiro(a)</option>
                        <option>Casado(a)</option>
                        <option>Divorciado(a)</option>
                        <option>Viúvo(a)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">CPF</label>
                      <input type="text" placeholder="000.000.000-00" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.cpf} onChange={e => setNewMember({...newMember, cpf: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">RG</label>
                      <input type="text" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.rg} onChange={e => setNewMember({...newMember, rg: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Church Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Heart size={16} /> Vida Eclesiástica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Igreja</label>
                      <select required className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        value={newMember.church_id} onChange={e => setNewMember({...newMember, church_id: Number(e.target.value)})}>
                        <option value={0}>Selecione uma igreja</option>
                        {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Cargo / Função</label>
                      <input type="text" placeholder="Ex: Diácono, Obreiro..." className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Líder de Ministério?</label>
                      <select className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        value={newMember.ministry_leader} onChange={e => setNewMember({...newMember, ministry_leader: e.target.value})}>
                        <option>Não</option>
                        <option>Sim</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Data de Batismo</label>
                      <input type="date" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.baptism_date} onChange={e => setNewMember({...newMember, baptism_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Habilidade Principal</label>
                      <select className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        value={newMember.skill} onChange={e => setNewMember({...newMember, skill: e.target.value})}>
                        <option value="">Selecione uma habilidade</option>
                        {skills.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Profissão</label>
                      <select className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        value={newMember.profession} onChange={e => setNewMember({...newMember, profession: e.target.value})}>
                        <option value="">Selecione uma profissão</option>
                        {professions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Talento / Dom</label>
                      <select className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        value={newMember.talents} onChange={e => setNewMember({...newMember, talents: e.target.value})}>
                        <option value="">Selecione um talento</option>
                        {talents.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={16} /> Endereço Residencial
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">CEP</label>
                      <input type="text" placeholder="00000-000" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.cep} onChange={e => {
                          setNewMember({...newMember, cep: e.target.value});
                          handleCEP(e.target.value);
                        }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Logradouro</label>
                      <input type="text" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.logradouro} onChange={e => setNewMember({...newMember, logradouro: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Número</label>
                      <input type="text" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.nr_imovel} onChange={e => setNewMember({...newMember, nr_imovel: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Complemento</label>
                      <input type="text" placeholder="Ex: Apto 101, Bloco B" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.complement} onChange={e => setNewMember({...newMember, complement: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Bairro</label>
                      <input type="text" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.bairro} onChange={e => setNewMember({...newMember, bairro: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Cidade</label>
                      <input type="text" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.cidade} onChange={e => setNewMember({...newMember, cidade: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">UF</label>
                      <input type="text" maxLength={2} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.uf} onChange={e => setNewMember({...newMember, uf: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} /> Contato e Observações
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">E-mail</label>
                      <input type="email" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Telefone / WhatsApp</label>
                      <input type="text" placeholder="(00) 00000-0000" className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500" 
                        value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Observações</label>
                      <textarea rows={3} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500 resize-none" 
                        value={newMember.observation} onChange={e => setNewMember({...newMember, observation: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 flex gap-4">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200">
                    Salvar Membro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderChurches = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">Cadastro de Igrejas</h2>
        <button className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-800 transition-colors">
          <Plus size={20} /> Nova Igreja
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {churches.map(church => (
          <div key={church.id} className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">{church.name}</h3>
                <p className="text-sm text-stone-500">Pastor: {church.pastor_name}</p>
              </div>
              <div className="p-2 bg-stone-100 rounded-lg text-stone-400">
                <Heart size={20} />
              </div>
            </div>
            
            <div className="space-y-3 border-t border-stone-50 pt-4">
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Search size={16} className="text-stone-400" />
                <span>{church.logradouro}, {church.nr_imovel} - {church.bairro}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Activity size={16} className="text-stone-400" />
                <span>{church.cidade} / {church.estado}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Users size={16} className="text-stone-400" />
                <span>{members.filter(m => m.church_id === church.id).length} Membros</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-stone-50 text-stone-600 py-2 rounded-xl text-sm font-bold hover:bg-stone-100 transition-colors">
                Editar
              </button>
              <button className="flex-1 bg-stone-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors">
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    if (res.ok) {
      setShowEventModal(false);
      setNewEvent({ title: '', type: 'Culto', description: '', start_date: '', location: '' });
      fetchEvents();
      fetchStats();
    }
  };

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">Agenda da Igreja</h2>
        <button 
          onClick={() => setShowEventModal(true)}
          className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-800 transition-colors"
        >
          <Plus size={20} /> Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {events.length > 0 ? events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow hover:border-indigo-200 transition-all group">
              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 shrink-0">
                  <span className="text-xs font-bold uppercase">{new Date(event.start_date).toLocaleString('pt-BR', { month: 'short' })}</span>
                  <span className="text-2xl font-bold leading-none">{new Date(event.start_date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{event.type}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {new Date(event.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-stone-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-stone-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{new Date(event.start_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Search size={14} />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-stone-200 text-center text-stone-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum evento programado.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200">
            <h3 className="font-bold text-lg mb-2">Dica Pastoral</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Mantenha a agenda sempre atualizada para que os membros possam se programar e participar ativamente da vida da igreja.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
            <h3 className="font-bold text-stone-900 mb-4">Resumo da Semana</h3>
            <div className="space-y-4">
              {/* Simple count of events in next 7 days could go here */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Eventos este mês</span>
                <span className="font-bold text-stone-900">{events.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-stone-900">Novo Evento</h3>
                <button onClick={() => setShowEventModal(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Título do Evento</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Culto de Celebração"
                      className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={newEvent.title}
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Tipo</label>
                    <select 
                      className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={newEvent.type}
                      onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                    >
                      <option value="Culto">Culto</option>
                      <option value="Reunião">Reunião</option>
                      <option value="Evento">Evento</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Data e Hora</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newEvent.start_date}
                    onChange={e => setNewEvent({...newEvent, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Local</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Santuário Principal"
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newEvent.location}
                    onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Descrição</label>
                  <textarea 
                    rows={3}
                    placeholder="Detalhes sobre o evento..."
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 mt-4"
                >
                  Salvar Evento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderFinances = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">Gestão Financeira</h2>
        <div className="flex gap-3">
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors">
            <Plus size={20} /> Entrada
          </button>
          <button className="bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-rose-700 transition-colors">
            <Plus size={20} /> Saída
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <p className="text-stone-500 text-sm font-medium mb-1">Total Entradas</p>
          <h3 className="text-2xl font-bold text-emerald-600">R$ {stats?.total.income.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <p className="text-stone-500 text-sm font-medium mb-1">Total Saídas</p>
          <h3 className="text-2xl font-bold text-rose-600">R$ {stats?.total.expense.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <p className="text-stone-500 text-sm font-medium mb-1">Saldo Líquido</p>
          <h3 className="text-2xl font-bold text-stone-900">R$ {stats?.total.balance.toLocaleString()}</h3>
        </div>
      </div>

        {/* Income by Category Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <h3 className="text-lg font-bold text-stone-900 mb-6">Entradas por Categoria (Mês Atual)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeByCategory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#78716c', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '14px'
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Total']}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                  {incomeByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#6366f1', '#8b5cf6'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 card-shadow overflow-hidden">
        <div className="p-4 border-bottom border-stone-100 flex justify-between items-center">
          <h3 className="font-bold text-stone-900">Transações Recentes</h3>
          <button className="text-sm text-indigo-600 font-semibold hover:underline">Exportar PDF</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Data</th>
              <th className="px-6 py-4 font-semibold">Categoria</th>
              <th className="px-6 py-4 font-semibold">Descrição</th>
              <th className="px-6 py-4 font-semibold text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-stone-600">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {tx.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-stone-900 font-medium">{tx.description}</td>
                <td className={`px-6 py-4 text-sm font-bold text-right ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBirthdays = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Aniversariantes do Mês</h2>
          <p className="text-stone-500">Lista completa de membros que celebram aniversário em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}.</p>
        </div>
        <button 
          onClick={() => exportToExcel(birthdays, 'Aniversariantes_Mes', `ANIVERSARIANTES DO MÊS - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`)}
          className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm"
        >
          <Download size={20} /> Exportar Lista
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 card-shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Dia</th>
              <th className="px-6 py-4 font-semibold">Membro</th>
              <th className="px-6 py-4 font-semibold">Data de Nascimento</th>
              <th className="px-6 py-4 font-semibold">Idade</th>
              <th className="px-6 py-4 font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {birthdays.length > 0 ? birthdays.map((b, idx) => {
              const birthDate = new Date(b.birth_date);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }

              return (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      {birthDate.getDate()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-xs">
                        {b.name.charAt(0)}
                      </div>
                      <span className="font-medium text-stone-900">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">
                    {birthDate.toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">
                    {age} anos
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                      <MessageSquare size={14} /> Enviar Parabéns
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                  Nenhum aniversariante encontrado para este mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPrayers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">Pedidos de Oração</h2>
        <button className="bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-rose-700 transition-colors">
          <Plus size={20} /> Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prayers.map(prayer => (
          <div key={prayer.id} className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${prayer.status === 'pending' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                  {(prayer.member_name || 'V').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-stone-900">{prayer.member_name || 'Visitante'}</p>
                  <p className="text-xs text-stone-500">{new Date(prayer.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                prayer.status === 'pending' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {prayer.status === 'pending' ? 'Pendente' : 'Orado'}
              </span>
            </div>
            <p className="text-stone-600 italic leading-relaxed">"{prayer.request}"</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors">
                <CheckCircle2 size={20} />
              </button>
              <button className="p-2 text-stone-400 hover:text-rose-600 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => {
    const handleExport = () => {
      const exportData = balanceSheet.map(row => ({
        Período: row.period,
        Entradas: row.income,
        Saídas: row.expense,
        Saldo: row.balance
      }));
      exportToExcel(exportData, `Balancete_${reportType}`, `BALANCETE ${reportType === 'monthly' ? 'MENSAL' : 'ANUAL'} - ECCLESIA MANAGER`);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-stone-900">Relatórios Financeiros</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors text-sm font-bold"
            >
              <Download size={18} /> Exportar Excel
            </button>
            <div className="flex bg-stone-200 p-1 rounded-xl">
              <button 
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'monthly' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Mensal
              </button>
              <button 
                onClick={() => setReportType('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'yearly' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Anual
              </button>
            </div>
          </div>
        </div>

      {/* Consolidated Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h4 className="font-bold text-stone-900">Resumo do Mês Atual</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 uppercase font-bold">Entradas</p>
              <p className="text-lg font-bold text-emerald-600">R$ {stats?.month.income.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase font-bold">Saídas</p>
              <p className="text-lg font-bold text-rose-600">R$ {stats?.month.expense.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-sm text-stone-500">Saldo Mensal</span>
            <span className={`font-bold ${stats?.month.balance! >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              R$ {stats?.month.balance.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-bold text-stone-900">Resumo do Ano ({new Date().getFullYear()})</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 uppercase font-bold">Entradas</p>
              <p className="text-lg font-bold text-emerald-600">R$ {stats?.year.income.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase font-bold">Saídas</p>
              <p className="text-lg font-bold text-rose-600">R$ {stats?.year.expense.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-sm text-stone-500">Saldo Anual</span>
            <span className={`font-bold ${stats?.year.balance! >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              R$ {stats?.year.balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border border-stone-100 card-shadow">
        <h3 className="text-lg font-bold text-stone-900 mb-6">Evolução Financeira ({reportType === 'monthly' ? 'Últimos Meses' : 'Últimos Anos'})</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...balanceSheet].reverse()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#78716c', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (reportType === 'monthly') {
                    return new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'short' });
                  }
                  return value;
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#78716c', fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '14px'
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString()}`]}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="income" name="Entradas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expense" name="Saídas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 card-shadow overflow-hidden">
        <div className="p-4 border-bottom border-stone-100">
          <h3 className="font-bold text-stone-900">Detalhamento do Balancete {reportType === 'monthly' ? 'Mensal' : 'Anual'}</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Período</th>
              <th className="px-6 py-4 font-semibold">Entradas</th>
              <th className="px-6 py-4 font-semibold">Saídas</th>
              <th className="px-6 py-4 font-semibold text-right">Saldo Líquido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {balanceSheet.map(row => (
              <tr key={row.period} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-stone-900">
                  {reportType === 'monthly' 
                    ? new Date(row.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    : row.period}
                </td>
                <td className="px-6 py-4 text-sm text-emerald-600 font-medium">R$ {row.income.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-rose-600 font-medium">R$ {row.expense.toLocaleString()}</td>
                <td className={`px-6 py-4 text-sm font-bold text-right ${row.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {row.balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  const renderCashFlow = () => {
    const totalIncome = cashFlowTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = cashFlowTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const handleExport = () => {
      const exportData = cashFlowTransactions.map(tx => ({
        'Data': new Date(tx.date).toLocaleDateString('pt-BR'),
        'Tipo': tx.type === 'income' ? 'Entrada' : 'Saída',
        'Categoria': tx.category,
        'Descrição': tx.description,
        'Valor (R$)': tx.amount
      }));

      // Add summary rows
      exportData.push({} as any); // Empty row
      exportData.push({
        'Data': 'RESUMO DO PERÍODO',
        'Tipo': '',
        'Categoria': '',
        'Descrição': 'Total Entradas',
        'Valor (R$)': totalIncome
      } as any);
      exportData.push({
        'Data': '',
        'Tipo': '',
        'Categoria': '',
        'Descrição': 'Total Saídas',
        'Valor (R$)': totalExpense
      } as any);
      exportData.push({
        'Data': '',
        'Tipo': '',
        'Categoria': '',
        'Descrição': 'Saldo Líquido',
        'Valor (R$)': totalIncome - totalExpense
      } as any);

      const periodText = `Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Hoje'}`;
      exportToExcel(exportData, `Fluxo_Caixa_${filters.startDate || 'geral'}_${filters.endDate || 'hoje'}`, `RELATÓRIO DE FLUXO DE CAIXA - ${periodText}`);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-stone-900">Fluxo de Caixa Detalhado</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold"
            >
              <Download size={18} /> Exportar Excel
            </button>
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400 uppercase">De:</label>
              <input 
                type="date" 
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="text-sm bg-stone-50 border-none rounded-lg py-1 px-2 focus:ring-1 focus:ring-stone-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400 uppercase">Até:</label>
              <input 
                type="date" 
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="text-sm bg-stone-50 border-none rounded-lg py-1 px-2 focus:ring-1 focus:ring-stone-300"
              />
            </div>
            <div className="h-6 w-[1px] bg-stone-200" />
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-stone-400" />
              <select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="text-sm bg-stone-50 border-none rounded-lg py-1 px-2 focus:ring-1 focus:ring-stone-300"
              >
                <option value="all">Todas Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <ArrowUpRight size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Total Entradas</span>
            </div>
            <h3 className="text-2xl font-bold text-emerald-700">R$ {totalIncome.toLocaleString()}</h3>
          </div>
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <ArrowDownLeft size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Total Saídas</span>
            </div>
            <h3 className="text-2xl font-bold text-rose-700">R$ {totalExpense.toLocaleString()}</h3>
          </div>
          <div className="bg-stone-900 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 text-stone-400 mb-2">
              <Activity size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Saldo do Período</span>
            </div>
            <h3 className="text-2xl font-bold text-white">R$ {(totalIncome - totalExpense).toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 card-shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cashFlowTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-stone-600 font-mono">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-md">{tx.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-900 font-medium">{tx.description}</td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {cashFlowTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                    Nenhuma transação encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-100 border-r border-stone-200 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
              <Heart size={24} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 font-serif italic">Ecclesia</h1>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Membros" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
            <SidebarItem icon={Heart} label="Igrejas" active={activeTab === 'churches'} onClick={() => setActiveTab('churches')} />
            <SidebarItem icon={DollarSign} label="Financeiro" active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} />
            <SidebarItem icon={Activity} label="Fluxo de Caixa" active={activeTab === 'cashflow'} onClick={() => setActiveTab('cashflow')} />
            <SidebarItem icon={BarChart3} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            <SidebarItem icon={Calendar} label="Agenda" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
            <SidebarItem icon={Cake} label="Aniversariantes" active={activeTab === 'birthdays'} onClick={() => setActiveTab('birthdays')} />
            <SidebarItem icon={MessageSquare} label="Orações" active={activeTab === 'prayers'} onClick={() => setActiveTab('prayers')} />
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-300" />
            <div>
              <p className="text-sm font-bold text-stone-900">Pr. Luiz Israel</p>
              <p className="text-xs text-stone-500">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg lg:hidden">
            <Menu size={24} />
          </button>
          
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar em toda a plataforma..." 
                className="w-full bg-stone-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-stone-200 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              <Users size={20} />
            </button>
            <div className="h-8 w-[1px] bg-stone-200 mx-2" />
            <p className="text-sm font-medium text-stone-600 hidden sm:block">3 de Março, 2026</p>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'members' && renderMembers()}
              {activeTab === 'churches' && renderChurches()}
              {activeTab === 'finances' && renderFinances()}
              {activeTab === 'cashflow' && renderCashFlow()}
              {activeTab === 'reports' && renderReports()}
              {activeTab === 'prayers' && renderPrayers()}
              {activeTab === 'events' && renderEvents()}
              {activeTab === 'birthdays' && renderBirthdays()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
