'use client';

import { useState, useEffect } from 'react';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { Search, Sparkles, X, Eye, Heart } from 'lucide-react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

// Mock Gallery Data - Diverse & Inclusive
const GALLERY_ITEMS = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=800&fit=crop',
    title: 'Lucky the Corgi',
    alt: 'A happy Corgi running in a forest, 3D animated movie style',
    tags: ['Corgi', 'Dogs', '3D Movie'],
    styleId: 'pixar-3d',
    styleCategory: '3D Movie',
    petCategory: 'Dogs',
    merchPreview: ['pillow', 'mug', 'phone-case', 'wall-art'],
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=600&fit=crop',
    title: 'Sir Whiskers III',
    alt: 'Majestic Persian cat in royal attire, oil painting style',
    tags: ['Persian', 'Cats', 'Royal'],
    styleId: 'royal-oil',
    styleCategory: 'Royal',
    petCategory: 'Cats',
    merchPreview: ['wall-art', 'pillow', 'tumbler', 'mug'],
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&h=700&fit=crop',
    title: 'Snowy the Bunny',
    alt: 'Fluffy white rabbit in soft watercolor art style with flowers',
    tags: ['Rabbit', 'Rabbits', 'Watercolor'],
    styleId: 'watercolor',
    styleCategory: 'Watercolor',
    petCategory: 'Rabbits',
    merchPreview: ['pillow', 'wall-art', 'mug', 'phone-case'],
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&h=600&fit=crop',
    title: 'Peanut the Hamster',
    alt: 'Adorable hamster holding a tiny seed, 3D animated movie style',
    tags: ['Hamster', 'Small Pets', '3D Movie'],
    styleId: 'pixar-3d',
    styleCategory: '3D Movie',
    petCategory: 'Small Pets',
    merchPreview: ['pillow', 'mug', 'phone-case', 'wall-art'],
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=700&fit=crop',
    title: 'Rio the Parrot',
    alt: 'Vibrant macaw parrot in futuristic cyberpunk neon style',
    tags: ['Parrot', 'Birds', 'Cyberpunk'],
    styleId: 'cyberpunk',
    styleCategory: 'Cyberpunk',
    petCategory: 'Birds',
    merchPreview: ['wall-art', 'phone-case', 'pillow', 'tumbler'],
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&h=600&fit=crop',
    title: 'Ziggy the Gecko',
    alt: 'Leopard gecko in vintage pencil sketch art style',
    tags: ['Gecko', 'Reptiles', 'Sketch'],
    styleId: 'vintage-sketch',
    styleCategory: 'Sketch',
    petCategory: 'Reptiles',
    merchPreview: ['wall-art', 'mug', 'phone-case', 'pillow'],
  },
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=600&h=700&fit=crop',
    title: 'Thunder the Horse',
    alt: 'Majestic horse running through field, oil painting style',
    tags: ['Horse', 'Farm & Other', 'Royal'],
    styleId: 'royal-oil',
    styleCategory: 'Royal',
    petCategory: 'Farm & Other',
    merchPreview: ['wall-art', 'pillow', 'phone-case', 'mug'],
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1594623930572-300a3011d9ae?w=600&h=600&fit=crop',
    title: 'Sir Quacksalot',
    alt: 'Elegant white duck with crown in royal baroque painting style',
    tags: ['Duck', 'Farm & Other', 'Royal'],
    styleId: 'royal-oil',
    styleCategory: 'Royal',
    petCategory: 'Farm & Other',
    merchPreview: ['wall-art', 'pillow', 'tumbler', 'phone-case'],
  },
  {
    id: '9',
    src: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=700&fit=crop',
    title: 'Buddy the Beagle',
    alt: 'Beagle dog portrait in soft watercolor art style',
    tags: ['Beagle', 'Dogs', 'Watercolor'],
    styleId: 'watercolor',
    styleCategory: 'Watercolor',
    petCategory: 'Dogs',
    merchPreview: ['pillow', 'phone-case', 'mug', 'wall-art'],
  },
  {
    id: '10',
    src: 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=600&h=600&fit=crop',
    title: 'Princess Fluffball',
    alt: 'White Persian cat in royal crown, baroque oil painting',
    tags: ['Persian', 'Cats', 'Royal'],
    styleId: 'royal-oil',
    styleCategory: 'Royal',
    petCategory: 'Cats',
    merchPreview: ['wall-art', 'pillow', 'tumbler', 'phone-case'],
  },
];

const FILTER_CATEGORIES = [
  { id: 'All', label: 'All', icon: '✨' },
  { id: 'Dogs', label: 'Dogs', icon: '🐕' },
  { id: 'Cats', label: 'Cats', icon: '🐈' },
  { id: 'Rabbits', label: 'Rabbits', icon: '🐇' },
  { id: 'Small Pets', label: 'Small Pets', icon: '🐹' },
  { id: 'Birds', label: 'Birds', icon: '🦜' },
  { id: 'Reptiles', label: 'Reptiles', icon: '🦎' },
  { id: 'Farm & Other', label: 'Farm & Other', icon: '🐴' },
];

interface GalleryImage {
  id: string;
  output_url: string;
  title: string | null;
  alt_text: string | null;
  style: string;
  style_category: string | null;
  prompt: string;
  created_at: string;
  views: number;
  likes: number;
}

export default function GalleryPage() {
  const params = useParams();
  const lang = (params?.lang as Locale) || 'en';
  
  const [dict, setDict] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    getDictionary(lang).then(setDict);
  }, [lang]);

  // Convert mock data to database format
  const convertMockToDbFormat = (mockItems: any[]): GalleryImage[] => {
    return mockItems.map(item => ({
      id: item.id,
      output_url: item.src,
      title: item.title,
      alt_text: item.alt,
      style: item.styleId,
      style_category: item.styleCategory,
      prompt: item.alt || item.title, // Use alt as prompt
      created_at: new Date().toISOString(),
      views: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 500) + 50,
      // Preserve original fields for compatibility
      ...item
    }));
  };

  // Fetch public generations from database
  useEffect(() => {
    const fetchGalleryImages = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('generations')
          .select('id, output_url, title, alt_text, style, style_category, prompt, created_at, views, likes')
          .eq('is_public', true)
          .eq('status', 'succeeded')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching gallery images:', error);
          // Fallback to mock data if database query fails
          setGalleryImages(convertMockToDbFormat(GALLERY_ITEMS));
        } else if (!data || data.length === 0) {
          // Fallback to mock data if no public images exist yet
          console.log('No public images in database, using mock data');
          setGalleryImages(convertMockToDbFormat(GALLERY_ITEMS));
        } else {
          setGalleryImages(data);
        }
      } catch (err) {
        console.error('Failed to fetch gallery:', err);
        // Fallback to mock data on any error
        setGalleryImages(convertMockToDbFormat(GALLERY_ITEMS));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  useEffect(() => {
    const imageId = searchParams.get('id');
    if (imageId && galleryImages.length > 0) {
      const image = galleryImages.find(item => item.id === imageId);
      if (image) {
        setSelectedImage(image);
      }
    }
  }, [searchParams, galleryImages]);

  if (!dict || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Helper function to detect pet category from prompt/alt_text
  const detectPetCategory = (item: GalleryImage | any): string => {
    // If item has petCategory (from mock data), use it directly
    if (item.petCategory) {
      return item.petCategory;
    }
    
    const text = `${item.prompt || ''} ${item.alt_text || ''} ${item.title || ''}`.toLowerCase();
    
    // Dogs
    if (text.match(/\b(dog|puppy|corgi|beagle|retriever|bulldog|poodle|husky|shepherd)\b/)) return 'Dogs';
    
    // Cats
    if (text.match(/\b(cat|kitten|feline|persian|siamese|tabby)\b/)) return 'Cats';
    
    // Rabbits
    if (text.match(/\b(rabbit|bunny|hare)\b/)) return 'Rabbits';
    
    // Small Pets
    if (text.match(/\b(hamster|guinea pig|gerbil|mouse|rat|ferret)\b/)) return 'Small Pets';
    
    // Birds
    if (text.match(/\b(bird|parrot|parakeet|cockatiel|macaw|canary|finch)\b/)) return 'Birds';
    
    // Reptiles
    if (text.match(/\b(lizard|gecko|snake|turtle|tortoise|iguana|chameleon)\b/)) return 'Reptiles';
    
    // Farm & Other
    if (text.match(/\b(horse|pony|cow|pig|sheep|goat|chicken|duck|donkey)\b/)) return 'Farm & Other';
    
    return 'Dogs'; // Default fallback
  };

  const filteredItems = galleryImages.filter(item => {
    const matchesSearch =
      searchQuery === '' ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.alt_text && item.alt_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      activeFilter === 'All' || detectPetCategory(item) === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleImageClick = (item: GalleryImage) => {
    setSelectedImage(item);
    router.push(`/${lang}/gallery?id=${item.id}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    router.push(`/${lang}/gallery`, { scroll: false });
  };

  const handleRemixStyle = () => {
    if (selectedImage) {
      router.push(`/${lang}?style=${selectedImage.style}`);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-coral to-orange-600 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-32 h-32">
            <Sparkles className="w-full h-full text-white" />
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Pet Portrait Gallery
          </h1>
          <p className="text-xl text-white/90 text-center mb-8 max-w-2xl mx-auto">
            Discover stunning AI-generated pet art. Click any image to remix the style for your pet!
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search styles or breeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full text-darkgray focus:outline-none focus:ring-2 focus:ring-white shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Filter Chips */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 max-w-7xl py-4">
          <div className="relative">
            {/* Scrollable Container */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {FILTER_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeFilter === category.id
                      ? 'bg-coral text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
            
            {/* Right Fade Gradient Hint */}
            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Masonry Gallery Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No images found. Try a different search or filter.</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleImageClick(item)}
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer break-inside-avoid mb-4 w-full block"
                >
                  {/* Image */}
                  <img
                    src={item.output_url}
                    alt={item.alt_text || item.title || 'AI generated pet portrait'}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Stats Overlay (Bottom) - Visible on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <Eye className="w-4 h-4" />
                          {item.views ?? 0}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <Heart className="w-4 h-4" />
                          {item.likes ?? 0}
                        </span>
                      </div>
                      {item.title && (
                        <span className="text-xs text-white/90 truncate max-w-[150px]">
                          {item.title}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal - The Action Hub */}
      <Dialog open={!!selectedImage} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-7xl w-full p-0 overflow-hidden bg-white rounded-3xl">
          {selectedImage && (
            <>
              {/* Hidden title for accessibility */}
              <DialogTitle className="sr-only">
                {selectedImage.title || 'AI Pet Portrait'}
              </DialogTitle>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 h-auto sm:h-[85vh] max-h-[900px]">
                {/* Left Column - The Image */}
                <div className="relative h-[400px] sm:h-full w-full bg-gray-900 flex items-center justify-center">
                  {/* Use native img tag to avoid Next.js Image Optimization API errors */}
                  <img
                    src={selectedImage.output_url}
                    alt={selectedImage.alt_text || selectedImage.title || 'AI generated pet portrait'}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Right Column - The Content */}
                <div className="relative p-10 lg:p-12 flex flex-col justify-center items-start text-left bg-white">
                  {/* Close Button (Top-Right Corner) */}
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-6 right-6 z-50 bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition-all shadow-md hover:shadow-lg"
                    aria-label="Close dialog"
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </button>

                  {/* Tags */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {/* Pet Category Tag */}
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {detectPetCategory(selectedImage)}
                    </span>
                    
                    {/* Style Tag */}
                    <span className="px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-medium">
                      {selectedImage.style}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedImage.views ?? 0}</p>
                        <p className="text-xs text-gray-500">Views</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedImage.likes ?? 0}</p>
                        <p className="text-xs text-gray-500">Likes</p>
                      </div>
                    </div>
                  </div>

                {/* Title */}
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {selectedImage.title || 'AI Pet Portrait'}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  {selectedImage.alt_text || selectedImage.prompt.substring(0, 150)}
                </p>

                {/* Style Features Box */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-coral rounded-xl p-6 mb-10 w-full shadow-sm">
                  <p className="text-gray-700 text-base leading-relaxed">
                    <strong className="text-coral">✨ Style Features:</strong> This artistic style combines soft lighting, 
                    vibrant colors, and Pixar-like 3D rendering to transform your pet into a 
                    stunning character. Perfect for creating memorable keepsakes.
                  </p>
                </div>

                {/* Main Action */}
                <button
                  onClick={handleRemixStyle}
                  className="w-full text-xl font-bold py-7 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-6 h-6" />
                  Remix this Style 🪄
                </button>

                {/* Trust Signal */}
                <p className="text-center text-gray-400 text-sm mt-6 w-full">
                  ⚡ Generated in ~30 seconds • 🎨 4K quality • 💯 Money-back guarantee
                </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
