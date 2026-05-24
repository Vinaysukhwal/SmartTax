import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register } = useAuth();
  
  // Decide active tab based on path
  const isLoginPath = location.pathname === '/login';
  const [activeTab, setActiveTab] = useState(isLoginPath ? 'login' : 'register');
  
  // Auto redirect to /dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  
  // Update state when path changes
  useEffect(() => {
    setActiveTab(location.pathname === '/login' ? 'login' : 'register');
  }, [location.pathname]);

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    pan: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef(null);

  // Mouse tracking gradient effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, [activeTab]);

  // Handle Tab Switch
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'login' ? '/login' : '/register');
  };

  // Form value handlers
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: name === 'pan' ? value.toUpperCase() : value,
    });
  };

  // Validators
  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please verify credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isValidPAN(registerData.pan)) {
      toast.error('Invalid PAN format. Example: ABCDE1234F');
      return;
    }

    setIsLoading(true);
    try {
      await register(registerData.name, registerData.email, registerData.password, registerData.pan);
      toast.success('Account created successfully! 🎉');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] bg-[#15121b] text-[#e8dfee] font-sans">
      {/* Left Side: Visual & Trust */}
      <section className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-[#100d16] relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7c3aed]/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#6f00be]/10 blur-[150px] rounded-full"></div>

        {/* Header Branding */}
        <div className="z-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg shadow-[#7c3aed]/25">
            <span className="text-white font-bold text-sm">ST</span>
          </div>
          <span className="font-extrabold text-xl text-[#e8dfee] tracking-tight">SmartTax</span>
        </div>

        {/* Hero Image Section */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 px-12 text-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#7c3aed]/20 blur-[60px] rounded-full scale-90 group-hover:scale-110 transition-transform duration-1000"></div>
            <img
              alt="Futuristic Glass Tax Documents"
              className="relative w-full max-w-sm object-contain drop-shadow-[0_20px_50px_rgba(124,58,237,0.3)] animate-float"
              src="https://lh3.googleusercontent.com/aida/ADBb0ujER9lJH887eupa0rl6KzbkpZids4-ysiBI6jcwOfKYEjYyOs1DX5279bKFSPrPz2wagL_HNQMAkFT_96CIs8OiI4YpAVQ9G7lAotpJAnZsSyVgR6QnXAxWAte9ybcCBclgbszZWh_4RAGl9em3Ij7sBzbxzIiD8tkG9IpPYHvI45WwyISWBFVU63c93yxCK2PnolYP0VrthVkAU9lu9FJxsQTUzuFlF9Ikdetmr-WmKNWIeRVXggVekHA"
            />
          </div>
          <h2 className="mt-12 text-3xl font-extrabold text-[#e8dfee]">Modernizing Financial Compliance</h2>
          <p className="mt-4 text-[#ccc3d8] text-base max-w-sm leading-relaxed">
            Experience the next generation of tax filing with real-time analytics and intelligent automation.
          </p>
        </div>

        {/* Trust Metrics */}
        <div className="z-10 flex items-center justify-center gap-12 py-6 bg-[#221e28]/30 backdrop-blur-sm rounded-2xl border border-[#4a4455]/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#d2bbff] text-3xl">verified_user</span>
            <div className="text-left">
              <p className="font-extrabold text-[#d2bbff] text-lg leading-none">1M+</p>
              <p className="text-xs text-[#ccc3d8]">Trusted Taxpayers</p>
            </div>
          </div>
          <div className="w-px h-10 bg-[#4a4455]/30"></div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#d2bbff] text-3xl">lock</span>
            <div className="text-left">
              <p className="font-extrabold text-[#d2bbff] text-lg leading-none">AES-256</p>
              <p className="text-xs text-[#ccc3d8]">Secure & Encrypted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Auth Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#15121b] relative">
        <div className="w-full max-w-[460px]">
          <div
            ref={cardRef}
            className="glass-card rounded-[2rem] p-8 sm:p-10 relative overflow-hidden glass-border-gradient shadow-2xl"
          >
            {/* Tabs */}
            <div className="relative flex bg-[#221e28]/50 rounded-xl p-1 mb-8">
              <div
                className={`absolute h-[calc(100%-8px)] top-1 w-[50%] bg-[#7c3aed] rounded-lg tab-transition shadow-lg shadow-[#7c3aed]/20`}
                style={{
                  transform: activeTab === 'login' ? 'translateX(0%)' : 'translateX(100%)',
                }}
              ></div>
              <button
                className={`relative z-10 w-1/2 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                  activeTab === 'login' ? 'text-white' : 'text-[#ccc3d8]'
                }`}
                onClick={() => handleTabSwitch('login')}
              >
                Login
              </button>
              <button
                className={`relative z-10 w-1/2 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                  activeTab === 'register' ? 'text-white' : 'text-[#ccc3d8]'
                }`}
                onClick={() => handleTabSwitch('register')}
              >
                Register
              </button>
            </div>

            {/* Forms Container */}
            <div className="relative">
              {/* Login Form */}
              {activeTab === 'login' && (
                <div className="w-full animate-fadeIn">
                  <h3 className="text-2xl font-bold text-[#e8dfee] mb-1">Welcome Back</h3>
                  <p className="text-sm text-[#ccc3d8] mb-8">Access your financial dashboard</p>
                  
                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Email Address</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">mail</span>
                        <input
                          name="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          required
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3.5 pl-12 pr-4 text-[#e8dfee] placeholder:text-[#958da1] accent-glow transition-all duration-300"
                          placeholder="name@company.com"
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="block text-xs font-semibold text-[#ccc3d8]">Password</label>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">lock</span>
                        <input
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          required
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3.5 pl-12 pr-12 text-[#e8dfee] placeholder:text-[#958da1] accent-glow transition-all duration-300"
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#958da1] hover:text-[#d2bbff] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#7c3aed] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7c3aed]/30 hover:brightness-125 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Register Form */}
              {activeTab === 'register' && (
                <div className="w-full animate-fadeIn">
                  <h3 className="text-2xl font-bold text-[#e8dfee] mb-1">Join SmartTax</h3>
                  <p className="text-sm text-[#ccc3d8] mb-8">Start your journey to precision filing</p>
                  
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Full Name</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">person</span>
                        <input
                          name="name"
                          value={registerData.name}
                          onChange={handleRegisterChange}
                          required
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3 pl-12 pr-4 text-[#e8dfee] placeholder:text-[#958da1] accent-glow transition-all duration-300 text-sm"
                          placeholder="Rahul Sharma"
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Email Address</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">mail</span>
                        <input
                          name="email"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          required
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3 pl-12 pr-4 text-[#e8dfee] placeholder:text-[#958da1] accent-glow transition-all duration-300 text-sm"
                          placeholder="name@company.com"
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">PAN Number</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">badge</span>
                        <input
                          name="pan"
                          value={registerData.pan}
                          onChange={handleRegisterChange}
                          required
                          maxLength={10}
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3 pl-12 pr-4 text-[#e8dfee] placeholder:text-[#958da1] uppercase accent-glow transition-all duration-300 text-sm"
                          placeholder="ABCDE1234F"
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">lock</span>
                        <input
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          required
                          minLength={6}
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3 pl-12 pr-12 text-[#e8dfee] placeholder:text-[#958da1] accent-glow transition-all duration-300 text-sm"
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#958da1] hover:text-[#d2bbff] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Confirm Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1]">lock</span>
                        <input
                          name="confirmPassword"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          required
                          minLength={6}
                          className="w-full bg-[#100d16]/50 border border-[#4a4455]/30 rounded-xl py-3 pl-12 pr-12 text-[#e8dfee] placeholder:text-[#958da1] accent-glow transition-all duration-300 text-sm"
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#958da1] hover:text-[#d2bbff] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#7c3aed] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#7c3aed]/30 hover:brightness-125 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center text-sm"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#4a4455]/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#15121b] px-4 text-[#ccc3d8] font-semibold">Or continue with</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => toast.success('Google Login is simulated in development')}
                className="flex items-center justify-center gap-2 bg-[#221e28] hover:bg-[#3c3742] border border-[#4a4455]/30 py-3 rounded-xl transition-all duration-300 group text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span className="font-semibold text-[#e8dfee]">Google</span>
              </button>
              
              <button
                type="button"
                onClick={() => toast.success('Apple Login is simulated in development')}
                className="flex items-center justify-center gap-2 bg-[#221e28] hover:bg-[#3c3742] border border-[#4a4455]/30 py-3 rounded-xl transition-all duration-300 group text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.75.8.01 2.01-.84 3.41-.69 1.58.17 2.72.76 3.41 1.76-3.14 1.88-2.63 6.34.46 7.6-.68 1.73-1.61 3.51-2.36 4.55zM12.03 7.25c-.02-2.13 1.74-3.95 3.75-4.25.26 2.44-2.12 4.41-3.75 4.25z"></path>
                </svg>
                <span className="font-semibold text-[#e8dfee]">Apple</span>
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-[#ccc3d8]/60">
              By continuing, you agree to SmartTax's{' '}
              <a className="text-[#d2bbff] hover:underline" href="#">
                Terms of Service
              </a>{' '}
              and{' '}
              <a className="text-[#d2bbff] hover:underline" href="#">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
