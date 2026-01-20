import Image from 'next/image'

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
      image: '/products/to-go-cup.jpg',
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
    <section className="py-10 sm:py-12 md:py-14 lg:py-16 xl:py-18 2xl:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-3 sm:mb-4">
            {dict.merch.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.merch.subtitle}
          </p>
        </div>

        {/* 8-Product Grid: Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {products.map((product, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white"
            >
              {/* Product Image */}
              <div className="relative w-full overflow-hidden bg-gray-100 h-[180px] sm:h-[200px] md:h-[220px] lg:h-[200px] xl:h-[220px] 2xl:h-[260px] 3xl:h-[280px] flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={85}
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none" />
              </div>

              {/* Product Label */}
              <div className="p-2 sm:p-3 bg-white">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 text-center group-hover:text-coral transition-colors">
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
