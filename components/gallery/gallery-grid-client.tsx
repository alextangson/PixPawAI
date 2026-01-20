'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { Search, Sparkles, X, Eye, Heart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadModalWizard } from '@/components/upload-modal-wizard';

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
  is_public: boolean;
  pet_type: string | null;
}

interface GalleryGridClientProps {
  initialImages: GalleryImage[];
  lang: Locale;
}

export function GalleryGridClient({ initialImages, lang }: GalleryGridClientProps) {
  const [dict, setDict] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hasLiked, setHasLiked] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialImages.length >= 12);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    getDictionary(lang).then(setDict);
    
    // Load liked images from localStorage
    const likedImages = localStorage.getItem('likedGalleryImages');
    if (likedImages) {
      try {
        setHasLiked(new Set(JSON.parse(likedImages)));
      } catch (e) {
        console.error('Failed to parse liked images:', e);
      }
    }
  }, [lang]);

  // Load more images function
  const loadMoreImages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      // Build filter parameter
      let petTypeFilter = '';
      if (activeFilter !== 'All') {
        const categoryMap: Record<string, string> = {
          'Dogs': 'dog',
          'Cats': 'cat',
          'Rabbits': 'rabbit',
          'Small Pets': 'hamster,guinea pig,gerbil,mouse,rat,ferret,chinchilla,hedgehog',
          'Birds': 'bird,parrot,parakeet,cockatiel,macaw,canary,finch',
          'Reptiles': 'lizard,gecko,snake,turtle,tortoise,iguana,chameleon',
          'Farm & Other': 'horse,pony,cow,pig,sheep,goat,chicken,duck,donkey,unknown'
        };
        petTypeFilter = categoryMap[activeFilter] || '';
      }

      const params = new URLSearchParams({
        offset: images.length.toString(),
        limit: '12',
        ...(petTypeFilter && { petType: petTypeFilter }),
        ...(searchQuery && { query: searchQuery })
      });

      const response = await fetch(`/api/gallery/load-more?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load more images');
      }

      const data = await response.json();
      const newImages = data.images || [];

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }

      // If we got fewer than 12 images, we've reached the end
      if (newImages.length < 12) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more images:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, activeFilter, searchQuery, images.length]);

  // Reset and reload when filter or search changes
  useEffect(() => {
    const reloadImages = async () => {
      setIsLoadingMore(true);
      try {
        // Build filter parameter
        let petTypeFilter = '';
        if (activeFilter !== 'All') {
          const categoryMap: Record<string, string> = {
            'Dogs': 'dog',
            'Cats': 'cat',
            'Rabbits': 'rabbit',
            'Small Pets': 'hamster,guinea pig,gerbil,mouse,rat,ferret,chinchilla,hedgehog',
            'Birds': 'bird,parrot,parakeet,cockatiel,macaw,canary,finch',
            'Reptiles': 'lizard,gecko,snake,turtle,tortoise,iguana,chameleon',
            'Farm & Other': 'horse,pony,cow,pig,sheep,goat,chicken,duck,donkey,unknown'
          };
          petTypeFilter = categoryMap[activeFilter] || '';
        }

        const params = new URLSearchParams({
          offset: '0',
          limit: '12',
          ...(petTypeFilter && { petType: petTypeFilter }),
          ...(searchQuery && { query: searchQuery })
        });

        const response = await fetch(`/api/gallery/load-more?${params}`);
        if (!response.ok) throw new Error('Failed to reload images');

        const data = await response.json();
        setImages(data.images || []);
        setHasMore((data.images || []).length >= 12);
      } catch (error) {
        console.error('Failed to reload images:', error);
      } finally {
        setIsLoadingMore(false);
      }
    };

    reloadImages();
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    const imageId = searchParams.get('id');
    if (imageId && images.length > 0) {
      const image = images.find(item => item.id === imageId);
      if (image) {
        setSelectedImage(image);
      }
    }
  }, [searchParams, images]);

  // Infinite scroll - load more images
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreImages();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const sentinel = document.getElementById('gallery-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreImages]);

  // Helper function to detect pet category - now uses pet_type field from database
  const detectPetCategory = (item: GalleryImage): string => {
    // First, try to use the pet_type field from database (set during sharing)
    if (item.pet_type) {
      const petType = item.pet_type.toLowerCase();
      
      // Handle unknown or unrecognized pet types
      if (petType === 'unknown') return 'Farm & Other';
      
      // Map pet_type to filter categories
      if (petType === 'dog') return 'Dogs';
      if (petType === 'cat') return 'Cats';
      if (petType === 'rabbit' || petType === 'bunny') return 'Rabbits';
      if (['hamster', 'guinea pig', 'gerbil', 'mouse', 'rat', 'ferret', 'chinchilla', 'hedgehog'].includes(petType)) return 'Small Pets';
      if (['bird', 'parrot', 'parakeet', 'cockatiel', 'macaw', 'canary', 'finch'].includes(petType)) return 'Birds';
      if (['lizard', 'gecko', 'snake', 'turtle', 'tortoise', 'iguana', 'chameleon'].includes(petType)) return 'Reptiles';
      if (['horse', 'pony', 'cow', 'pig', 'sheep', 'goat', 'chicken', 'duck', 'donkey'].includes(petType)) return 'Farm & Other';
    }
    
    // Fallback: try to detect from text (for old data without pet_type)
    const text = `${item.prompt || ''} ${item.alt_text || ''} ${item.title || ''}`.toLowerCase();
    
    if (text.match(/\b(dog|puppy|corgi|beagle|retriever|bulldog|poodle|husky|shepherd)\b/)) return 'Dogs';
    if (text.match(/\b(cat|kitten|feline|persian|siamese|tabby)\b/)) return 'Cats';
    if (text.match(/\b(rabbit|bunny|hare)\b/)) return 'Rabbits';
    if (text.match(/\b(hamster|guinea pig|gerbil|mouse|rat|ferret)\b/)) return 'Small Pets';
    if (text.match(/\b(bird|parrot|parakeet|cockatiel|macaw|canary|finch)\b/)) return 'Birds';
    if (text.match(/\b(lizard|gecko|snake|turtle|tortoise|iguana|chameleon)\b/)) return 'Reptiles';
    if (text.match(/\b(horse|pony|cow|pig|sheep|goat|chicken|duck|donkey)\b/)) return 'Farm & Other';
    
    return 'Dogs'; // Default fallback
  };

  // No need for client-side filtering anymore since we do it server-side
  const filteredItems = images;

  const handleImageClick = async (item: GalleryImage) => {
    setSelectedImage(item);
    router.push(`/${lang}/gallery?id=${item.id}`, { scroll: false });
    
    // Increment view count asynchronously
    try {
      await fetch('/api/gallery/increment-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: item.id, action: 'view' }),
      });
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    router.push(`/${lang}/gallery`, { scroll: false });
  };

  const handleRemixStyle = () => {
    if (selectedImage) {
      // Close the modal first
      handleCloseModal();
      // Open upload modal with pre-selected style
      setShowUploadModal(true);
    }
  };

  const handleLike = async () => {
    if (!selectedImage) return;
    
    // Check if already liked
    if (hasLiked.has(selectedImage.id)) {
      return; // Already liked, do nothing
    }
    
    try {
      // Optimistic update
      setSelectedImage({ ...selectedImage, likes: selectedImage.likes + 1 });
      
      // Update localStorage
      const newLiked = new Set(hasLiked);
      newLiked.add(selectedImage.id);
      setHasLiked(newLiked);
      localStorage.setItem('likedGalleryImages', JSON.stringify(Array.from(newLiked)));
      
      // Call API
      await fetch('/api/gallery/increment-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: selectedImage.id, action: 'like' }),
      });
    } catch (error) {
      console.error('Failed to increment like count:', error);
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
              {images.length === 0 ? (
                // No images in database at all
                <div className="max-w-md mx-auto">
                  <Sparkles className="w-16 h-16 text-coral mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Be the First to Create! 🎨
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No pet portraits yet. Create your first AI masterpiece and inspire others!
                  </p>
                  <Button
                    onClick={() => router.push(`/${lang}#upload`)}
                    className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold px-8 py-3"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Now
                  </Button>
                </div>
              ) : (
                // Images exist but filtered out
                <div>
                  <p className="text-gray-500 text-lg mb-4">No images found with current filters.</p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('All');
                    }}
                    variant="outline"
                    className="border-2 border-coral text-coral hover:bg-coral hover:text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleImageClick(item)}
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer break-inside-avoid mb-4 w-full block"
                >
                  {/* Image with lazy loading */}
                  <img
                    src={item.output_url}
                    alt={item.alt_text || item.title || 'AI generated pet portrait'}
                    loading="lazy"
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

          {/* Load More Section */}
          {filteredItems.length > 0 && (
            <div className="w-full py-8 flex flex-col items-center gap-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-coral border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more amazing pet portraits...</span>
                </div>
              ) : hasMore ? (
                <>
                  {/* Automatic loading sentinel */}
                  <div id="gallery-sentinel" className="w-1 h-1"></div>
                  
                  {/* Manual load button */}
                  <Button
                    onClick={loadMoreImages}
                    disabled={isLoadingMore}
                    className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Load More
                  </Button>
                </>
              ) : (
                <p className="text-gray-400 text-sm">
                  You've reached the end
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal - Optimized Size */}
      <Dialog open={!!selectedImage} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-3xl w-full p-0 overflow-hidden bg-white rounded-2xl">
          {selectedImage && (
            <>
              {/* Hidden title for accessibility */}
              <DialogTitle className="sr-only">
                {selectedImage.title || 'AI Pet Portrait'}
              </DialogTitle>
              
              {/* Compact Vertical Layout - No Scroll */}
              <div className="relative flex flex-col max-h-[90vh]">
                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-3 right-3 z-50 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg transition-all touch-target"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Main Image - Flexible Height */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-5 flex items-center justify-center flex-shrink min-h-0">
                  <img
                    src={selectedImage.output_url}
                    alt={selectedImage.alt_text || selectedImage.title || 'AI generated pet portrait'}
                    className="w-full max-h-[35vh] sm:max-h-[40vh] md:max-h-[45vh] h-auto object-contain rounded-xl shadow-lg"
                  />
                </div>

                {/* Content Section - Fixed Height */}
                <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3 flex-shrink-0 bg-white">
                  {/* Stats Row - Compact */}
                  <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">{selectedImage.views ?? 0}</span>
                      </div>
                      <button
                        onClick={handleLike}
                        disabled={hasLiked.has(selectedImage.id)}
                        className={`flex items-center gap-1.5 transition-all ${
                          hasLiked.has(selectedImage.id)
                            ? 'text-pink-600 cursor-not-allowed'
                            : 'text-gray-600 hover:text-pink-600 cursor-pointer'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked.has(selectedImage.id) ? 'fill-pink-600' : ''}`} />
                        <span className="text-xs sm:text-sm font-medium">{selectedImage.likes ?? 0}</span>
                      </button>
                    </div>
                    
                    {/* Logo - Compact */}
                    <img 
                      src="/brand/logo-orange.svg" 
                      alt="PixPawAI" 
                      className="h-10 sm:h-12 w-auto"
                    />
                  </div>

                  {/* Title & Style Tag */}
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1">
                      {selectedImage.title || 'Untitled'}
                    </h2>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Style: <span className="text-orange-600 font-semibold">{selectedImage.style}</span>
                    </p>
                  </div>

                  {/* Remix Button */}
                  <button
                    onClick={handleRemixStyle}
                    className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    Remix this Style
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Modal for Remix */}
      {showUploadModal && (
        <UploadModalWizard
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          selectedStyle={selectedImage?.style}
          isRemixMode={true}
        />
      )}
    </main>
  );
}
