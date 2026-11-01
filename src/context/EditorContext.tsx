import React, { createContext, useContext, useState, useEffect } from 'react';
import { COMPANY_DATA } from '../data/companyData';

export type UserRole = 'owner' | 'editor' | 'viewer';

export interface EditableSiteSettings {
  hotline: string;
  whatsapp: string;
  phone2: string;
  phone3: string;
  winchBasePrice: number;
  acUnitPrice: number;
  promoDiscountText: string;
  heroHeadline: string;
  heroSubheadline: string;
}

const DEFAULT_SETTINGS: EditableSiteSettings = {
  hotline: COMPANY_DATA.phones[0].number,
  whatsapp: COMPANY_DATA.whatsappDefault,
  phone2: COMPANY_DATA.phones[1]?.number || '01128418399',
  phone3: COMPANY_DATA.phones[2]?.number || '01019785437',
  winchBasePrice: 1700,
  acUnitPrice: 800,
  promoDiscountText: 'خصم 10% على باقات نقل الفلل والشقق + معاينة مجانية!',
  heroHeadline: 'مش أي حد يشيل عفشك.. يستاهل ثقتك!',
  heroSubheadline: 'إحنا مش بننقل عفش وبس.. إحنا بننقل بيتك بكل اللي فيه من ذكريات ❤️',
};

interface EditorContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isOwner: boolean;
  isEditor: boolean;
  userEmail: string;
  settings: EditableSiteSettings;
  updateSettings: (newSettings: Partial<EditableSiteSettings>) => void;
  resetSettings: () => void;
  openEditorModal: () => void;
  closeEditorModal: () => void;
  isEditorModalOpen: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'owner' for aly353000@gmail.com
  const [role, setRole] = useState<UserRole>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const paramRole = urlParams.get('role');
        if (paramRole === 'owner' || paramRole === 'editor' || paramRole === 'viewer') {
          return paramRole as UserRole;
        }
        const saved = localStorage.getItem('shilha_user_role');
        if (saved === 'owner' || saved === 'editor' || saved === 'viewer') {
          return saved as UserRole;
        }
      }
    } catch {
      // Fallback
    }
    return 'owner';
  });

  const userEmail = 'aly353000@gmail.com';
  const isOwner = role === 'owner';
  const isEditor = role === 'owner' || role === 'editor';

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const [settings, setSettings] = useState<EditableSiteSettings>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('shilha_site_settings');
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('shilha_user_role', role);
    } catch {
      // Ignore
    }
  }, [role]);

  useEffect(() => {
    try {
      localStorage.setItem('shilha_site_settings', JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<EditableSiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem('shilha_site_settings');
    } catch {
      // Ignore
    }
  };

  const openEditorModal = () => setIsEditorModalOpen(true);
  const closeEditorModal = () => setIsEditorModalOpen(false);

  return (
    <EditorContext.Provider
      value={{
        role,
        setRole,
        isOwner,
        isEditor,
        userEmail,
        settings,
        updateSettings,
        resetSettings,
        openEditorModal,
        closeEditorModal,
        isEditorModalOpen,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
