interface MerchShowcaseProps {
  dict: {
    merch: {
      title: string;
      subtitle: string;
      products: {
        pillow: string;
        phoneCase: string;
        canvas: string;
      };
    };
  };
}

export function MerchShowcase({ dict }: MerchShowcaseProps) {
  const products = [
    {
      name: 'Framed Wall Art',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=500&h=500&fit=crop',
    },
    {
      name: 'Custom T-Shirt',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    },
    {
      name: 'Plush Pillow',
      image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&h=500&fit=crop',
    },
    {
      name: 'Travel Tumbler',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
    },
    {
      name: 'Floor Mat',
      image: 'https://images.unsplash.com/photo-1591212372990-e49f71e828af?w=500&h=500&fit=crop',
    },
    {
      name: 'Patterned Socks',
      image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500&h=500&fit=crop',
    },
    {
      name: 'Phone Case',
      image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=500&h=500&fit=crop',
    },
    {
      name: 'Ceramic Mug',
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {dict.merch.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.merch.subtitle}
          </p>
        </div>

        {/* 8-Product Grid: 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              </div>

              {/* Product Label */}
              <div className="p-4 bg-white">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 text-center group-hover:text-coral transition-colors">
                  {product.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
