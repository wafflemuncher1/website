import PricingCard from '@/components/PricingCard'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="px-6 pt-32 pb-20 max-w-4xl">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-6">
          GLOSS<span className="text-blue-600">WORKS</span>
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-md mb-10">
          Mobile precision detailing. We bring the showroom to your driveway in Mt. Washington & Louisville.
        </p>
      </section>

      {/* PRICING SECTION */}
      <section className="px-6 py-20 bg-zinc-950">
        <h2 className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em] mb-12 text-center">Service Menu</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <PricingCard 
            name="The Express"
            price="$80+"
            features={['Hand Wash & Dry', 'Wheels & Tires', 'Interior Vacuum', 'Glass Cleaned']}
          />
          <PricingCard 
            name="The Signature"
            price="$180+"
            recommended={true}
            features={['Everything in Express', 'Iron Decontamination', 'Clay Bar Treatment', '6-Month Sealant', 'Interior Deep Clean']}
          />
        </div>
      </section>
    </div>
  )
}