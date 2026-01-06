import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth - FreeStays',
  description: 'Login and register to FreeStays',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
