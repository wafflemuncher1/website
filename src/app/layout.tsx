import AppShell from '@/components/AppShell';
import './globals.css';

export const metadata = {
  title: 'GlossWorks KY | Mobile Detailing',
  description: 'Premium mobile detailing services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-black">
      <body className="h-full bg-black text-white antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}