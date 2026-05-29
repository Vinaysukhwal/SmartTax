import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineCalculator,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineFolder,
  HiOutlineBell,
  HiOutlineCurrencyRupee,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Logged-in links
  const authLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/file-itr', label: 'File ITR', icon: HiOutlineDocumentText },
    { path: '/calculators', label: 'Calculators', icon: HiOutlineCalculator },
    { path: '/deductions', label: 'Deductions', icon: HiOutlineShieldCheck },
    { path: '/documents', label: 'Documents', icon: HiOutlineFolder },
    { path: '/notices', label: 'Notices', icon: HiOutlineBell },
    { path: '/challan', label: 'Challan', icon: HiOutlineCurrencyRupee },
    { path: '/chatbot', label: 'Chatbot', icon: HiOutlineChatAlt2 },
  ];

  return (
    <nav className="bg-[#15121b]/60 backdrop-blur-md border-b border-[#4a4455]/20 shadow-[0_0_15px_rgba(210,187,255,0.05)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 flex-shrink-0">
            <img src="/logo.png" alt="SmartTax" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-xl font-extrabold text-[#e8dfee] tracking-tight">
              Smart<span className="text-[#d2bbff]">Tax</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 flex-shrink-0">
            {user ? (
              <>
                {authLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-1 px-1.5 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-all duration-200 border ${
                      isActive(path)
                        ? 'bg-[#7c3aed]/10 text-[#d2bbff] border-[#7c3aed]/20'
                        : 'text-[#ccc3d8] hover:text-[#e8dfee] hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 hidden xl:block" />
                    <span>{label}</span>
                  </Link>
                ))}

                {/* Profile & Logout */}
                <div className="flex items-center space-x-1 xl:space-x-2 ml-2 xl:ml-4 pl-2 xl:pl-4 border-l border-[#4a4455]/30">
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-1 px-1.5 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-all duration-200 border ${
                      isActive('/profile')
                        ? 'bg-[#7c3aed]/10 text-[#d2bbff] border-[#7c3aed]/20'
                        : 'text-[#ccc3d8] hover:text-[#e8dfee] border-transparent'
                    }`}
                  >
                    <HiOutlineUser className="w-4 h-4 hidden xl:block" />
                    <span>{user.name?.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-1.5 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                  >
                    <HiOutlineLogout className="w-4 h-4 hidden xl:block" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/calculators"
                  className="text-[#ccc3d8] hover:text-[#e8dfee] px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Calculators
                </Link>
                <Link
                  to="/login"
                  className="text-[#ccc3d8] hover:text-[#e8dfee] px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border border-[#7c3aed] accent-glow active:scale-95 duration-200"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#ccc3d8] hover:bg-white/5"
          >
            {isMobileMenuOpen ? (
              <HiOutlineX className="w-6 h-6" />
            ) : (
              <HiOutlineMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden py-4 border-t border-[#4a4455]/20 bg-[#15121b] px-4 animate-fadeIn">
          {user ? (
            <div className="space-y-1">
              {authLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all border ${
                    isActive(path)
                      ? 'bg-[#7c3aed]/10 text-[#d2bbff] border-[#7c3aed]/20'
                      : 'text-[#ccc3d8] hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <hr className="my-2 border-[#4a4455]/20" />
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold text-[#ccc3d8] hover:bg-white/5"
              >
                <HiOutlineUser className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 w-full text-left"
              >
                <HiOutlineLogout className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                to="/calculators"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-semibold text-[#ccc3d8] hover:bg-white/5"
              >
                Calculators
              </Link>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-semibold text-[#ccc3d8] hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-semibold text-center bg-[#7c3aed] text-white rounded-lg mt-2"
              >
                Start Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
