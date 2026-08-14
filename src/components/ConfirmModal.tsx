import React from 'react';
import { X, AlertTriangle, Trash2, HelpCircle, CheckCircle2, Info } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getThemeDetails = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-600 animate-pulse" />,
          iconBg: 'bg-rose-50 border border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
          titleColor: 'text-rose-900'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          iconBg: 'bg-emerald-50 border border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
          titleColor: 'text-emerald-900'
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-indigo-600" />,
          iconBg: 'bg-indigo-50 border border-indigo-200',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
          titleColor: 'text-indigo-900'
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: 'bg-amber-50 border border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
          titleColor: 'text-amber-900'
        };
    }
  };

  const theme = getThemeDetails();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header decoration */}
        <div className="p-6 pb-4 flex items-start space-x-4">
          <div className={`p-3 rounded-2xl flex-shrink-0 ${theme.iconBg}`}>
            {theme.icon}
          </div>

          <div className="flex-1 space-y-1">
            <h3 className={`text-base font-extrabold ${theme.titleColor}`}>
              {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition-all"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-white font-extrabold shadow-md transition-all active:scale-95 ${theme.btnBg}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
