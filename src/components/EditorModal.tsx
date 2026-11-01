import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings2, 
  X, 
  Save, 
  RotateCcw, 
  Check, 
  Phone, 
  DollarSign, 
  Sparkles, 
  Crown,
  Edit3,
  Eye,
  ExternalLink,
  ShieldCheck,
  Key
} from 'lucide-react';
import { useEditor, UserRole } from '../context/EditorContext';

export const EditorModal: React.FC = () => {
  const { 
    role,
    setRole,
    isOwner,
    isEditor,
    userEmail,
    settings, 
    updateSettings, 
    resetSettings, 
    isEditorModalOpen, 
    closeEditorModal,
    openEditorModal 
  } = useEditor();

  const [formData, setFormData] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync formData when modal opens or settings change
  React.useEffect(() => {
    setFormData(settings);
  }, [settings, isEditorModalOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      closeEditorModal();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('هل تريد استعادة الإعدادات الافتراضية للأسعار وأرقام الهواتف؟')) {
      resetSettings();
      setFormData(settings);
      closeEditorModal();
    }
  };

  return (
    <>
      {/* Floating Role Switcher & Owner/Editor Badge */}
      <aside aria-label="شريط إدارة صلاحيات المالك والمحرر" className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        {isEditor ? (
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-amber-500/40 backdrop-blur-md">
            <button
              type="button"
              onClick={openEditorModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950" />
              <span>لوحة المالك والمحرر (Owner & Editor)</span>
            </button>

            <button
              type="button"
              onClick={() => setRole(role === 'owner' ? 'editor' : role === 'editor' ? 'viewer' : 'owner')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="تبديل الصلاحية"
            >
              <span>{role === 'owner' ? '👑 Owner' : role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRole('owner');
              openEditorModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-blue-900 text-amber-300 hover:text-white text-xs font-bold rounded-2xl shadow-xl border border-amber-500/40 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            title="تفعيل صلاحيات المالك (Switch to Owner)"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>تفعيل صلاحية المالك (Owner)</span>
          </button>
        )}
      </aside>

      {/* Editor & Owner Settings Modal */}
      <AnimatePresence>
        {isEditorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-amber-400/50 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-right p-6 sm:p-8 space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        لوحة تحكم المالك والمحرر (Owner & Editor)
                      </h3>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                        👑 أعلى مستوى صلاحيات
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>حساب المالك المعتمد:</span>
                      <span className="font-mono font-bold text-blue-700 dir-ltr">{userEmail}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEditorModal}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Role Switcher Selector Tabs */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>الصلاحية الحالية للحساب:</span>
                  <span className="font-black text-blue-900">
                    {role === 'owner' ? 'مالك المشروع (Owner)' : role === 'editor' ? 'محرر كامل (Editor)' : 'مشاهد فقط (Viewer)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      role === 'owner'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>👑 Owner (مالك)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('editor')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      role === 'editor'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>✏️ Editor (محرر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      role === 'viewer'
                        ? 'bg-slate-700 text-white border-slate-800 shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>👁️ Viewer (مشاهد)</span>
                  </button>
                </div>
              </div>

              {/* Google Cloud Console IAM & AI Studio Guidance Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>صلاحيات Google Cloud Console IAM و AI Studio:</span>
                  </div>
                  <a
                    href="https://console.cloud.google.com/iam-admin/iam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-black text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
                  >
                    <span>فتح Google Cloud IAM</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  لإضافة بريدك <strong>{userEmail}</strong> كـ <strong>Owner</strong> أو <strong>Editor</strong> في مشروع Google Cloud:
                  ادخل إلى <a href="https://console.cloud.google.com/iam-admin/iam" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-700">Google Cloud IAM</a> ⬅ اضغط <strong>Grant Access</strong> ⬅ أدخل بريدك ⬅ اختر الدور <strong>Owner</strong> (<code>roles/owner</code>) أو <strong>Editor</strong> (<code>roles/editor</code>).
                </p>
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-pulse">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم حفظ التعديلات وتحديث محتوى الموقع بصلاحية المالك بنجاح!</span>
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleSave} className="space-y-5">
                
                {/* 1. Phone Numbers & WhatsApp */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>أرقام الهواتف وخدمة العملاء والواتساب</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">الخط الساخن والحجوزات</label>
                      <input
                        type="text"
                        value={formData.hotline}
                        onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-left dir-ltr text-xs focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">رقم الواتساب الرسمي</label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-left dir-ltr text-xs focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">هاتف خدمة العملاء (2)</label>
                      <input
                        type="text"
                        value={formData.phone2}
                        onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-left dir-ltr text-xs focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">هاتف إدارة العمليات (3)</label>
                      <input
                        type="text"
                        value={formData.phone3}
                        onChange={(e) => setFormData({ ...formData, phone3: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-left dir-ltr text-xs focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Key Service Prices */}
                <div className="space-y-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="text-xs sm:text-sm font-black text-blue-950 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>أسعار الخدمات المعتمدة بالموقع</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">سعر بدء الونش الهيدروليكي (ج.م)</label>
                      <input
                        type="number"
                        min="500"
                        step="50"
                        value={formData.winchBasePrice}
                        onChange={(e) => setFormData({ ...formData, winchBasePrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">سعر فك وتركيب التكييف للوحدة (ج.م)</label>
                      <input
                        type="number"
                        min="200"
                        step="50"
                        value={formData.acUnitPrice}
                        onChange={(e) => setFormData({ ...formData, acUnitPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Promotional Banners */}
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>نص العرض الترويجي والخصم الحالي</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">نص البنر الترويجي العلوي</label>
                    <input
                      type="text"
                      value={formData.promoDiscountText}
                      onChange={(e) => setFormData({ ...formData, promoDiscountText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:border-amber-600 outline-none"
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الافتراضي</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeEditorModal}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>حفظ التعديلات بصلاحية المالك ✓</span>
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
