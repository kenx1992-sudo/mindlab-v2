'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LANG_OPTIONS, setLanguage, markLanguageSet } from '@/lib/locale';

/**
 * Shown once when language has never been explicitly set.
 * User picks a language and we mark it as done.
 */
export default function LanguageSetupGate({ onComplete }) {
  const [selected, setSelected] = useState('zh-HK');

  function confirm() {
    setLanguage(selected);
    markLanguageSet();
    onComplete();
  }

  const labels = {
    'zh-HK': { title: '歡迎 · Welcome', subtitle: '請先選擇你的語言 · Please choose your language', btn: '確認開始' },
    'zh-TW': { title: '歡迎 · Welcome', subtitle: '請先選擇你的語言 · Please choose your language', btn: '確認開始' },
    en:      { title: 'Welcome · 歡迎',  subtitle: 'Please choose your language · 請先選擇你的語言', btn: 'Let\'s go' },
  };
  const ui = labels[selected] || labels['zh-HK'];

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <h1 className="font-playfair text-3xl font-bold text-foreground mb-2 text-center">{ui.title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">{ui.subtitle}</p>

        <div className="space-y-3 mb-8">
          {LANG_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={`w-full py-4 rounded-2xl border font-semibold text-sm transition-all ${
                selected === value
                  ? 'bg-primary text-primary-foreground border-primary calm-glow-ring'
                  : 'bg-card border-border text-foreground hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={confirm}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm calm-glow-ring"
        >
          {ui.btn}
        </button>
      </motion.div>
    </div>
  );
}