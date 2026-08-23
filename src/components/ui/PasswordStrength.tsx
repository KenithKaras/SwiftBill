import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export interface PasswordRule {
  id: string;
  label: string;
  test: (p: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'At least 1 numeric character', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character (@$!%*?& etc.)', test: (p) => /[@$!%*?&_#^()\-+=~`]/.test(p) },
];

export const isPasswordStrong = (password: string): boolean => {
  return PASSWORD_RULES.every(rule => rule.test(password));
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const passedRules = PASSWORD_RULES.filter(rule => rule.test(password)).length;
  
  // Calculate percentage and color
  const strengthPercentage = (passedRules / PASSWORD_RULES.length) * 100;
  
  const getStrengthConfig = () => {
    if (passedRules <= 1) return { color: 'bg-rose-500', text: 'Weak', textColor: 'text-rose-600' };
    if (passedRules <= 3) return { color: 'bg-amber-500', text: 'Medium', textColor: 'text-amber-600' };
    return { color: 'bg-emerald-500', text: 'Strong', textColor: 'text-emerald-600' };
  };

  const config = getStrengthConfig();

  return (
    <div className="space-y-3 p-4 bg-paper border border-hairline rounded animate-fadeIn">
      <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.14em] text-grey">
        <span>Password Strength</span>
        <span className={`${config.textColor} font-semibold`}>{config.text}</span>
      </div>
      
      {/* Strength Bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${config.color} transition-all duration-350 ease-out`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>
      
      {/* Checklist */}
      <ul className="space-y-1.5 pt-1">
        {PASSWORD_RULES.map((rule) => {
          const isPassed = rule.test(password);
          return (
            <li 
              key={rule.id}
              className={`flex items-center gap-2 text-[10px] font-medium transition-colors ${
                isPassed ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                isPassed 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-slate-100 border-slate-200 text-slate-300'
              }`}>
                {isPassed ? <Check size={8} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
              </div>
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
