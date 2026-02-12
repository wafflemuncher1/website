import { Instagram, Facebook, Youtube } from 'lucide-react'; // You'll need to install lucide-react or use simple SVGs

export default function Footer() {
  const locations = [
    'Mount Washington', 'Louisville', 'Shepherdsville', 
    'Hillview', 'Brooks', 'Taylorsville', 'Fern Creek', 'Highview'
  ];

  return (
    <footer className="w-full bg-black text-white py-16 px-6 md:px-12 border-t border-zinc-900">
      <div className="max-w-screen-xl mx-auto">
        
        {/* RESPONSIVE GRID: 
            grid-cols-2 = 2 columns on mobile
            md:grid-cols-5 = 5 columns on laptop/desktop 
        */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          
          {/* 1. LOCATIONS */}
          <div className="col-span-1">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-zinc-900 pb-2">
              Locations Served
            </h3>
            <ul className="space-y-3">
              {locations.map((city) => (
                <li key={city} className="flex items-center gap-2 text-xs text-zinc-300 whitespace-nowrap">
                  <span className="text-blue-600 text-[8px]">◆</span> {city}, KY
                </li>
              ))}
            </ul>
          </div>

          {/* 2. QUICK LINKS (Desktop only usually, or shared) */}
          <div className="col-span-1">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-zinc-900 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="hover:text-blue-500 cursor-pointer transition">Gift Cards</li>
              <li className="hover:text-blue-500 cursor-pointer transition">Contact Us</li>
            </ul>
          </div>

          {/* 3. SERVICES */}
          <div className="col-span-1">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-zinc-900 pb-2">
              Services
            </h3>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li>Car Detailing</li>
              <li>Ceramic Coating</li>
              <li>Dealership & Fleet</li>
            </ul>
          </div>

          {/* 4. TERMS */}
          <div className="col-span-1">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-zinc-900 pb-2">
              Terms
            </h3>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li>Service Agreement</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>

          {/* 5. CONTACT (Takes full width on mobile if needed, or stays in col) */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-zinc-900 pb-2">
              Contact
            </h3>
            <div className="space-y-4 text-xs text-zinc-300">
              <p className="font-bold text-white">GlossWorks Mobile Detailing</p>
              <p>Monday – Sunday<br/>8:00 AM to 8:00 PM</p>
              <p>Get In Touch <span className="text-blue-500 font-bold">502-555-5555</span></p>
              
              {/* SOCIAL ICONS */}
              <div className="flex gap-4 pt-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-blue-600 transition cursor-pointer">
                  <span className="text-[10px]">IG</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-blue-600 transition cursor-pointer">
                  <span className="text-[10px]">FB</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="pt-8 border-t border-zinc-900 text-center md:text-left">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
            Copyright © 2026 <span className="font-bold text-zinc-400">GlossWorks Mobile Detailing</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}