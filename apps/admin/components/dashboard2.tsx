import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Activity, 
  Users, 
  Settings, 
  Zap, 
  Target, 
  TrendingUp, 
  Megaphone,
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  MoreVertical,
  Calendar,
  MessageSquare,
  Paperclip,
  User
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Data ---

const NEW_CUSTOMERS_DATA = [
  { day: 'Mon', value: 8, type: 'solid' },
  { day: 'Tue', value: 12, type: 'solid' },
  { day: 'Wed', value: 10, type: 'solid' },
  { day: 'Thu', value: 4, type: 'solid' },
  { day: 'Fri', value: 11, type: 'solid' },
];

const KANBAN_DATA = {
  Contacted: [
    { id: 1, title: 'ByteBridge', description: 'Corporate and personal data protection on a turnkey basis', date: '18 Apr', comments: 2, attachments: 1 },
    { id: 2, title: 'AI Synergy', description: 'Innovative solutions based on artificial intelligence', date: '21 Mar', comments: 1, attachments: 3 },
    { id: 3, title: 'LeadBoost Agency', description: 'Lead attraction and automation for small busines...', date: 'No due date', comments: 4, attachments: 7 },
  ],
  Negotiation: [
    { id: 4, title: 'SkillUp Hub', description: 'Platform for professional development of specialists', date: '09 Mar', comments: 4, attachments: 1 },
    { id: 5, title: 'Thera Well', description: 'Platform for psychological support and consultations', date: 'No due date', comments: 7, attachments: 2 },
    { id: 6, title: 'SwiftCargo', description: 'International transportation of chemical goods', date: '23 Apr', comments: 2, attachments: 5 },
  ],
  'Offer Sent': [
    { id: 7, title: 'FitLife Nutrition', description: 'Nutritious food and nutraceuticals for individuals', date: '10 Mar', comments: 1, attachments: 3 },
    { id: 8, title: 'Prime Estate', description: 'Agency-developer of low-rise elite and commercial real estate', date: '16 Apr', comments: 1, attachments: 1, highlighted: true, address: '540 Realty Blvd, Miami, FL 33132', email: 'contact@primeestate.com', manager: 'Antony Cardenas' },
    { id: 9, title: 'NextGen University', description: 'Modern education platform for digital skills', date: '05 May', comments: 3, attachments: 2 },
  ],
  'Deal Closed': [
    { id: 10, title: 'CloudSphere', description: 'Cloud services for data storage and processing for le...', date: '24 Mar', comments: 2, attachments: 1 },
    { id: 11, title: 'Advantage Medi', description: 'Full cycle of digital advertising and social media promotion', date: '05 Apr', comments: 1, attachments: 3 },
    { id: 12, title: 'Safebank Solutions', description: 'Innovative financial technologies and digital pay...', date: '30 Mar', comments: 4, attachments: 7 },
  ],
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, badge, active }: { icon: any, label: string, badge?: string | number, active?: boolean }) => (
  <div className={cn(
    "flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors group",
    active ? "bg-gray-100 text-black" : "text-gray-500 hover:bg-gray-50 hover:text-black"
  )}>
    <div className="flex items-center gap-3">
      <Icon size={20} className={cn(active ? "text-black" : "text-gray-400 group-hover:text-black")} />
      <span className="font-medium text-[15px]">{label}</span>
    </div>
    {badge && (
      <span className="text-[11px] font-semibold text-gray-400">{badge}</span>
    )}
  </div>
);

const MemberItem = ({ name, role, avatar, status }: { name: string, role: string, avatar: string, status?: 'online' | 'offline' }) => (
  <div className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
    <div className="relative">
      <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
      {status === 'online' && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-[14px] font-semibold text-gray-900 leading-tight">{name}</span>
      <span className="text-[12px] text-gray-400">{role}</span>
    </div>
  </div>
);

const KanbanCard = ({ data }: { data: any; key?: React.Key }) => {
  if (data.highlighted) {
    return (
      <div className="bg-[#1A1A1A] text-white p-6 rounded-[32px] shadow-xl mb-6 relative group cursor-pointer border border-white/5">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-bold text-[18px] tracking-tight">{data.title}</h4>
          <button className="text-gray-500 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
        <p className="text-gray-400 text-[14px] mb-6 leading-relaxed font-medium">{data.description}</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
            <div className="w-5 h-5 flex items-center justify-center">
              <Target size={16} />
            </div>
            <span>{data.address}</span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
            <div className="w-5 h-5 flex items-center justify-center">
              <Megaphone size={16} />
            </div>
            <span>{data.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 pt-6 border-t border-white/10">
          <img src="https://picsum.photos/seed/antony/40/40" className="w-10 h-10 rounded-full border border-white/10" alt="Manager" referrerPolicy="no-referrer" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.15em]">Manager</span>
            <span className="text-[14px] font-bold">{data.manager}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-gray-300 border border-white/5">
            <Calendar size={14} />
            <span>{data.date}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-1.5 text-[12px] font-bold">
              <MessageSquare size={14} />
              <span>{data.comments}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-bold">
              <Paperclip size={14} />
              <span>{data.attachments}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm mb-6 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-gray-900 text-[18px] tracking-tight">{data.title}</h4>
        <button className="text-gray-300 hover:text-gray-600 transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
      <p className="text-gray-500 text-[14px] mb-6 leading-relaxed font-medium">{data.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl text-[12px] font-bold text-gray-500 border border-gray-100">
          <Calendar size={14} />
          <span>{data.date}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-1.5 text-[12px] font-bold">
            <MessageSquare size={14} />
            <span>{data.comments}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold">
            <Paperclip size={14} />
            <span>{data.attachments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Gauge = ({ percentage }: { percentage: number }) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full pt-4">
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Semi-circle background */}
        <div className="absolute top-0 left-0 w-48 h-48 border-[14px] border-gray-100 rounded-full" />
        {/* Semi-circle progress */}
        <div 
          className="absolute top-0 left-0 w-48 h-48 border-[14px] border-black rounded-full transition-all duration-1000"
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `rotate(${(percentage / 100) * 180 - 180}deg)`,
            transformOrigin: 'center center'
          }}
        />
        {/* Tick marks (simplified) */}
        <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-gray-200 origin-[center_96px]"
              style={{ transform: `translateX(-50%) rotate(${i * 9 - 90}deg)` }}
            />
          ))}
        </div>
      </div>
      <div className="text-center mt-[-20px]">
        <span className="text-5xl font-bold text-gray-900">{percentage}%</span>
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-2">Successful deals</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* SVG Pattern Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="4" fill="#E5E7EB" />
          </pattern>
        </defs>
      </svg>

      {/* Sidebar */}
      <aside className="w-[300px] bg-white flex flex-col p-8 overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-14 px-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 border-[3px] border-white rounded-md rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BizLink</h1>
        </div>

        <nav className="space-y-3 mb-14">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem icon={CheckSquare} label="Tasks" badge="2" />
          <SidebarItem icon={Activity} label="Activity" />
          <SidebarItem icon={Users} label="Customers" active />
          <SidebarItem icon={Settings} label="Settings" />
        </nav>

        <div className="mb-14">
          <h3 className="px-4 text-[12px] font-bold text-gray-300 uppercase tracking-[0.25em] mb-8">Projects</h3>
          <div className="space-y-3">
            <SidebarItem icon={Zap} label="BizConnect" badge="7" />
            <SidebarItem icon={TrendingUp} label="Growth Hub" />
            <SidebarItem icon={Target} label="Conversion Path" />
            <SidebarItem icon={Megaphone} label="Marketing" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between px-4 mb-8">
            <h3 className="text-[12px] font-bold text-gray-300 uppercase tracking-[0.25em]">Members</h3>
            <button className="text-gray-300 hover:text-black transition-colors">
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-3">
            <MemberItem name="Sandra Perry" role="Product Manager" avatar="https://picsum.photos/seed/sandra/64/64" status="online" />
            <MemberItem name="Antony Cardenas" role="Sales Manager" avatar="https://picsum.photos/seed/antony/64/64" status="online" />
            <MemberItem name="Jamal Connolly" role="Growth Marketer" avatar="https://picsum.photos/seed/jamal/64/64" status="online" />
            <MemberItem name="Cara Carr" role="SEO Specialist" avatar="https://picsum.photos/seed/cara/64/64" status="online" />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 mt-8">
          <MemberItem name="Iona Rollins" role="Account" avatar="https://picsum.photos/seed/iona/64/64" />
          <button className="flex items-center gap-4 px-4 py-4 text-gray-400 hover:text-black transition-colors w-full mt-4">
            <LogOut size={24} />
            <span className="font-bold text-[17px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F9F9F7]">
        {/* Top Bar */}
        <header className="h-[120px] flex items-center justify-between px-12 shrink-0">
          <div className="flex items-center gap-5 w-[500px]">
            <Search size={24} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customer..." 
              className="bg-transparent border-none outline-none text-[18px] w-full placeholder:text-gray-400 font-bold"
            />
          </div>

          <div className="flex items-center gap-10">
            <button className="flex items-center gap-2.5 text-[16px] font-bold text-gray-500 hover:text-black transition-colors">
              <SlidersHorizontal size={22} />
              <span>Sort by</span>
            </button>
            <button className="flex items-center gap-2.5 text-[16px] font-bold text-gray-500 hover:text-black transition-colors">
              <SlidersHorizontal size={22} />
              <span>Filters</span>
            </button>
            <button className="flex items-center gap-2.5 text-[16px] font-bold text-gray-500 hover:text-black transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={20} />
              </div>
              <span>Me</span>
              <ChevronDown size={20} />
            </button>
            <button className="bg-[#1A1A1A] text-white px-8 py-4 rounded-[20px] font-bold text-[16px] flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-black/10">
              <Plus size={22} />
              <span>Add customer</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto px-12 pb-12">
          {/* Stats Section */}
          <div className="grid grid-cols-12 gap-10 mb-14">
            {/* New Customers Chart */}
            <div className="col-span-4 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50">
              <h3 className="text-2xl font-bold mb-10">New customers</h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={NEW_CUSTOMERS_DATA} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 14, fontWeight: 700, fill: '#1A1A1A' }} 
                      dy={20}
                    />
                    <YAxis hide />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={36}>
                      {NEW_CUSTOMERS_DATA.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index % 2 === 0 ? '#1A1A1A' : 'url(#hatch)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gauge */}
            <div className="col-span-3 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50 flex items-center justify-center">
              <Gauge percentage={68} />
            </div>

            {/* Tasks Progress */}
            <div className="col-span-2 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50 flex flex-col justify-between">
              <div>
                <span className="text-6xl font-bold">53</span>
                <p className="text-[16px] font-bold text-gray-400 mt-5 leading-tight">Tasks <br /> in progress</p>
              </div>
              <div className="flex justify-end">
                <div className="w-14 h-14 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer transition-all hover:bg-gray-50">
                  <ArrowRight size={28} />
                </div>
              </div>
            </div>

            {/* Prepayments */}
            <div className="col-span-3 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50 flex flex-col justify-between">
              <div>
                <span className="text-6xl font-bold">$ 15.890</span>
                <p className="text-[16px] font-bold text-gray-400 mt-5 leading-tight">Prepayments <br /> from customers</p>
              </div>
              <div className="flex justify-end">
                <div className="w-14 h-14 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer transition-all hover:bg-gray-50">
                  <ArrowRight size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-4 gap-10">
            {Object.entries(KANBAN_DATA).map(([column, cards]) => (
              <div key={column} className="flex flex-col">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-2xl font-bold tracking-tight">{column}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-300">{cards.length}</span>
                    <button className="text-gray-300 hover:text-black transition-colors">
                      <SlidersHorizontal size={20} className="rotate-90" />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  {cards.map((card) => (
                    <KanbanCard key={card.id} data={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
