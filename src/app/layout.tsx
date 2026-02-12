import './globals.css'

export const metadata = {
  title: 'GlossWorks KY',
  description: 'Premium Mobile Detailing in Mount Washington, KY',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* We removed the Sidebar and Footer here. It's now a clean slate. */}
        {children}
      </body>
    </html>
  )
}