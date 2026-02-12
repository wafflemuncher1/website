import './globals.css';
import Sidebar from '@/components/Sidebar'; // Points to the clean component folder

export const metadata = {
  title: 'GlossWorks KY | Mobile Detailing',
  description: 'Premium mobile detailing in Mt. Washington, KY',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {/* The Sidebar is a "Global" component here */}
        <Sidebar /> 
        
        {/* main wraps your page content. pt-20 adds space so content 
            doesn't hide behind your fixed header/sidebar button */}
        <main className="pt-20 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}