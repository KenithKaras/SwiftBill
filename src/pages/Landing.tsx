import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  ArrowRight,
  LineChart,
  ShieldCheck,
  Check,
  ChevronDown,
  Zap,
  Palette,
  Menu,
  X,
  Download,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Animation variants — restrained, no perpetual motion
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'analytics' | 'branding'>('invoice');
  const [isYearly, setIsYearly] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does SwiftBill handle tax and GST on invoices?',
      a: 'You can set a tax or GST percentage per invoice, and SwiftBill applies it to your line items and totals automatically. Rates are yours to configure — SwiftBill formats the fields, but you remain responsible for choosing rates that match your jurisdiction.'
    },
    {
      q: 'Can I customize invoices with my own logo and colors?',
      a: 'Yes. From Settings you can upload a business logo, set a primary brand color, and choose a template. The Custom template carries those choices into the exported PDF so your documents match your brand.'
    },
    {
      q: 'What format are invoices exported in?',
      a: 'Invoices render in the browser and export as standard PDF documents — ready to email to clients, print, or keep for your records.'
    },
    {
      q: 'Is there a limit to how many invoices I can create?',
      a: 'No hard cap. SwiftBill is built to grow with you, from a handful of invoices a month to a steady, high-volume workflow.'
    }
  ];

  const features = [
    {
      icon: <Zap size={20} className="text-accent" />,
      title: 'Fast PDF export',
      desc: 'Draft an invoice and export a clean, print-ready PDF in seconds — straight from your browser, no plugins.'
    },
    {
      icon: <LineChart size={20} className="text-accent" />,
      title: 'Revenue at a glance',
      desc: 'A live dashboard tracks billed, collected, and outstanding totals, plus your payment rate and upcoming due dates.'
    },
    {
      icon: <Palette size={20} className="text-accent" />,
      title: 'On-brand documents',
      desc: 'Add your logo, set a primary color, and pick a template. Your invoices leave looking like your business, not a default.'
    },
    {
      icon: <Receipt size={20} className="text-accent" />,
      title: 'Overdue tracking',
      desc: 'Overdue invoices are flagged and surfaced on your dashboard, so the accounts that need attention stay in front of you.'
    },
    {
      icon: <ShieldCheck size={20} className="text-accent" />,
      title: 'Private by default',
      desc: 'Row-Level Security in Postgres scopes every record to your account — your data stays isolated from other users.'
    },
    {
      icon: <Users size={20} className="text-accent" />,
      title: 'Client records',
      desc: 'Keep client names, contact details, and billing history together, so the next invoice is mostly filled in already.'
    }
  ];

  const eyebrow = 'text-[11px] font-semibold text-grey uppercase tracking-[0.16em]';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-paper/90 backdrop-blur-sm border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-ink text-paper w-8 h-8 rounded-sm flex items-center justify-center font-display font-semibold text-sm">
              SB
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-ink">SwiftBill</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-ink-soft">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#demo" className="hover:text-ink transition-colors">Product</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-ink hover:bg-accent text-paper px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-ink-soft hover:text-ink text-sm font-medium transition-colors">
                  Sign in
                </Link>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-ink hover:bg-accent text-paper px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
                >
                  Get started
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-ink-soft hover:text-ink transition-colors"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-paper border-b border-hairline overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-5 text-sm text-ink-soft">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink transition-colors">Features</a>
                <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink transition-colors">Product</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink transition-colors">Pricing</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink transition-colors">FAQ</a>
                <hr className="border-hairline" />
                {user ? (
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                    className="w-full bg-ink text-paper py-3 rounded text-sm font-medium flex items-center justify-center gap-2"
                  >
                    Dashboard <ArrowRight size={15} />
                  </button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center text-ink-soft hover:text-ink text-sm font-medium transition-colors">
                      Sign in
                    </Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                      className="w-full bg-ink text-paper py-3 rounded text-sm font-medium text-center"
                    >
                      Get started
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <header className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="lg:col-span-6 space-y-7 text-center lg:text-left"
          >
            <motion.div variants={fadeIn} className={`inline-flex items-center gap-2 ${eyebrow}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Invoicing, done properly
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="font-display text-4xl sm:text-5xl xl:text-[3.75rem] font-semibold tracking-[-0.02em] leading-[1.05] text-ink"
            >
              Invoices your clients<br />
              take <span className="text-accent">seriously.</span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-ink-soft text-base md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
            >
              Create clean, branded PDF invoices, track what you're owed, and see your revenue health in one dashboard — without the spreadsheet gymnastics.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto bg-ink hover:bg-accent text-paper px-6 py-3.5 rounded font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors group"
                >
                  Open dashboard <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full sm:w-auto bg-ink hover:bg-accent text-paper px-6 py-3.5 rounded font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors group"
                  >
                    Start free <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto bg-surface hover:bg-slate-50 border border-hairline text-ink px-6 py-3.5 rounded font-medium text-sm transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-grey"
            >
              <span>PDF export built in</span>
              <span className="h-3 w-px bg-hairline hidden sm:block" />
              <span>Row-level data isolation</span>
              <span className="h-3 w-px bg-hairline hidden sm:block" />
              <span>No credit card required</span>
            </motion.div>
          </motion.div>

          {/* Invoice mock — light, hairline, tabular */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-6 relative flex justify-center"
          >
            <div className="w-full max-w-lg bg-surface border border-hairline rounded shadow-xl shadow-black/3 p-7">
              <div className="flex justify-between items-start border-b border-hairline pb-5 mb-5">
                <div>
                  <h3 className="font-display font-semibold text-ink text-base">SwiftBill Studio</h3>
                  <p className="text-grey text-xs mt-1">100 Tech Blvd, Suite 400</p>
                  <p className="text-grey text-xs">San Francisco, CA 94025</p>
                </div>
                <div className="text-right">
                  <span className={`${eyebrow} block`}>Invoice</span>
                  <p className="font-mono text-sm font-semibold text-ink mt-1 tnum">INV-2026-0034</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <h5 className={`${eyebrow} mb-1.5`}>Billed to</h5>
                  <p className="font-medium text-ink text-sm">Acme Enterprise</p>
                  <p className="text-xs text-grey mt-0.5">billing@acme.com</p>
                </div>
                <div className="text-right">
                  <h5 className={`${eyebrow} mb-1.5`}>Due</h5>
                  <p className="font-medium text-ink text-sm tnum">Jun 15, 2026</p>
                  <p className="text-xs text-grey mt-0.5 tnum">Issued Jun 01</p>
                </div>
              </div>

              <div className="border-t border-hairline pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink text-sm">Cloud consultation</p>
                    <p className="text-xs text-grey mt-0.5 tnum">25 hrs &times; $120</p>
                  </div>
                  <span className="font-medium text-ink text-sm tnum">$3,000.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink text-sm">API deployment</p>
                    <p className="text-xs text-grey mt-0.5">Flat rate</p>
                  </div>
                  <span className="font-medium text-ink text-sm tnum">$1,500.00</span>
                </div>
              </div>

              <div className="border-t border-hairline mt-4 pt-4 flex justify-between items-end">
                <div>
                  <p className="text-xs text-grey">GST (18%) applied</p>
                  <p className="text-[11px] text-grey mt-0.5">Generated with SwiftBill</p>
                </div>
                <div className="text-right">
                  <p className={`${eyebrow}`}>Total due</p>
                  <p className="font-display text-2xl font-semibold text-ink mt-1 tnum">$5,310.00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <span className={eyebrow}>What you get</span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-ink mt-3">
              Everything billing needs. Nothing it doesn't.
            </h2>
            <p className="text-ink-soft text-base leading-relaxed mt-4">
              A focused set of tools for drafting, exporting, and tracking invoices — built for speed and legibility.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline rounded overflow-hidden"
          >
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-surface p-8 hover:bg-paper transition-colors"
              >
                <div className="w-10 h-10 rounded-sm bg-accent-soft flex items-center justify-center mb-5">
                  {feat.icon}
                </div>
                <h3 className="font-display font-semibold text-ink text-base mb-2">{feat.title}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product demo */}
      <section id="demo" className="py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <span className={eyebrow}>A closer look</span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-ink mt-3">
              See how it works
            </h2>
            <p className="text-ink-soft text-base leading-relaxed mt-4">
              Three parts of the workflow — drafting an invoice, reading your numbers, and setting your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Tabs */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              {([
                { id: 'invoice', icon: <Receipt size={16} />, title: 'Invoice builder', desc: 'Add line items and tax, watch the PDF total update live.' },
                { id: 'analytics', icon: <LineChart size={16} />, title: 'Dashboard', desc: 'Billed, collected, and outstanding — with your payment rate.' },
                { id: 'branding', icon: <Palette size={16} />, title: 'Branding', desc: 'Set a logo, primary color, and template for exports.' }
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-5 rounded border transition-colors flex items-start gap-3.5 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-surface border-hairline shadow-sm shadow-black/3'
                      : 'bg-transparent border-transparent hover:bg-surface/60'
                  }`}
                >
                  <div className={`p-2 rounded-sm shrink-0 ${activeTab === tab.id ? 'bg-ink text-paper' : 'bg-accent-soft text-accent'}`}>
                    {tab.icon}
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm mb-0.5 ${activeTab === tab.id ? 'text-ink' : 'text-ink-soft'}`}>{tab.title}</h4>
                    <p className="text-xs text-grey leading-relaxed">{tab.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Screen */}
            <div className="lg:col-span-8 bg-surface border border-hairline rounded p-6 shadow-sm shadow-black/3 min-h-105 flex flex-col">
              <div className="flex justify-between items-center border-b border-hairline pb-4 mb-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 border border-hairline rounded-full" />
                  <div className="w-2.5 h-2.5 border border-hairline rounded-full" />
                  <div className="w-2.5 h-2.5 border border-hairline rounded-full" />
                </div>
                <span className={eyebrow}>SwiftBill</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {activeTab === 'invoice' && (
                    <motion.div
                      key="invoice-demo"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-md mx-auto space-y-2.5"
                    >
                      <div className="flex justify-between border-b border-hairline pb-3 mb-1">
                        <span className="font-medium text-ink text-sm">Draft invoice</span>
                        <span className="text-xs text-accent font-medium">Live preview</span>
                      </div>
                      {[
                        ['Client', 'Acme Enterprise'],
                        ['Consulting services', '$1,200.00'],
                        ['Tax / GST (18%)', '$216.00']
                      ].map(([k, v], i) => (
                        <div key={i} className="h-10 bg-paper border border-hairline rounded px-3.5 flex items-center justify-between">
                          <span className="text-xs text-grey">{k}</span>
                          <span className="text-xs text-ink font-medium tnum">{v}</span>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <div className="flex-1 h-10 bg-surface border border-hairline rounded flex items-center justify-center gap-1.5 text-xs font-medium text-ink-soft">
                          <Download size={13} /> Save
                        </div>
                        <div className="flex-1 h-10 bg-ink text-paper rounded flex items-center justify-center gap-1.5 text-xs font-medium">
                          <Check size={13} /> Export PDF
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'analytics' && (
                    <motion.div
                      key="analytics-demo"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="w-full space-y-5"
                    >
                      <div className="grid grid-cols-3 divide-x divide-hairline border border-hairline rounded overflow-hidden">
                        {[
                          ['Collected', '$142,500', 'text-ink'],
                          ['Payment rate', '88%', 'text-positive'],
                          ['Outstanding', '$8,450', 'text-ink']
                        ].map(([label, val, color], i) => (
                          <div key={i} className="p-4 bg-surface">
                            <p className={`${eyebrow} mb-2`}>{label}</p>
                            <p className={`font-display text-lg font-semibold tnum ${color}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border border-hairline rounded p-5 h-28 flex items-end justify-between gap-2">
                        {[40, 65, 55, 85, 72, 100].map((h, i) => (
                          <div key={i} className="flex-1 bg-ink rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'branding' && (
                    <motion.div
                      key="branding-demo"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-md mx-auto space-y-5"
                    >
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <span className={`${eyebrow} block mb-2`}>Primary color</span>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-sm bg-accent border border-hairline" />
                            <span className="font-mono text-xs text-ink font-medium">#1E3A2F</span>
                          </div>
                        </div>
                        <div>
                          <span className={`${eyebrow} block mb-2`}>Template font</span>
                          <span className="font-display text-sm text-ink font-medium">Space Grotesk</span>
                        </div>
                      </div>
                      <div className="border-t border-hairline pt-4">
                        <span className={`${eyebrow} block mb-2.5`}>Logo placement</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-9 border border-ink bg-ink text-paper rounded-sm text-xs font-medium flex items-center justify-center">Left</div>
                          <div className="h-9 border border-hairline text-grey rounded-sm text-xs font-medium flex items-center justify-center">Center</div>
                          <div className="h-9 border border-hairline text-grey rounded-sm text-xs font-medium flex items-center justify-center">Right</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <span className={eyebrow}>Pricing</span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-ink mt-3">
              Plans that scale with your volume
            </h2>
            <p className="text-ink-soft text-base leading-relaxed mt-4">
              Every plan includes PDF export, tax handling, and private-by-default storage.
            </p>

            <div className="inline-flex items-center gap-1 bg-surface border border-hairline p-1 rounded mt-6 select-none">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${!isYearly ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 ${isYearly ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}
              >
                Yearly <span className={isYearly ? 'text-paper/70' : 'text-accent'}>-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border border-hairline rounded overflow-hidden">
            {/* Starter */}
            <div className="bg-surface p-8 flex flex-col justify-between">
              <div>
                <span className={eyebrow}>Freelancer</span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold text-ink tnum">${isYearly ? '12' : '15'}</span>
                  <span className="text-grey text-sm">/mo</span>
                </div>
                <p className="text-ink-soft text-sm leading-relaxed mt-4">For solo professionals sending a handful of invoices each month.</p>
                <ul className="space-y-3 text-sm text-ink-soft mt-6">
                  {['Up to 25 invoices / mo', 'Standard templates', 'Tax & GST fields', 'PDF export'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check size={15} className="text-accent shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="w-full mt-8 bg-surface border border-hairline text-ink hover:bg-paper py-3 rounded text-sm font-medium cursor-pointer transition-colors"
              >
                Choose Freelancer
              </button>
            </div>

            {/* Professional */}
            <div className="bg-ink p-8 flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-paper/60 uppercase tracking-[0.16em]">Professional</span>
                  <span className="text-[10px] font-medium text-ink bg-paper px-2 py-0.5 rounded-sm uppercase tracking-wide">Popular</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold text-paper tnum">${isYearly ? '39' : '49'}</span>
                  <span className="text-paper/50 text-sm">/mo</span>
                </div>
                <p className="text-paper/70 text-sm leading-relaxed mt-4">For growing teams that need branding, tracking, and unlimited volume.</p>
                <ul className="space-y-3 text-sm text-paper/80 mt-6">
                  {['Unlimited invoices', 'Custom template & color', 'Logo upload', 'Overdue tracking', 'Priority support'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check size={15} className="text-paper shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="w-full mt-8 bg-paper text-ink hover:bg-white py-3 rounded text-sm font-medium cursor-pointer transition-colors"
              >
                Go Professional
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-surface p-8 flex flex-col justify-between">
              <div>
                <span className={eyebrow}>Enterprise</span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold text-ink tnum">${isYearly ? '79' : '99'}</span>
                  <span className="text-grey text-sm">/mo</span>
                </div>
                <p className="text-ink-soft text-sm leading-relaxed mt-4">For high-volume teams needing collaboration and dedicated support.</p>
                <ul className="space-y-3 text-sm text-ink-soft mt-6">
                  {['Everything in Professional', 'Multi-member accounts', 'Dedicated support', 'Custom SLAs'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check size={15} className="text-accent shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="w-full mt-8 bg-surface border border-hairline text-ink hover:bg-paper py-3 rounded text-sm font-medium cursor-pointer transition-colors"
              >
                Contact sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12">
            <span className={eyebrow}>FAQ</span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-ink mt-3">
              Questions, answered
            </h2>
          </div>

          <div className="border-t border-hairline">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="border-b border-hairline">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full py-5 flex items-center justify-between text-left font-medium text-ink hover:text-accent transition-colors cursor-pointer select-none gap-4"
                  >
                    <span>{faq.q}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-grey shrink-0">
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pr-8 text-ink-soft text-sm leading-relaxed">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-ink rounded p-12 md:p-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-paper">
              Send your first invoice today
            </h2>
            <p className="text-paper/70 text-base leading-relaxed mt-4 max-w-md mx-auto">
              Free to start, no credit card. Your data stays yours.
            </p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="mt-8 bg-paper text-ink hover:bg-white px-7 py-3.5 rounded font-medium text-sm inline-flex items-center gap-2 cursor-pointer transition-colors group"
            >
              {user ? 'Open dashboard' : 'Get started free'}
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline py-14">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-hairline pb-10 mb-8">
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-ink text-paper w-8 h-8 rounded-sm flex items-center justify-center font-display font-semibold text-sm">SB</div>
              <span className="font-display font-semibold text-lg tracking-tight text-ink">SwiftBill</span>
            </Link>
            <p className="text-ink-soft text-sm leading-relaxed max-w-sm">
              Clean, branded invoices and clear revenue tracking — in one place.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h5 className={eyebrow}>Product</h5>
              <ul className="space-y-2.5 text-sm text-ink-soft">
                <li><a href="#features" className="hover:text-ink transition-colors">Features</a></li>
                <li><a href="#demo" className="hover:text-ink transition-colors">Product</a></li>
                <li><a href="#pricing" className="hover:text-ink transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className={eyebrow}>Account</h5>
              <ul className="space-y-2.5 text-sm text-ink-soft">
                <li><a href="#faq" className="hover:text-ink transition-colors">FAQ</a></li>
                <li><Link to="/login" className="hover:text-ink transition-colors">Sign in</Link></li>
                <li><Link to="/signup" className="hover:text-ink transition-colors">Register</Link></li>
              </ul>
            </div>
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h5 className={eyebrow}>Data</h5>
              <p className="text-sm text-ink-soft leading-relaxed">
                Records are scoped to your account with Postgres Row-Level Security.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-grey">
          <span>&copy; 2026 SwiftBill</span>
          <div className="flex gap-6">
            <span className="hover:text-ink transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-ink transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-ink transition-colors cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
