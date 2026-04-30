import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceService, InvoiceItem } from '../services/invoiceService';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Mail, 
  Phone,
  Save,
  Download,
  Check,
  FileText
} from 'lucide-react';
import { generateInvoiceNo, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { InvoiceLayout } from '../components/InvoiceLayout';

const CreateInvoice = () => {
  const { user, businessData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [dates, setDates] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', quantity: 1, price: 0 }
  ]);

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [templateType, setTemplateType] = useState<'modern' | 'minimal' | 'classic' | 'custom'>('modern');
  const [notes, setNotes] = useState('');
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    if (user) {
      invoiceService.getUserInvoices(user.id).then(docs => setInvoiceCount(docs.length));
    }
  }, [user]);

  const addItem = () => setItems([...items, { name: '', quantity: 1, price: 0 }]);
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = field === 'name' ? value : Number(value);
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const gst = gstEnabled ? subtotal * (gstPercentage / 100) : 0;
  const total = subtotal + gst;

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!clientInfo.name.trim()) {
      alert("Please enter a client name.");
      return;
    }

    const validItems = items.filter(item => item.name.trim() !== '' && item.price >= 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid item to the invoice.");
      return;
    }

    setLoading(true);
    try {
      await invoiceService.createInvoice({
        invoiceNo: generateInvoiceNo(invoiceCount),
        userId: user.id,
        clientName: clientInfo.name.trim().substring(0, 100),
        clientEmail: clientInfo.email.trim().substring(0, 100),
        clientPhone: clientInfo.phone.trim().substring(0, 20),
        date: dates.date,
        dueDate: dates.dueDate,
        items: validItems.map(item => ({
          ...item,
          name: item.name.trim().substring(0, 200)
        })),
        gstEnabled,
        gstPercentage,
        totalAmount: total, 
        status: 'unpaid',
        notes: notes.trim().substring(0, 1000),
        templateType
      });
      setSuccess(true);
      setTimeout(() => navigate('/history'), 1500);
    } catch (error: any) {
      alert('Error saving invoice: ' + (error.message || 'Check your Supabase setup'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-preview');
    const opt = {
      margin: 0,
      filename: `Invoice_${generateInvoiceNo(invoiceCount)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-slate-500 mt-1">Generate a professional invoice for your client.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            <Download size={18} /> Download PDF
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className={`px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${success ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {success ? <Check size={18} /> : <Save size={18} />}
            {loading ? 'Saving...' : success ? 'Saved' : 'Save Invoice'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Editor */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold border-b border-slate-100 pb-4 flex items-center gap-2 text-slate-800">
              <User size={18} className="text-blue-600" /> Client Details
            </h3>
            <div className="space-y-4">
              <Input label="Client Name" value={clientInfo.name} onChange={(v: string) => setClientInfo({...clientInfo, name: v})} placeholder="Acme Corp" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email" value={clientInfo.email} onChange={(v: string) => setClientInfo({...clientInfo, email: v})} placeholder="client@example.com" icon={<Mail size={16}/>} />
                <Input label="Phone" value={clientInfo.phone} onChange={(v: string) => setClientInfo({...clientInfo, phone: v})} placeholder="+1 234 567 890" icon={<Phone size={16}/>} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Invoice Date" type="date" value={dates.date} onChange={(v: string) => setDates({...dates, date: v})} icon={<Calendar size={16}/>} />
                <Input label="Due Date" type="date" value={dates.dueDate} onChange={(v: string) => setDates({...dates, dueDate: v})} icon={<Calendar size={16}/>} />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-800">
                <FileText size={18} className="text-blue-600" /> Invoice Items
              </h3>
              <button onClick={addItem} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input label="Item Name" value={item.name} onChange={v => updateItem(idx, 'name', v)} placeholder="Web Development" />
                  </div>
                  <div className="w-20">
                    <Input label="Qty" type="number" value={item.quantity} onChange={v => updateItem(idx, 'quantity', v)} />
                  </div>
                  <div className="w-32">
                    <Input label="Price" type="number" value={item.price} onChange={v => updateItem(idx, 'price', v)} />
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-2.5 text-slate-300 hover:text-red-500 mb-1 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-600">Apply GST</label>
                <div className="flex items-center gap-4">
                   {gstEnabled && (
                      <div className="flex items-center gap-2">
                         <input 
                            type="number" 
                            value={gstPercentage} 
                            onChange={(e) => setGstPercentage(Number(e.target.value))}
                            className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-blue-600"
                         />
                         <span className="text-xs text-slate-400 font-bold">%</span>
                      </div>
                   )}
                   <button 
                      onClick={() => setGstEnabled(!gstEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${gstEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gstEnabled ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>

             <div className="pt-4 border-t border-slate-100 italic space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Invoice Template</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                   {['modern', 'minimal', 'classic', 'custom'].map((t) => (
                      <button
                         key={t}
                         onClick={() => setTemplateType(t as any)}
                         className={`py-2 px-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                            templateType === t 
                               ? 'bg-blue-600 text-white border-blue-600' 
                               : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'
                         }`}
                      >
                         {t}
                      </button>
                   ))}
                </div>
                {templateType === 'custom' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Uses <b>Brand Colors</b> from Settings.
                  </p>
                )}
             </div>

             <div className="space-y-1">
               <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Additional Notes</label>
               <textarea 
                value={notes}
                maxLength={1000}
                onChange={e => setNotes(e.target.value)}
                placeholder="Thanks for your business!"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-medium transition-all"
               />
             </div>
          </section>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div id="invoice-preview" className="shadow-2xl overflow-hidden rounded-sm bg-white">
            <InvoiceLayout 
              data={{
                invoiceNo: generateInvoiceNo(invoiceCount),
                clientName: clientInfo.name,
                clientEmail: clientInfo.email,
                clientPhone: clientInfo.phone,
                date: dates.date,
                items: items,
                gstEnabled,
                gstPercentage,
                totalAmount: total,
                notes,
                templateType
              }} 
              businessData={businessData} 
              invoiceCount={invoiceCount} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  maxLength?: number;
}

const Input = ({ label, value, onChange, placeholder, icon, type = 'text', maxLength = 100 }: InputProps) => (
  <div className="space-y-1.5 flex-1 text-left">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input 
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-medium ${icon ? 'pl-10 pr-3' : 'px-4'}`}
      />
    </div>
  </div>
);

export default CreateInvoice;
