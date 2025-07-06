import PricingPlans from '@/components/subscription/PricingPlans';

export const metadata = {
  title: 'Pricing - CRM Mind',
  description: 'Choose the right plan for your business with our flexible pricing options.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Pricing Plans
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Choose the perfect plan for your business needs. All plans include access to our core CRM features.
            </p>
          </div>
          
          <PricingPlans />
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Need a custom solution?</h2>
            <p className="mt-2 text-lg text-gray-600">
              Contact our sales team for custom enterprise solutions tailored to your specific needs.
            </p>
            <div className="mt-6">
              <a
                href="/contact-sales"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
