import './globals.css'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer' // Import the new footer

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* min-h-screen and flex-col ensures the footer is pushed to the bottom */}
      <body className="bg-black text-white min-h-screen flex flex-col">
        <Sidebar />
        
        {/* main grow ensures this area takes up all available space */}
        <main className="flex-grow">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  )
}