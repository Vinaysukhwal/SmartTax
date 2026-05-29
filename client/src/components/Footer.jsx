import { Link, useLocation } from 'react-router-dom';
import {
  FaGithub,
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaHeart,
  FaCode,
  FaCoffee,
} from 'react-icons/fa';
import { HiOutlineMail, HiOutlineExternalLink } from 'react-icons/hi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard';

  const socialLinks = [
    {
      name: 'GitHub',
      icon: FaGithub,
      url: 'https://github.com/Vinaysukhwal',
      color: '#ffffff',
      hoverBg: 'hover:bg-[#333]/80',
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedinIn,
      url: 'https://www.linkedin.com/in/vinaysukhwal1111',
      color: '#0a66c2',
      hoverBg: 'hover:bg-[#0a66c2]/20',
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://www.instagram.com/vinaysukhwal_',
      color: '#e1306c',
      hoverBg: 'hover:bg-[#e1306c]/20',
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: 'https://wa.me/918764113263',
      color: '#25d366',
      hoverBg: 'hover:bg-[#25d366]/20',
    },
    {
      name: 'Email',
      icon: HiOutlineMail,
      url: 'mailto:sukhwal.vinay11@gmail.com',
      color: '#d2bbff',
      hoverBg: 'hover:bg-[#d2bbff]/20',
    },
  ];

  return (
    <footer className={`bg-[#100d16] text-[#ccc3d8] border-t border-[#4a4455]/20 mt-auto relative overflow-hidden transition-all duration-300 ${isDashboard ? 'md:ml-64' : ''}`}>
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#7c3aed]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-[#6f00be]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ─── Main Footer Content ─── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* ─── About the Developer Card ─── */}
          <div className="lg:col-span-5">
            <div className="bg-[#1a1625]/60 backdrop-blur-md rounded-2xl border border-[#4a4455]/20 p-6 sm:p-8 shadow-xl shadow-[#7c3aed]/5 group hover:border-[#7c3aed]/30 transition-all duration-500">
              {/* Developer Profile Header */}
              <div className="flex items-center gap-5 mb-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] p-[2px] shadow-lg shadow-[#7c3aed]/30 group-hover:shadow-[#7c3aed]/50 transition-shadow duration-500">
                    <img
                      src="/vinay.jpg"
                      alt="Vinay Sukhwal"
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                  </div>
                  {/* Online Status Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#25d366] border-[2.5px] border-[#1a1625] rounded-full animate-pulse" />
                </div>

                {/* Name & Role */}
                <div>
                  <h3 className="text-lg font-extrabold text-[#e8dfee] tracking-tight leading-tight">
                    Vinay Sukhwal
                  </h3>
                  <p className="text-sm text-[#d2bbff] font-semibold mt-0.5 flex items-center gap-1.5">
                    <FaCode className="w-3.5 h-3.5" />
                    Full Stack Developer
                  </p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-[#ccc3d8]/80 leading-relaxed mb-6">
                Passionate developer focused on building innovative web applications and software solutions. 
                Creator and maintainer of SmartTax.
              </p>

              {/* Connect With Me */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#958da1] mb-3">
                  Connect With Me
                </p>
                <div className="flex items-center gap-2.5">
                  {socialLinks.map(({ name, icon: Icon, url, color, hoverBg }) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      title={name}
                      className={`w-10 h-10 rounded-xl bg-[#221e28]/60 border border-[#4a4455]/20 flex items-center justify-center ${hoverBg} hover:border-[#7c3aed]/30 hover:scale-110 active:scale-95 transition-all duration-300`}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color }} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                {/* GitHub Repo */}
                <a
                  href="https://github.com/Vinaysukhwal/SmartTax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#221e28] border border-[#4a4455]/25 text-sm font-semibold text-[#e8dfee] hover:bg-[#2d2838] hover:border-[#7c3aed]/30 active:scale-95 transition-all duration-300"
                >
                  <FaGithub className="w-4 h-4" />
                  <span>View Repository</span>
                  <HiOutlineExternalLink className="w-3.5 h-3.5 text-[#958da1]" />
                </a>
                {/* WhatsApp */}
                <a
                  href="https://wa.me/918764113263"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 text-sm font-semibold text-[#25d366] hover:bg-[#25d366]/20 hover:border-[#25d366]/40 active:scale-95 transition-all duration-300"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>Contact</span>
                </a>
                {/* Support the Project */}
                <a
                  href="upi://pay?pa=sukhwal.vinay11-1@oksbi&pn=Vinay%20Sukhwal&cu=INR"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-sm font-semibold text-[#d2bbff] hover:bg-[#7c3aed]/20 hover:border-[#7c3aed]/40 active:scale-95 transition-all duration-300"
                  title="Support via Google Pay: 8764113263"
                >
                  <FaCoffee className="w-4 h-4" />
                  <span>Support</span>
                  <span className="text-[10px] bg-[#7c3aed]/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    8764113263
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* ─── Center: Brand + Quick Links + Official Portals ─── */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">

              {/* Brand Section */}
              <div className="sm:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img src="/logo.png" alt="SmartTax" className="w-9 h-9 rounded-lg object-contain" />
                  <span className="text-xl font-extrabold text-[#e8dfee] tracking-tight">
                    Smart<span className="text-[#d2bbff]">Tax</span>
                  </span>
                </div>
                <p className="text-sm text-[#ccc3d8] leading-relaxed mb-4">
                  Free Indian income tax filing platform. Calculate taxes, file ITR, 
                  track deductions, and get AI-powered tax assistance.
                </p>
                <p className="text-xs text-red-400/80 leading-normal border-l-2 border-red-500/30 pl-3">
                  Disclaimer: SmartTax is a learning project for educational purposes only. 
                  Always consult a Chartered Accountant for actual tax filing.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-[#e8dfee] font-bold text-sm uppercase tracking-wider mb-4">
                  Quick Links
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {[
                    { to: '/calculators', label: 'Tax Calculator' },
                    { to: '/itr-recommender', label: 'ITR Recommender' },
                    { to: '/file-itr', label: 'File ITR' },
                    { to: '/deductions', label: 'Track Deductions' },
                    { to: '/documents', label: 'Document Vault' },
                    { to: '/chatbot', label: 'AI Chatbot' },
                  ].map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="hover:text-[#d2bbff] transition-colors duration-200 hover:translate-x-1 inline-block"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Official Portals */}
              <div>
                <h3 className="text-[#e8dfee] font-bold text-sm uppercase tracking-wider mb-4">
                  Official Portals
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {[
                    { href: 'https://www.incometax.gov.in', label: 'Income Tax Portal' },
                    { href: 'https://tin.tin.nsdl.com/oltas/', label: 'NSDL e-Payment' },
                    {
                      href: 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-702702700001',
                      label: 'ITR Forms Guide',
                    },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#d2bbff] transition-colors duration-200 flex items-center gap-1 hover:translate-x-1"
                      >
                        {label} <span className="text-xs opacity-60">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="relative z-10 border-t border-[#4a4455]/15">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#ccc3d8]/50">
            <p>© {currentYear} Vinay Sukhwal. All Rights Reserved.</p>
            <p className="flex items-center gap-1.5">
              Designed and Developed with
              <FaHeart className="w-3 h-3 text-red-400 animate-pulse" />
              by
              <a
                href="https://www.linkedin.com/in/vinaysukhwal1111"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d2bbff]/70 font-semibold hover:text-[#d2bbff] transition-colors duration-200"
              >
                Vinay Sukhwal
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
