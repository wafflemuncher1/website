import PricingCard from '@/components/PricingCard'

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      
      {/* HERO SECTION */}
      <section className="relative h-[90vh] flex flex-col justify-center px-6 md:px-12">
        {/* Decorative background element */}
        <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] -z-10" />
        
        <h1 className="text-6xl md:text-[120px] font-black tracking-tighter leading-[0.85] mb-6">
          GLOSS<br />
          <span className="text-blue-600">WORKS</span><br />
          KY
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-2xl max-w-xl mb-10 leading-relaxed">
          Premium mobile detailing for those who value precision. Serving Mount Washington and Louisville.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a href="sms:5025555555" className="bg-blue-600 hover:bg-blue-700 text-white text-center px-10 py-5 rounded-2xl font-bold text-xl transition-all active:scale-95">
            Get a Quote
          </a>
          <a href="#services" className="bg-zinc-900 border border-zinc-800 text-white text-center px-10 py-5 rounded-2xl font-bold text-xl hover:bg-zinc-800 transition-all">
            View Services
          </a>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="px-6 py-24 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2">Packages</h2>
            <h3 className="text-4xl font-bold">The Service Menu</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PricingCard 
              name="The Express"
              price="$80+"
              features={['Exterior Foam Wash', 'Wheel Deep Clean', 'Interior Vacuum', 'Glass Clarity Treatment']}
            />
            <PricingCard 
              name="The Signature"
              price="$180+"
              recommended={true}
              features={['Everything in Express', 'Clay Bar & Decon', '6-Month Paint Protection', 'Interior Steam Clean', 'Leather/Fabric Conditioning']}
            />
          </div>
        </div>
      </section>

    </div>
  )
}