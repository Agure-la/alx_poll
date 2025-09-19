
"use server";

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { createPollSchema } from '@/lib/validations';
import { z } from 'zod';

export async function createPoll(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return { success: false, message: 'Authentication required to create polls' };
    }

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      options: formData.getAll('options[]').filter(opt => typeof opt === 'string' && opt.trim() !== ''),
      allow_multiple_votes: formData.get('allow_multiple_votes') === 'on',
      require_authentication: formData.get('require_authentication') === 'on',
      expires_at: formData.get('expires_at') || undefined,
    };

    const validatedData = createPollSchema.parse(rawData);

    const { data: existingPoll } = await supabase
      .from('polls')
      .select('id')
      .eq('title', validatedData.title)
      .eq('created_by', session.user.id)
      .single();

    if (existingPoll) {
        return { success: false, message: 'A poll with this title already exists' };
    }

    const { data: poll, error: createError } = await supabase
      .from('polls')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        options: validatedData.options.map((text, index) => ({
          id: crypto.randomUUID(),
          text,
          votes: 0,
          order: index
        })),
        created_by: session.user.id,
        allow_multiple_votes: validatedData.allow_multiple_votes,
        require_authentication: validatedData.require_authentication,
        expires_at: validatedData.expires_at
      })
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Database error: ${createError.message}`);
    }

    revalidatePath('/polls');
    return {
      success: true,
      message: 'Poll created successfully!',
      pollId: poll.id,
    };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed. Please check your inputs.",
        errors: error.flatten().fieldErrors,
      };
    }
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
    };
  }
}
