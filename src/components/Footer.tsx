export default function Footer() {
  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-900 py-12 px-6 mt-auto">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8">
        
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black tracking-tighter">
            GLOSS<span className="text-blue-600">WORKS</span>KY
          </h2>
          <p className="text-zinc-500 text-sm">Precision Detailing | Louisville, KY</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Connect</h3>
            <a href="#" className="text-sm text-zinc-300 hover:text-blue-500 transition">Instagram</a>
            <a href="#" className="text-sm text-zinc-300 hover:text-blue-500 transition">Facebook</a>
          </div>
          
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact</h3>
            <a href="sms:5025555555" className="text-sm text-zinc-300 hover:text-blue-500 transition">Text for Quote</a>
            <p className="text-sm text-zinc-300">Mt. Washington, KY</p>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 text-[10px] text-zinc-600 uppercase tracking-widest">
          © 2026 GlossWorks KY. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}