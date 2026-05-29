import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import toast from 'react-hot-toast';
import { HiOutlineChevronRight } from 'react-icons/hi';

// Simple easing CountUp Component
const CountUp = ({ end, duration = 1500, prefix = '₹' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing: easeOutExpo
      const easeValue = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeValue * end);
      setCount(current);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString('en-IN')}</span>;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [filing, setFiling] = useState(null);
  const [notices, setNotices] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [filingRes, noticesRes, deductionsRes, documentsRes] = await Promise.allSettled([
          API.get(`/itr/get/${user.id}`),
          API.get('/notices'),
          API.get('/deductions?fy=2025-26'),
          API.get('/documents/list'),
        ]);

        if (filingRes.status === 'fulfilled') setFiling(filingRes.value.data);
        if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value.data);
        if (deductionsRes.status === 'fulfilled') setDeductions(deductionsRes.value.data);
        if (documentsRes.status === 'fulfilled') setDocuments(documentsRes.value.data);
      } catch (error) {
        console.error('Dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchDashboardData();
  }, [user]);

  // Derived variables
  const grossSalary = filing?.formData?.salary || filing?.formData?.grossIncome || 0;
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const taxableIncome = Math.max(0, grossSalary - totalDeductions);
  const taxPayable = filing?.formData?.taxPayable || 0;

  const pendingNotices = notices.filter((n) => n.status === 'Pending');

  // Hardcoded premium deadlines list
  const deadlines = [
    { title: 'ITR Filing Due Date', date: 'July 31, 2026', type: 'Critical', bg: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { title: 'Advance Tax Q1 (15%)', date: 'June 15, 2026', type: 'Upcoming', bg: 'bg-[#7c3aed]/10 text-[#d2bbff] border-[#7c3aed]/20' },
    { title: 'Form 16 Upload Deadline', date: 'June 15, 2026', type: 'Standard', bg: 'bg-[#221e28] text-[#ccc3d8] border-[#4a4455]/20' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-[#0f0f0f] text-[#e8dfee]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e8dfee] bg-[#0f0f0f] flex font-sans">
      {/* SideNavBar */}
      <aside className="hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#100d16] border-r border-[#4a4455]/20 flex-col py-6 z-30 overflow-y-auto">
        <nav className="flex-grow space-y-2 px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-[#d2bbff] font-bold border-r-2 border-[#7c3aed] bg-[#7c3aed]/5 transition-all duration-200"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link
            to="/file-itr"
            className="flex items-center gap-3 px-4 py-3 text-[#ccc3d8] font-semibold hover:bg-[#221e28]/50 hover:text-[#d2bbff] transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined">description</span>
            <span className="text-sm">Filing</span>
          </Link>
          <Link
            to="/smart-dashboard"
            className="flex items-center gap-3 px-4 py-3 text-[#ccc3d8] font-semibold hover:bg-[#221e28]/50 hover:text-[#d2bbff] transition-all duration-200 rounded-lg group"
          >
            <span className="material-symbols-outlined text-[#d2bbff] group-hover:animate-pulse">magic_button</span>
            <span className="text-sm">Smart Auto-Fill</span>
          </Link>
          <Link
            to="/documents"
            className="flex items-center gap-3 px-4 py-3 text-[#ccc3d8] font-semibold hover:bg-[#221e28]/50 hover:text-[#d2bbff] transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined">folder_open</span>
            <span className="text-sm">Documents</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 text-[#ccc3d8] font-semibold hover:bg-[#221e28]/50 hover:text-[#d2bbff] transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-sm">Profile</span>
          </Link>
        </nav>
        <div className="px-6 mt-auto">
          <Link
            to="/file-itr"
            className="w-full py-4 bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/25 hover:brightness-110 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Filing
          </Link>
        </div>
      </aside>

      {/* Main Wrapper */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Top bar controls */}
        <header className="sticky top-16 h-16 px-8 flex justify-between items-center backdrop-blur-md bg-[#15121b]/30 z-20 border-b border-[#4a4455]/10">
          <div className="flex items-center w-1/2">
            <h2 className="font-extrabold text-xl text-[#e8dfee]">Overview</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/notices"
              className="hover:text-[#d2bbff] hover:bg-white/5 rounded-full p-2 transition-all relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {pendingNotices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
            <Link
              to="/profile"
              className="hover:text-[#d2bbff] hover:bg-white/5 rounded-full p-2 transition-all"
            >
              <span className="material-symbols-outlined">settings</span>
            </Link>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          {/* Welcome Alert */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#221e28]/40 border border-[#4a4455]/20 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[#7c3aed]/5 blur-[60px] rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold text-[#e8dfee]">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
              <p className="text-sm text-[#ccc3d8] mt-1">Here's your tax filing overview for FY 2025-26 (AY 2026-27)</p>
            </div>
            {pendingNotices.length > 0 && (
              <Link
                to="/notices"
                className="z-10 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all duration-300"
              >
                You have {pendingNotices.length} pending notice{pendingNotices.length > 1 ? 's' : ''}
              </Link>
            )}
          </div>

          {/* Smart Auto-Fill Promo Banner */}
          <Link
            to="/smart-dashboard"
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#7c3aed]/90 to-[#ddb7ff]/70 p-6 rounded-3xl relative overflow-hidden group shadow-lg shadow-[#7c3aed]/10 hover:brightness-110 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl flex-shrink-0">
                <span className="material-symbols-outlined animate-pulse">magic_button</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">NEW: Smart Auto-Fill via Document Scan</h3>
                <p className="text-xs text-white/95 mt-0.5">Upload Form 16, 26AS, AIS, or Interest Certificates to pre-fill ITR in seconds!</p>
              </div>
            </div>
            <div className="relative z-10 bg-white text-[#7c3aed] font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md group-hover:translate-x-1 transition-transform">
              <span>Try Smart Auto-Fill</span>
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Hero Stats Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat Card 1 */}
            <div className="glass-card stat-card-pulse p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#7c3aed] to-[#ddb7ff]"></div>
              <p className="text-[#ccc3d8] text-xs font-semibold uppercase tracking-wider mb-2">Gross Salary</p>
              <h2 className="text-2xl font-extrabold text-white">
                <CountUp end={grossSalary} />
              </h2>
              <div className="mt-4 flex items-center text-emerald-400 text-xs font-bold gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>Active Income</span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="glass-card stat-card-pulse p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#6f00be]"></div>
              <p className="text-[#ccc3d8] text-xs font-semibold uppercase tracking-wider mb-2">Deductions</p>
              <h2 className="text-2xl font-extrabold text-white">
                <CountUp end={totalDeductions} />
              </h2>
              <div className="mt-4 flex items-center text-[#d2bbff] text-xs font-bold gap-1">
                <span className="material-symbols-outlined text-sm">shield</span>
                <span>Section 80C Optimized</span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="glass-card stat-card-pulse p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#37333e]"></div>
              <p className="text-[#ccc3d8] text-xs font-semibold uppercase tracking-wider mb-2">Taxable Income</p>
              <h2 className="text-2xl font-extrabold text-white">
                <CountUp end={taxableIncome} />
              </h2>
              <div className="mt-4 w-full bg-[#221e28] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] rounded-full"
                  style={{ width: `${grossSalary > 0 ? Math.min(100, (taxableIncome / grossSalary) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="glass-card stat-card-pulse p-6 rounded-3xl border-[#7c3aed]/30 glow-purple relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#7c3aed]/10 blur-3xl rounded-full"></div>
              <p className="text-[#d2bbff] text-xs font-bold uppercase tracking-wider mb-2">Tax Payable</p>
              <h2 className="text-2xl font-extrabold text-white">
                <CountUp end={taxPayable} />
              </h2>
              <p className="mt-4 text-xs text-[#ccc3d8]/80 italic">Calculated under chosen regime</p>
            </div>
          </section>

          {/* Bento Grid Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Deadlines Widget */}
            <div className="lg:col-span-5 glass-card rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-[#e8dfee]">Deadlines</h3>
                  <span className="material-symbols-outlined text-[#d2bbff]">calendar_month</span>
                </div>
                <div className="space-y-6">
                  {deadlines.map((dl, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-bold ${dl.bg}`}>
                        {dl.date.split(' ')[1].replace(',', '')}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-[#e8dfee]">{dl.title}</p>
                        <p className="text-xs text-[#ccc3d8]">{dl.date}</p>
                      </div>
                      <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${dl.bg}`}>
                        {dl.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Visual */}
            <div className="lg:col-span-7 space-y-6">
              {/* Savings Advice visual */}
              <div className="glass-card rounded-3xl p-8 relative overflow-hidden min-h-[200px] flex flex-col justify-center border border-[#7c3aed]/20">
                <div className="absolute right-0 top-0 w-1/2 h-full z-0 opacity-40 mix-blend-screen pointer-events-none">
                  <img
                    alt="Data Visual"
                    className="w-full h-full object-cover mask-gradient-left"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAibvlQ_PV3r-fDTmPUy6wY2WERhXQOGirq8t6hqrVF1A7TYwpMK9l1H9W3Nq-LikZVYKirWYVPsa1CQGKwHFkOf3Z1qzR-uKIK1DbWC7S2E6sgjnDhBTmd8zHzpcMzXDpznbAxmw8xvntUUoM-3zeHxNbL_4NzPcSWuiLeaZhpGQ8pSlyC19TRxPdjF2ukZOS1jOWSQSvn-TOTEtDTjkPLFgkJIOrW3K1kr9lWbe4o6H0zVmizrFVpgAktPmR6f1Hu8yX4s0cJ0jU"
                  />
                  <style>{`
                    .mask-gradient-left {
                      mask-image: linear-gradient(to left, black 40%, transparent 100%);
                      -webkit-mask-image: linear-gradient(to left, black 40%, transparent 100%);
                    }
                  `}</style>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-[#e8dfee] mb-2">Optimize Your Savings</h3>
                  <p className="text-sm text-[#ccc3d8] max-w-sm mb-6">
                    Our analyzer compares old & new regimes dynamically based on your loaded deductions to maximize tax rebates.
                  </p>
                  <Link
                    to="/calculators"
                    className="inline-block px-6 py-2 border border-[#7c3aed] text-[#d2bbff] rounded-full font-bold hover:bg-[#7c3aed] hover:text-white transition-all active:scale-95 text-sm"
                  >
                    Compare Regimes
                  </Link>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-4">
                <Link
                  to="/file-itr"
                  className="glass-card p-6 rounded-3xl flex flex-col items-center gap-3 hover:scale-[1.03] active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#d2bbff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <span className="text-xs font-bold text-[#e8dfee]">Start Filing</span>
                </Link>
                <Link
                  to="/documents"
                  className="glass-card p-6 rounded-3xl flex flex-col items-center gap-3 hover:scale-[1.03] active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#221e28] flex items-center justify-center text-[#d2bbff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <span className="text-xs font-bold text-[#e8dfee]">Upload Docs</span>
                </Link>
                <Link
                  to="/deductions"
                  className="glass-card p-6 rounded-3xl flex flex-col items-center gap-3 hover:scale-[1.03] active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#221e28] flex items-center justify-center text-[#d2bbff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <span className="text-xs font-bold text-[#e8dfee]">Deductions</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Bottom Table: Recent Documents */}
          <section className="glass-card rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#e8dfee]">Recent Documents</h3>
              <Link to="/documents" className="text-[#d2bbff] font-bold text-sm hover:underline">
                View Vault
              </Link>
            </div>
            
            {documents.length > 0 ? (
              <div className="space-y-1">
                {documents.slice(0, 3).map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-[#ccc3d8]">picture_as_pdf</span>
                      <div>
                        <p className="text-sm font-semibold text-[#e8dfee]">{doc.fileName}</p>
                        <p className="text-xs text-[#ccc3d8]/70">
                          Size: {(doc.fileSize / 1024).toFixed(1)} KB | Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#ccc3d8] cursor-pointer hover:text-[#d2bbff]">
                      more_vert
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#ccc3d8] italic text-center py-4">No documents uploaded yet in your vault.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
