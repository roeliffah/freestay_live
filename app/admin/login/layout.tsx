import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - FreeStays',
  description: 'Admin panel login page',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
