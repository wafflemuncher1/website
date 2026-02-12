interface PackageProps {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export default function PricingCard({ name, price, features, recommended }: PackageProps) {
  return (
    <div className={`p-6 rounded-2xl border ${recommended ? 'border-blue-600 bg-zinc-900' : 'border-zinc-800 bg-black'} flex flex-col gap-4`}>
      {recommended && <span className="text-blue-500 text-[10px] uppercase font-bold tracking-widest">Most Popular</span>}
      <h3 className="text-2xl font-bold">{name}</h3>
      <div className="text-4xl font-black text-blue-600">{price}</div>
      <ul className="flex flex-col gap-2 mt-4">
        {features.map((item, index) => (
          <li key={index} className="text-zinc-400 text-sm flex items-center gap-2">
            <span className="text-blue-500">✓</span> {item}
          </li>
        ))}
      </ul>
      <a href="sms:5025555555" className={`mt-6 py-3 rounded-lg font-bold text-center transition ${recommended ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
        Book Now
      </a>
    </div>
  )
}