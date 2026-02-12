import './globals.css'
import Header from '@/components/Header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Header />
        {/* We add pt-20 (padding-top) so your content doesn't get hidden under the fixed header */}
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  )
}