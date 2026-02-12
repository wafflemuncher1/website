export default function Footer() {
  const locations = [
    'Mount Washington', 'Louisville', 'Shepherdsville', 'Hillview', 
    'Brooks', 'Taylorsville', 'Fern Creek', 'Highview', 'Fairdale'
  ];

  return (
    <footer className="w-full bg-black text-white pt-12 pb-8 px-6 border-t border-zinc-900">
      <div className="max-w-md mx-auto">
        
        {/* ROW 1: LOCATIONS & QUICK LINKS */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-10">
          <div>
            <h3 className="text-zinc-400 font-medium uppercase text-[11px] tracking-widest mb-4 border-b border-zinc-800 pb-2">
              Locations Served
            </h3>
            <ul className="space-y-3">
              {locations.map((city) => (
                <li key={city} className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <span className="text-blue-600 text-[8px]">◆</span> {city}, KY
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-zinc-400 font-medium uppercase text-[11px] tracking-widest mb-4 border-b border-zinc-800 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-3 text-[11px] text-zinc-300">
              <li>Gift Cards</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>

        {/* ROW 2: SERVICES & TERMS */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-12">
          <div>
            <h3 className="text-zinc-400 font-medium uppercase text-[11px] tracking-widest mb-4 border-b border-zinc-800 pb-2">
              Services
            </h3>
            <ul className="space-y-3 text-[11px] text-zinc-300">
              <li>Car Detailing</li>
              <li>Ceramic Coating</li>
              <li>Fleet Cleaning</li>
            </ul>
          </div>

          <div>
            <h3 className="text-zinc-400 font-medium uppercase text-[11px] tracking-widest mb-4 border-b border-zinc-800 pb-2">
              Terms
            </h3>
            <ul className="space-y-3 text-[11px] text-zinc-300">
              <li>Service Agreement</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>

        {/* ROW 3: CONTACT (Centered) */}
        <div className="text-center mb-16">
          <h3 className="text-zinc-400 font-medium uppercase text-[11px] tracking-widest mb-6 border-b border-zinc-800 pb-2 inline-block w-full">
            Contact
          </h3>
          <div className="space-y-2 text-[12px] text-zinc-300">
            <p className="font-bold">GlossWorks Mobile Detailing</p>
            <p>Monday – Sunday 8:00 AM to 8:00 PM</p>
            <p>Get In Touch <a href="tel:5025555555" className="hover:text-blue-500 underline decoration-zinc-700">502-555-5555</a></p>
          </div>
        </div>

        {/* FINAL COPYRIGHT */}
        <div className="text-center pt-8">
          <p className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] leading-relaxed">
            Copyright © 2026 <span className="font-bold text-zinc-400">GlossWorks Mobile Detailing</span>. <br/>All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}