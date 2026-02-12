import PricingCard from '@/components/PricingCard'

export default function Home() {
  return (
    <div className="flex flex-col bg-black text-white">
      
      {/* 1. HERO: The "First Impression" */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-20 relative overflow-hidden">
        {/* Subtle Gradient Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10">
          <h1 className="text-[18vw] md:text-[12vw] font-black leading-[0.8] tracking-tighter mb-8">
            GLOSS<br />
            <span className="text-blue-600">WORKS</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-2xl max-w-lg mb-12 leading-tight">
            Premium mobile detailing systems for Mt. Washington & Louisville. 
            We restore. You drive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="sms:5025555555" className="bg-white text-black text-center px-8 py-5 rounded-full font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95">
              Request Quote
            </a>
            <a href="#services" className="bg-zinc-900 border border-zinc-800 text-white text-center px-8 py-5 rounded-full font-bold text-lg hover:bg-zinc-800 transition-all">
              View Services
            </a>
          </div>
        </div>
      </section>

      {/* 2. SERVICES: The "Money" Section */}
      <section id="services" className="px-6 py-32 border-t border-zinc-900 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="text-blue-500 font-bold uppercase tracking-[0.3em] text-xs mb-4">Precision Packages</h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight">The Service Menu</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <PricingCard 
              name="The Maintenance"
              price="$80+"
              features={['Exterior Foam Wash', 'Wheel & Tire Treatment', 'Interior Vacuum', 'Streak-Free Glass']}
            />
            <PricingCard 
              name="The Signature"
              price="$180+"
              recommended={true}
              features={['Decontamination Wash', 'Clay Bar Treatment', '6-Month Paint Protection', 'Interior Steam Clean', 'Deep Leather Conditioning']}
            />
          </div>
        </div>
      </section>

      {/* 3. LOGIC: Why GlossWorks? */}
      <section className="px-6 py-32 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <span className="text-blue-600 text-2xl font-bold">01.</span>
            <h4 className="text-xl font-bold mt-2">Mobile System</h4>
            <p className="text-zinc-500 mt-2 text-sm italic">We bring the studio to your driveway. Zero friction.</p>
          </div>
          <div>
            <span className="text-blue-600 text-2xl font-bold">02.</span>
            <h4 className="text-xl font-bold mt-2">Technical Detail</h4>
            <p className="text-zinc-500 mt-2 text-sm italic">Using chemistry, not just soap, to protect your investment.</p>
          </div>
          <div>
            <span className="text-blue-600 text-2xl font-bold">03.</span>
            <h4 className="text-xl font-bold mt-2">Local Pride</h4>
            <p className="text-zinc-500 mt-2 text-sm italic">Mt. Washington based. We treat your car like our own.</p>
          </div>
        </div>
      </section>

    </div>
  )
}