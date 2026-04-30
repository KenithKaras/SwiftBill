import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Image as ImageIcon, 
  MapPin, 
  Hash, 
  Save, 
  Check,
  ImagePlus,
  Trash2
} from 'lucide-react';

const Settings = () => {
  const { user, businessData, refreshBusinessData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: businessData?.businessName || '',
    businessLogo: businessData?.businessLogo || '',
    address: businessData?.address || '',
    gstNumber: businessData?.gstNumber || '',
    primaryColor: businessData?.primaryColor || '#2563eb',
    accentColor: businessData?.accentColor || '#0f172a',
    letterheadImage: businessData?.letterheadImage || '',
    fontFamily: businessData?.fontFamily || 'Inter',
    headerHeight: businessData?.headerHeight || 100,
    logoPosition: businessData?.logoPosition || 'left',
    fontSize: businessData?.fontSize || 14,
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: formData.businessName,
          business_logo: formData.businessLogo,
          address: formData.address,
          gst_number: formData.gstNumber,
          primary_color: formData.primaryColor,
          accent_color: formData.accentColor,
          letterhead_image: formData.letterheadImage,
          font_family: formData.fontFamily,
          header_height: Number(formData.headerHeight),
          logo_position: formData.logoPosition,
          font_size: Number(formData.fontSize),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshBusinessData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Update error:", error);
      alert("Failed to update: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
        <p className="text-slate-500 mt-1">Configure your branding and company information for invoices.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="flex items-center gap-8 pb-10 border-b border-slate-100 mb-2">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative group">
              {formData.businessLogo ? (
                <img src={formData.businessLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <ImageIcon size={32} />
                  <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">Upload</span>
                </>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-slate-900">Company Logo</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Update your business branding for all invoices.</p>
              <input 
                type="text" 
                placeholder="Paste Logo URL here..."
                className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                value={formData.businessLogo}
                onChange={(e) => setFormData({...formData, businessLogo: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <SettingsInput 
              label="Business Name" 
              value={formData.businessName} 
              onChange={(v: string) => setFormData({...formData, businessName: v})}
              icon={<Building2 size={18} />}
              placeholder="e.g. BillFlow Inc."
            />
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                <MapPin size={14} className="text-blue-600" /> Business Address
              </label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Street address, City, Country, ZIP"
              />
            </div>

            <SettingsInput 
              label="GST Number" 
              value={formData.gstNumber} 
              onChange={(v: string) => setFormData({...formData, gstNumber: v})}
              icon={<Hash size={18} />}
              placeholder="e.g. 29AAAAA0000A1Z5"
            />

            <div className="pt-6 border-t border-slate-100 flex flex-col gap-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Brand Colors (for Custom Template)
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={formData.primaryColor}
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <input 
                      type="text"
                      value={formData.primaryColor}
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Accent/Text Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={formData.accentColor}
                      onChange={e => setFormData({...formData, accentColor: e.target.value})}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <input 
                      type="text"
                      value={formData.accentColor}
                      onChange={e => setFormData({...formData, accentColor: e.target.value})}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col gap-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Template Fine-Tuning
              </h3>
              <p className="text-xs text-slate-500 -mt-2">Customize the font and layout of your custom template.</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Font Family</label>
                  <select 
                    value={formData.fontFamily}
                    onChange={e => setFormData({...formData, fontFamily: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="Inter">Sans Serif (Modern)</option>
                    <option value="'Playfair Display', serif">Serif (Elegant)</option>
                    <option value="'JetBrains Mono', monospace">Monospace (Technical)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Header Alignment</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                    {['left', 'center', 'right'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setFormData({...formData, logoPosition: pos as any})}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${formData.logoPosition === pos ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Header Height (px)</label>
                  <input 
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={formData.headerHeight}
                    onChange={e => setFormData({...formData, headerHeight: Number(e.target.value)})}
                    className="w-full cursor-pointer accent-blue-600"
                  />
                  <div className="text-[10px] text-right font-bold text-slate-400">{formData.headerHeight}px</div>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Base Font Size (px)</label>
                   <div className="flex items-center gap-3">
                     <button type="button" onClick={() => setFormData({...formData, fontSize: Math.max(10, formData.fontSize - 1)})} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">-</button>
                     <div className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-xl py-2 font-bold text-slate-800">{formData.fontSize}px</div>
                     <button type="button" onClick={() => setFormData({...formData, fontSize: Math.min(24, formData.fontSize + 1)})} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">+</button>
                   </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col gap-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Full Invoice Letterhead / Template
              </h3>
              <p className="text-xs text-slate-500 -mt-2">Upload your custom header or full-page template image to replace the standard header.</p>
              <div className="space-y-4">
                <SettingsInput 
                  label="Letterhead Image URL" 
                  value={formData.letterheadImage} 
                  onChange={(v: string) => setFormData({...formData, letterheadImage: v})}
                  icon={<ImagePlus size={18} />}
                  placeholder="https://example.com/letterhead.png"
                />
                {formData.letterheadImage && (
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                    <img 
                      src={formData.letterheadImage} 
                      alt="Letterhead Preview" 
                      className="w-full max-h-48 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, letterheadImage: ''})}
                      className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-red-500 rounded-full shadow-lg backdrop-blur-sm transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end">
            <button
              disabled={loading}
              className={`px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] ${
                success 
                ? 'bg-emerald-500 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving Changes...' : success ? <><Check size={20} /> Changes Saved</> : <><Save size={20} /> Save Settings</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsInput = ({ label, value, onChange, icon, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
      <span className="text-accent">{icon}</span> {label}
    </label>
    <div className="relative">
      <input 
        type="text" 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
      />
    </div>
  </div>
);

export default Settings;
