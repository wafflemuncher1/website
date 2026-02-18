import Header from '@/components/Header';
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
    <html lang="en" className="bg-black">
      <body className="bg-black text-white antialiased">
        <div className="flex flex-col min-h-screen">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}