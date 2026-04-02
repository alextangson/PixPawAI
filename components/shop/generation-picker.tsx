'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Generation {
  id: string;
  output_url: string;
  share_card_url: string | null;
  title: string | null;
  created_at: string;
}

interface GenerationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (generation: { id: string; imageUrl: string; title: string | null }) => void;
}

export function GenerationPicker({ open, onClose, onSelect }: GenerationPickerProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setError('Please sign in to view your creations.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('generations')
        .select('id, output_url, share_card_url, title, created_at')
        .eq('user_id', user.id)
        .not('output_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        setError('Failed to load your creations.');
      } else {
        setGenerations(data || []);
      }
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Choose a Portrait</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-coral animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {!loading && !error && generations.length === 0 && (
            <div className="text-center py-16">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No portraits yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Create a pet portrait first, then come back here to print it!
              </p>
            </div>
          )}

          {!loading && !error && generations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {generations.map((gen) => {
                const imageUrl = gen.share_card_url || gen.output_url;
                return (
                  <button
                    key={gen.id}
                    onClick={() =>
                      onSelect({
                        id: gen.id,
                        imageUrl,
                        title: gen.title,
                      })
                    }
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:ring-4 hover:ring-coral/50 transition-all"
                  >
                    <Image
                      src={imageUrl}
                      alt={gen.title || 'Pet portrait'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    {gen.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-xs font-medium truncate">
                          {gen.title}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
