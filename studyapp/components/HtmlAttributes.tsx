'use client';

import { useLanguage } from '@/components/providers/LanguageContext';
import { useEffect } from 'react';

export default function HtmlAttributes() {
  const { language } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    if (language === 'ar') {
      html.classList.add('arabic');
    } else {
      html.classList.remove('arabic');
    }
  }, [language]);

  return null;
}