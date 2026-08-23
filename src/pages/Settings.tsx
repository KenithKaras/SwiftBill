import React, { useState, useMemo } from 'react';
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
  Trash2,
  Sliders,
  Sparkles,
  Type,
  AlignLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import FormInput from '../components/ui/FormInput';
import { logger } from '../lib/logger';


const isValidUrl = (url: string) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const Settings = () => {
  const { user, businessData, refreshBusinessData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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
    borderRadius: businessData?.customization?.borderRadius || 'md',
    borderWidth: businessData?.customization?.borderWidth || 'thin',
    spacing: businessData?.customization?.spacing || 'comfortable',
    tableStyle: businessData?.customization?.tableStyle || 'default',
    showQrCode: businessData?.customization?.showQrCode !== false,
    showSignature: businessData?.customization?.showSignature !== false,
    paperSize: businessData?.customization?.paperSize || 'A4',
  });

  React.useEffect(() => {
    if (businessData) {
      setFormData({
        businessName: businessData.businessName || '',
        businessLogo: businessData.businessLogo || '',
        address: businessData.address || '',
        gstNumber: businessData.gstNumber || '',
        primaryColor: businessData.primaryColor || '#2563eb',
        accentColor: businessData.accentColor || '#0f172a',
        letterheadImage: businessData.letterheadImage || '',
        fontFamily: businessData.fontFamily || 'Inter',
        headerHeight: businessData.headerHeight || 100,
        logoPosition: businessData.logoPosition || 'left',
        fontSize: businessData.fontSize || 14,
        borderRadius: businessData.customization?.borderRadius || 'md',
        borderWidth: businessData.customization?.borderWidth || 'thin',
        spacing: businessData.customization?.spacing || 'comfortable',
        tableStyle: businessData.customization?.tableStyle || 'default',
        showQrCode: businessData.customization?.showQrCode !== false,
        showSignature: businessData.customization?.showSignature !== false,
        paperSize: businessData.customization?.paperSize || 'A4',
      });
    }
  }, [businessData]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (formData.businessLogo && !isValidUrl(formData.businessLogo)) {
      errors.businessLogo = 'Logo must be a valid HTTP or HTTPS URL.';
    }
    if (formData.letterheadImage && !isValidUrl(formData.letterheadImage)) {
      errors.letterheadImage = 'Letterhead must be a valid HTTP or HTTPS URL.';
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.primaryColor)) {
      errors.primaryColor = 'Must be a 6-character hex code (e.g. #2563eb).';
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.accentColor)) {
      errors.accentColor = 'Must be a 6-character hex code (e.g. #0f172a).';
    }
    if (formData.businessName.length > 100) {
      errors.businessName = 'Business name cannot exceed 100 characters.';
    }
    if (formData.gstNumber.length > 50) {
      errors.gstNumber = 'GST Number cannot exceed 50 characters.';
    }
    if (formData.address.length > 500) {
      errors.address = 'Address cannot exceed 500 characters.';
    }
    return errors;
  }, [formData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg('');
    setSuccess(false);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMsg('Please correct all validation errors before saving.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: formData.businessName.trim(),
          business_logo: formData.businessLogo.trim(),
          address: formData.address.trim(),
          gst_number: formData.gstNumber.trim(),
          primary_color: formData.primaryColor.trim(),
          accent_color: formData.accentColor.trim(),
          letterhead_image: formData.letterheadImage.trim(),
          font_family: formData.fontFamily,
          header_height: Number(formData.headerHeight),
          logo_position: formData.logoPosition,
          font_size: Number(formData.fontSize),
          customization: {
            borderRadius: formData.borderRadius,
            borderWidth: formData.borderWidth,
            spacing: formData.spacing,
            tableStyle: formData.tableStyle,
            showQrCode: formData.showQrCode,
            showSignature: formData.showSignature,
            paperSize: formData.paperSize
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshBusinessData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      logger.error("Update profile error caught in component", error);
      setErrorMsg(error.message || "Failed to update profile settings. Verify your permission and connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none pb-12">
      {/* Title Header */}
      <div className="border-b border-hairline pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Settings</h1>
          <p className="text-grey mt-1.5 text-sm">Configure company details and custom PDF branding.</p>
        </div>

        <motion.button
          onClick={handleUpdate}
          disabled={loading || Object.keys(validationErrors).length > 0}
          whileHover={{ scale: (loading || Object.keys(validationErrors).length > 0) ? 1 : 1.02 }}
          whileTap={{ scale: (loading || Object.keys(validationErrors).length > 0) ? 1 : 0.98 }}
          className={`px-8 py-3.5 rounded text-xs font-semibold uppercase tracking-wide flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            success
              ? 'bg-positive text-white'
              : 'bg-ink hover:bg-accent text-paper'
          }`}
        >
          {loading ? 'Saving…' : success ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save changes</>}
        </motion.button>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-100/50 text-rose-600 p-4.5 rounded-2xl text-xs font-bold text-left"
        >
          {errorMsg}
        </motion.div>
      )}

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Settings Cards */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Company Profile Info */}
          <div className="bg-white p-6 sm:p-8 rounded border border-hairline space-y-6">
            <h3 className="font-display font-semibold flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <Building2 size={16} className="text-blue-600" /> Company Profile
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 overflow-hidden relative shrink-0">
                {formData.businessLogo && isValidUrl(formData.businessLogo) ? (
                  <img src={formData.businessLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-slate-400" />
                    <span className="text-[8px] mt-1 font-bold uppercase tracking-widest text-slate-400">Empty</span>
                  </>
                )}
              </div>
              <div className="flex-1 w-full">
                <FormInput 
                  label="Company Logo URL"
                  type="text" 
                  placeholder="e.g. https://yourdomain.com/logo.png"
                  value={formData.businessLogo}
                  onChange={(v) => setFormData(prev => ({ ...prev, businessLogo: v }))}
                  error={validationErrors.businessLogo}
                />
              </div>
            </div>

            <div className="space-y-4">
              <FormInput 
                label="Business Name" 
                value={formData.businessName} 
                onChange={(v) => setFormData(prev => ({ ...prev, businessName: v }))}
                icon={<Building2 size={15} />}
                placeholder="e.g. Acme Billing Ltd."
                error={validationErrors.businessName}
              />
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> Business Address
                </label>
                <textarea 
                  className="w-full bg-slate-50 hover:bg-slate-100/40 border border-slate-200 rounded-2xl p-4 text-xs h-28 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700 placeholder-slate-400 resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street Address, Postcode, City, Country"
                  maxLength={500}
                />
                {validationErrors.address && <p className="text-[10px] text-rose-500 font-bold mt-1">{validationErrors.address}</p>}
              </div>

              <FormInput 
                label="GST Registration Number" 
                value={formData.gstNumber} 
                onChange={(v) => setFormData(prev => ({ ...prev, gstNumber: v }))}
                icon={<Hash size={15} />}
                placeholder="e.g. 29AAAAA0000A1Z5"
                error={validationErrors.gstNumber}
              />
            </div>
          </div>

          {/* Card 2: Custom Brand Color Presets */}
          <div className="bg-white p-6 sm:p-8 rounded border border-hairline space-y-5">
            <h3 className="font-display font-semibold flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <Sliders size={16} className="text-blue-600" /> Branding Colors
            </h3>
            <p className="text-[11px] text-slate-400 font-medium -mt-2">Configure primary and secondary color accents used inside custom billing documents.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Primary Color (Border & Headers)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={formData.primaryColor}
                    onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200/60 p-0 overflow-hidden"
                  />
                  <input 
                    type="text"
                    value={formData.primaryColor}
                    onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {validationErrors.primaryColor && <p className="text-[10px] text-rose-500 font-bold mt-1">{validationErrors.primaryColor}</p>}
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Accent/Text Color (Highlights)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={formData.accentColor}
                    onChange={e => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200/60 p-0 overflow-hidden"
                  />
                  <input 
                    type="text"
                    value={formData.accentColor}
                    onChange={e => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {validationErrors.accentColor && <p className="text-[10px] text-rose-500 font-bold mt-1">{validationErrors.accentColor}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Template fine-tuning & letterhead */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Layout Customizer */}
          <div className="bg-white p-6 rounded border border-hairline space-y-5">
            <h3 className="font-display font-semibold flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <Type size={16} className="text-blue-600" /> Template Fine-Tuning
            </h3>
            
            <div className="space-y-4">
              {/* Font Family selector */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Base Font Family</label>
                <select 
                  value={formData.fontFamily}
                  onChange={e => setFormData(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Inter">Sans Serif (Inter)</option>
                  <option value="'Playfair Display', serif">Serif (Playfair Display)</option>
                  <option value="'JetBrains Mono', monospace">Monospace (JetBrains Mono)</option>
                </select>
              </div>

              {/* Logo position header alignment */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Header Alignment</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                  {['left', 'center', 'right'].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoPosition: pos as any }))}
                      className={`flex-1 py-2 text-[9px] font-semibold uppercase tracking-wide rounded-sm transition-colors cursor-pointer ${formData.logoPosition === pos ? 'bg-ink text-paper' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Range Slider for height */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Header Container Height</label>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                  <input 
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={formData.headerHeight}
                    onChange={e => setFormData(prev => ({ ...prev, headerHeight: Number(e.target.value) }))}
                    className="flex-1 cursor-pointer accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="text-[10px] font-bold text-slate-500 w-12 text-right">{formData.headerHeight}px</span>
                </div>
              </div>

              {/* Font Size Counter */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Default Base Font Size</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 1) }))} 
                    className="w-10 h-10 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center justify-center font-bold text-base cursor-pointer"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-xl py-2.5 font-bold text-xs text-slate-700">{formData.fontSize}px</div>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, fontSize: Math.min(24, prev.fontSize + 1) }))} 
                    className="w-10 h-10 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center justify-center font-bold text-base cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                {/* Spacing */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Default Spacing</label>
                  <select 
                    value={formData.spacing}
                    onChange={e => setFormData(prev => ({ ...prev, spacing: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="compact">Compact Space</option>
                    <option value="comfortable">Comfortable Grid</option>
                    <option value="spacious">Spacious Breathing</option>
                  </select>
                </div>

                {/* Border Radius */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Border Corner Radius</label>
                  <select 
                    value={formData.borderRadius}
                    onChange={e => setFormData(prev => ({ ...prev, borderRadius: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="none">Sharp Corners (None)</option>
                    <option value="sm">Small (sm)</option>
                    <option value="md">Medium (md)</option>
                    <option value="lg">Large (lg)</option>
                    <option value="full">Fully Rounded (full)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ribbon Width */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Top Ribbon Width</label>
                  <select 
                    value={formData.borderWidth}
                    onChange={e => setFormData(prev => ({ ...prev, borderWidth: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="none">No Ribbon</option>
                    <option value="thin">Thin Accent Line</option>
                    <option value="medium">Medium Accent Block</option>
                    <option value="thick">Thick Banner Block</option>
                  </select>
                </div>

                {/* Table Style */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Default Table Layout</label>
                  <select 
                    value={formData.tableStyle}
                    onChange={e => setFormData(prev => ({ ...prev, tableStyle: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="default">Default Colors</option>
                    <option value="striped">Zebra Striped Rows</option>
                    <option value="grid">Bordered Grid Box</option>
                    <option value="minimal">Ultra Clean Minimalist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Paper Size */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Default Paper Size</label>
                  <select 
                    value={formData.paperSize}
                    onChange={e => setFormData(prev => ({ ...prev, paperSize: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="A4">A4 (794px x 1123px)</option>
                    <option value="letter">US Letter (8.5" x 11")</option>
                  </select>
                </div>

                {/* Checkbox settings */}
                <div className="space-y-2 text-left flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.showQrCode} 
                      onChange={e => setFormData(prev => ({ ...prev, showQrCode: e.target.checked }))}
                      className="rounded border-slate-200 text-blue-600 accent-blue-600"
                    />
                    <span>Show QR Code by default</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.showSignature} 
                      onChange={e => setFormData(prev => ({ ...prev, showSignature: e.target.checked }))}
                      className="rounded border-slate-200 text-blue-600 accent-blue-600"
                    />
                    <span>Show Representative Signature</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Invoice Letterhead full graphic */}
          <div className="bg-white p-6 rounded border border-hairline space-y-5">
            <h3 className="font-display font-semibold flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <ImagePlus size={16} className="text-blue-600" /> Letterhead Image
            </h3>
            <p className="text-[11px] text-slate-400 font-medium -mt-2">Provide an optional full-width header block graphic to serve as the invoice letterhead.</p>
            
            <div className="space-y-4">
              <FormInput 
                value={formData.letterheadImage} 
                onChange={(v) => setFormData(prev => ({ ...prev, letterheadImage: v }))}
                icon={<ImagePlus size={14} />}
                placeholder="https://yourdomain.com/letterhead.png"
                error={validationErrors.letterheadImage}
              />
              {formData.letterheadImage && isValidUrl(formData.letterheadImage) && (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50 p-2 shadow-inner">
                  <img 
                    src={formData.letterheadImage} 
                    alt="Letterhead Preview" 
                    className="w-full max-h-40 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, letterheadImage: '' }))}
                    className="absolute top-3.5 right-3.5 p-2 bg-white/95 hover:bg-white text-rose-500 rounded-full shadow-md backdrop-blur-sm transition-all border border-slate-100 hover:scale-105 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
