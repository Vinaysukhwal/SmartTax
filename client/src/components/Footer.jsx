import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#100d16] text-[#ccc3d8] border-t border-[#4a4455]/20 py-12 px-6 md:px-12 lg:px-24 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        {/* Brand Section */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg shadow-[#7c3aed]/25">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <span className="text-xl font-extrabold text-[#e8dfee] tracking-tight">
              Smart<span className="text-[#d2bbff]">Tax</span>
            </span>
          </div>
          <p className="text-sm text-[#ccc3d8] leading-relaxed mb-4">
            Free Indian income tax filing platform. Calculate taxes, file ITR, 
            track deductions, and get AI-powered tax assistance — all at no cost.
          </p>
          <p className="text-xs text-red-400/80 leading-normal border-l-2 border-red-500/30 pl-3">
            Disclaimer: SmartTax is a learning project for educational purposes only. 
            It does not provide professional tax advice. Always consult a Chartered Accountant 
            for actual tax filing.
          </p>
        </div>

        {/* Links Section */}
        <div className="flex gap-16">
          {/* Quick Links */}
          <div>
            <h3 className="text-[#e8dfee] font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/calculators" className="hover:text-[#d2bbff] transition-colors">
                  Tax Calculator
                </Link>
              </li>
              <li>
                <Link to="/itr-recommender" className="hover:text-[#d2bbff] transition-colors">
                  ITR Recommender
                </Link>
              </li>
              <li>
                <Link to="/file-itr" className="hover:text-[#d2bbff] transition-colors">
                  File ITR
                </Link>
              </li>
              <li>
                <Link to="/deductions" className="hover:text-[#d2bbff] transition-colors">
                  Track Deductions
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-[#e8dfee] font-bold text-sm uppercase tracking-wider mb-4">Official Portals</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.incometax.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d2bbff] transition-colors flex items-center gap-1"
                >
                  Income Tax Portal <span className="text-xs">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://tin.tin.nsdl.com/oltas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d2bbff] transition-colors flex items-center gap-1"
                >
                  NSDL e-Payment <span className="text-xs">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-702702700001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d2bbff] transition-colors flex items-center gap-1"
                >
                  ITR Forms Guide <span className="text-xs">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#4a4455]/20 max-w-7xl mx-auto mt-12 pt-8 text-center text-xs text-[#ccc3d8]/60">
        <p>© {new Date().getFullYear()} SmartTax. Built as a learning project. Not affiliated with the Income Tax Department of India.</p>
      </div>
    </footer>
  );
};

export default Footer;
