/**
 * Admin API: Backfill pet_type for existing generations
 * POST /api/admin/backfill-pet-types
 * 
 * This endpoint extracts pet types from prompts and updates the pet_type field
 * for existing generations that don't have it set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all public generations without pet_type
    const { data: generations, error: fetchError } = await supabase
      .from('generations')
      .select('id, prompt, quality_check')
      .eq('is_public', true)
      .eq('status', 'succeeded')
      .is('pet_type', null);

    if (fetchError) {
      console.error('Failed to fetch generations:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch generations', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!generations || generations.length === 0) {
      return NextResponse.json({
        message: 'No generations need backfilling',
        updated: 0,
      });
    }

    // Extract pet type from prompt or quality_check
    const updates = generations.map(gen => {
      let petType: string | null = null;

      // First try quality_check
      if (gen.quality_check && typeof gen.quality_check === 'object') {
        const qc = gen.quality_check as any;
        if (qc.petType) {
          petType = qc.petType.toLowerCase();
        }
      }

      // Fallback: extract from prompt
      if (!petType && gen.prompt) {
        const prompt = gen.prompt.toLowerCase();
        
        // Check for specific pet types
        if (prompt.match(/\b(dog|puppy|corgi|beagle|retriever|bulldog|poodle|husky|shepherd|labrador|terrier)\b/)) {
          petType = 'dog';
        } else if (prompt.match(/\b(cat|kitten|feline|persian|siamese|tabby)\b/)) {
          petType = 'cat';
        } else if (prompt.match(/\b(rabbit|bunny|hare)\b/)) {
          petType = 'rabbit';
        } else if (prompt.match(/\b(hamster|guinea pig|gerbil|mouse|rat|ferret|chinchilla|hedgehog)\b/)) {
          const match = prompt.match(/\b(hamster|guinea pig|gerbil|mouse|rat|ferret|chinchilla|hedgehog)\b/);
          petType = match ? match[0] : 'hamster';
        } else if (prompt.match(/\b(bird|parrot|parakeet|cockatiel|macaw|canary|finch)\b/)) {
          const match = prompt.match(/\b(bird|parrot|parakeet|cockatiel|macaw|canary|finch)\b/);
          petType = match ? match[0] : 'bird';
        } else if (prompt.match(/\b(lizard|gecko|snake|turtle|tortoise|iguana|chameleon)\b/)) {
          const match = prompt.match(/\b(lizard|gecko|snake|turtle|tortoise|iguana|chameleon)\b/);
          petType = match ? match[0] : 'lizard';
        } else if (prompt.match(/\b(horse|pony|cow|pig|sheep|goat|chicken|duck|donkey)\b/)) {
          const match = prompt.match(/\b(horse|pony|cow|pig|sheep|goat|chicken|duck|donkey)\b/);
          petType = match ? match[0] : 'unknown';
        } else {
          petType = 'unknown';
        }
      }

      return {
        id: gen.id,
        pet_type: petType || 'unknown',
      };
    });

    // Update in batches
    let updated = 0;
    const batchSize = 100;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('generations')
          .update({ pet_type: update.pet_type })
          .eq('id', update.id);

        if (!updateError) {
          updated++;
        } else {
          console.error(`Failed to update ${update.id}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      message: 'Backfill completed',
      total: generations.length,
      updated,
      failed: generations.length - updated,
    });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
