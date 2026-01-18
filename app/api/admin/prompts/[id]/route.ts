import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

async function resolveParams(params: Promise<{ id: string }> | { id: string }): Promise<{ id: string }> {
  return await Promise.resolve(params)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await resolveParams(params)
    const { id } = resolvedParams
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Prompt GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Prompt GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await resolveParams(params)
    const { id } = resolvedParams
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('prompt_templates')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Prompt PUT error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Prompt PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await resolveParams(params)
    const { id } = resolvedParams
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Prompt DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Prompt deleted successfully' })
  } catch (error: any) {
    console.error('Prompt DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt', message: error.message },
      { status: 500 }
    )
  }
}
