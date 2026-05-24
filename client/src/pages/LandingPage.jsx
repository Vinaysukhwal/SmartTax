import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const LandingPage = () => {
  // Trigger animation reveal on scroll
  useEffect(() => {
    const handleScroll = () => {
      const reveals = document.querySelectorAll('.scroll-reveal');
      reveals.forEach((reveal) => {
        const windowHeight = window.innerHeight;
        const revealTop = reveal.getBoundingClientRect().top;
        const revealPoint = 150;

        if (revealTop < windowHeight - revealPoint) {
          reveal.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on mount
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="animate-fadeIn min-h-screen text-[#e8dfee] bg-[#0f0f0f] overflow-x-hidden font-sans">
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-16 pb-24 px-6 md:px-12 lg:px-24 overflow-hidden hero-gradient">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-4 py-1.5 rounded-full mb-8 animate-slideUp">
            <span className="material-symbols-outlined text-[#d2bbff] text-[18px]">verified</span>
            <span className="text-xs font-semibold tracking-wider text-[#d2bbff] uppercase">Certified Tax Compliance Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-[#e8dfee] to-[#ccc3d8] bg-clip-text text-transparent animate-slideUp leading-tight">
            File Your ITR Free <br /> in 15 Minutes
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-[#ccc3d8] max-w-2xl mb-10 leading-relaxed animate-slideUp">
            Precision tax filing powered by AI. No more confusing forms, just fast refunds and zero errors. 100% Free for everyone.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4 mb-16 animate-slideUp">
            <Link
              to="/register"
              className="flex-1 text-center bg-[#7c3aed] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] transition-all duration-300 active:scale-95 text-base border border-[#7c3aed] accent-glow"
            >
              Get Started Now
            </Link>
            <Link
              to="/calculators"
              className="flex-1 text-center glass-card py-4 rounded-xl font-bold border border-white/8 text-[#e8dfee] hover:bg-white/5 transition-all duration-300 active:scale-95 text-base"
            >
              Try Calculator
            </Link>
          </div>

          {/* Floating Illustration */}
          <div className="relative w-full max-w-[400px] mt-8 animate-fadeIn">
            <div className="absolute inset-0 bg-[#7c3aed]/20 blur-[80px] rounded-full"></div>
            <img
              alt="Tax Document Hero"
              className="relative z-10 w-full h-auto floating-document drop-shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuw0I1pnbTLvmJx9bD9no7ePogjRUCiM1rW0mCNixO30txoW8xDnKHrJWh5T_Tn8H-nklGs5kDo6U9IQfJ2seT8o6-J2I5kmJb-P2uFl9Wk2whNYd058GmUEGs0BT6TLk82CD-QsobDU2p-yZtQyCRev7yeU16iKLAAxESS9loYHmzwkfbZSYmXkiCe0aOuQLLLNoprrFdLvchxyolll4GR3iimVYGAi_L7L9ejgFOaRpwXRsiOlUiI6Vq0uQyRd2z5TD68Zqo0oQ"
            />
          </div>
        </div>
      </section>

      {/* ===== FEATURES BENTO GRID ===== */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#0f0f0f] relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-left">
            <h2 className="text-3xl font-extrabold text-[#e8dfee] mb-2">Powering Your Compliance</h2>
            <p className="text-base text-[#ccc3d8]">Everything you need for a stress-free tax season.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 — ITR Filing (Span 2) */}
            <Link
              to="/file-itr"
              className="glass-card p-8 rounded-2xl flex flex-col gap-6 scroll-reveal md:col-span-2 hover:border-[#7c3aed]/50 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center border border-[#7c3aed]/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#d2bbff]">receipt_long</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#e8dfee] mb-2 group-hover:text-[#d2bbff] transition-colors">ITR Filing</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed">
                  Optimized step-by-step workflows for ITR-1 to ITR-4. Quick, accurate, and completely free.
                </p>
              </div>
            </Link>

            {/* Feature 2 — AI Chatbot */}
            <Link
              to="/chatbot"
              className="glass-card p-8 rounded-2xl flex flex-col gap-6 scroll-reveal hover:border-[#7c3aed]/50 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-orange-400">smart_toy</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#e8dfee] mb-2 group-hover:text-orange-400 transition-colors">AI Chatbot</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed">
                  Get instant answers to all your Indian tax questions using the built-in Gemini AI.
                </p>
              </div>
            </Link>

            {/* Feature 3 — Tax Calc */}
            <Link
              to="/calculators"
              className="glass-card p-8 rounded-2xl flex flex-col gap-6 scroll-reveal hover:border-[#7c3aed]/50 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-[#ddb7ff]/10 flex items-center justify-center border border-[#ddb7ff]/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#ddb7ff]">calculate</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#e8dfee] mb-2 group-hover:text-[#ddb7ff] transition-colors">Tax Calculator</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed">
                  Side-by-side comparison of old vs new regime rules updated for the latest fiscal year.
                </p>
              </div>
            </Link>

            {/* Feature 4 — Vault */}
            <Link
              to="/documents"
              className="glass-card p-8 rounded-2xl flex flex-col gap-6 scroll-reveal hover:border-[#7c3aed]/50 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center border border-[#7c3aed]/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#d2bbff]">folder_open</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#e8dfee] mb-2 group-hover:text-[#d2bbff] transition-colors">Document Vault</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed">
                  Secure drag-and-drop storage for your Form 16, PAN, and other compliance receipts.
                </p>
              </div>
            </Link>

            {/* Feature 5 — Deduction Tracker */}
            <Link
              to="/deductions"
              className="glass-card p-8 rounded-2xl flex flex-col gap-6 scroll-reveal hover:border-[#7c3aed]/50 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-red-400">track_changes</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#e8dfee] mb-2 group-hover:text-red-400 transition-colors">Deduction Tracker</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed">
                  Track 80C, 80D, and NPS limits with interactive, color-coded progress bars.
                </p>
              </div>
            </Link>

            {/* Feature 6 — Notice Tracker (Span 2) */}
            <Link
              to="/notices"
              className="glass-card p-8 rounded-2xl flex flex-col gap-6 scroll-reveal md:col-span-2 hover:border-[#7c3aed]/50 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-[#ddb7ff]/10 flex items-center justify-center border border-[#ddb7ff]/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#ddb7ff]">notifications_active</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#e8dfee] mb-2 group-hover:text-[#ddb7ff] transition-colors">Notice Tracker</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed">
                  Keep track of official Income Tax department notices, responses, and deadlines in one central dashboard.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#1d1a24] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-16 text-[#e8dfee]">Filing Made Simple</h2>
          <div className="flex flex-col gap-16 relative">
            {/* Vertical Line Connector */}
            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#7c3aed] to-[#ddb7ff] opacity-30"></div>

            {/* Step 1 */}
            <div className="flex gap-6 relative z-10 scroll-reveal">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold shadow-lg shadow-[#7c3aed]/30">
                1
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#e8dfee] mb-2">Upload</h4>
                <p className="text-base text-[#ccc3d8] max-w-xl">
                  Simply upload your Form-16 or input your taxable earnings manually. Our engine parses the data instantly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 relative z-10 scroll-reveal">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#ddb7ff] flex items-center justify-center text-[#2c0051] font-bold shadow-lg shadow-[#ddb7ff]/20">
                2
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#e8dfee] mb-2">Review</h4>
                <p className="text-base text-[#ccc3d8] max-w-xl">
                  Review tax slab details, old vs new regime comparison, deductions claimed, and audit flags.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 relative z-10 scroll-reveal">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center text-[#301400] font-bold shadow-lg shadow-orange-400/20">
                3
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#e8dfee] mb-2">E-File</h4>
                <p className="text-base text-[#ccc3d8] max-w-xl">
                  Generate your Challan and download your formatted ITR filing summary as a PDF. Ready to submit!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto glass-card p-10 rounded-[32px] border border-[#7c3aed]/20 relative overflow-hidden text-center">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7c3aed]/20 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#ddb7ff]/20 blur-[100px] rounded-full"></div>
          <h2 className="text-3xl font-extrabold mb-6 relative z-10 text-[#e8dfee]">Start Your Free Filing Today</h2>
          <p className="text-base text-[#ccc3d8] mb-8 relative z-10 max-w-lg mx-auto">
            Join thousands of smart taxpayers who file stress-free with zero compliance errors.
          </p>
          <Link
            to="/register"
            className="inline-block bg-[#7c3aed] text-white px-10 py-4 rounded-xl font-extrabold text-base relative z-10 hover:scale-105 transition-transform duration-300 shadow-lg shadow-[#7c3aed]/20"
          >
            File For Free
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
