import PackagesSection from "@/components/PackagesSection";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-32">
      <div className="max-w-screen-xl mx-auto px-6">
        <h1 className="text-3xl font-black tracking-tighter">Pricing</h1>
        <p className="mt-4 text-zinc-400">
          Choose the package that fits your vehicle and goals.
        </p>
      </div>

      <PackagesSection />
    </main>
  );
}