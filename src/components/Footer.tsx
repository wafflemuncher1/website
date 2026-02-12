export default function Footer() {
  return (
    <footer className="w-full py-10 px-6 border-t border-zinc-900 bg-black">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black tracking-tighter italic">
            GLOSS<span className="text-blue-600">WORKS</span>KY
          </h2>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">
            Mount Washington • Louisville
          </p>
        </div>
        <a 
          href="sms:5025555555" 
          className="text-blue-600 font-bold text-sm hover:underline"
        >
          TEXT FOR QUOTE
        </a>
      </div>
    </footer>
  )
}