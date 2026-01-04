'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags } from '@/i18n/request';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (newLocale: string) => {
    // Save user's preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; max-age=${60 * 60 * 24 * 365}; path=/`;
    
    // Remove current locale from pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');
    
    router.push(newPathname);
  };

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className="w-[140px] h-10 border rounded-md flex items-center px-3">
        <span className="flex items-center gap-2">
          <span>{localeFlags[locale as keyof typeof localeFlags]}</span>
          <span className="text-sm">{localeNames[locale as keyof typeof localeNames]}</span>
        </span>
      </div>
    );
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{localeFlags[locale as keyof typeof localeFlags]}</span>
            <span className="text-sm">{localeNames[locale as keyof typeof localeNames]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
