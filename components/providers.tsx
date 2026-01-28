'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { initCsrfProtection } from '@/lib/security/csrf-protection';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Initialize CSRF protection on mount
  useEffect(() => {
    initCsrfProtection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <AntApp>
          <Toaster position="top-right" richColors />
          {children}
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
