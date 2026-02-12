export default function Footer() {
  const locations = [
    'Mount Washington', 'Louisville', 'Shepherdsville', 
    'Hillview', 'Brooks', 'Taylorsville', 'Fern Creek', 'Highview'
  ];

  return (
    <footer className="w-full bg-black text-white py-12 px-6 border-t border-zinc-900">
      <div className="max-w-screen-xl mx-auto">
        
        {/* TOP SECTION: Two Columns on Mobile */}
        <div className="grid grid-cols-2 gap-10 mb-12">
          
          {/* Column 1: Locations */}
          <div>
            <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-6 border-b border-zinc-900 pb-2">
              Locations Served
            </h3>
            <ul className="space-y-3">
              {locations.map((city) => (
                <li key={city} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-blue-600 text-[10px]">◆</span> {city}, KY
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Quick Links & Services */}
          <div className="space-y-10">
            <div>
              <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-6 border-b border-zinc-900 pb-2">
                Services
              </h3>
              <ul className="space-y-3 text-sm text-zinc-300 font-medium">
                <li>Car Detailing</li>
                <li>Ceramic Coating</li>
                <li>Fleet Cleaning</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-6 border-b border-zinc-900 pb-2">
                Contact
              </h3>
              <p className="text-sm text-zinc-300">Mon - Sun</p>
              <p className="text-sm text-zinc-300 mb-4">8:00 AM - 8:00 PM</p>
              <a href="tel:5025555555" className="text-blue-500 font-bold text-sm">502-555-5555</a>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Copyright */}
        <div className="pt-8 border-t border-zinc-900 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
            Copyright © 2026 GlossWorks Mobile Detailing. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}