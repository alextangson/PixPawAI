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
      image: '/products/frame-wall-art.jpg',
    },
    {
      name: 'Custom T-Shirt',
      image: '/products/t-shirt.jpg',
    },
    {
      name: 'Plush Pillow',
      image: '/products/pillow.jpg',
    },
    {
      name: 'Travel Tumbler',
      image: '/products/To-go Cup.jpg',
    },
    {
      name: 'Phone Case',
      image: '/products/phonecase.jpg',
    },
    {
      name: 'Ceramic Mug',
      image: '/products/mug.jpg',
    },
    {
      name: 'Pet Accessories',
      image: '/products/accessories.jpg',
    },
    {
      name: 'Wallpaper',
      image: '/products/wallpaper.jpg',
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
