import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { qrCodeSchema } from '@/lib/validations'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const size = parseInt(searchParams.get('size') || '300')
    const format = searchParams.get('format') || 'png'
    
    // Validate parameters
    const validatedData = qrCodeSchema.parse({
      poll_id: params.id,
      size,
      format: format as 'png' | 'svg' | 'pdf'
    })

    // Get poll data
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, share_token')
      .eq('id', validatedData.poll_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Generate poll URL
    const pollUrl = `${process.env.NEXT_PUBLIC_APP_URL}/polls/${poll.id}?token=${poll.share_token}`

    // Generate QR code
    let qrCodeData: string | Buffer
    
    const options = {
      width: validatedData.size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }

    switch (validatedData.format) {
      case 'svg':
        qrCodeData = await QRCode.toString(pollUrl, {
          ...options,
          type: 'svg'
        })
        break
      case 'pdf':
        qrCodeData = await QRCode.toBuffer(pollUrl, {
          ...options,
          type: 'pdf'
        })
        break
      default: // png
        qrCodeData = await QRCode.toDataURL(pollUrl, options)
        break
    }

    // Set appropriate headers
    const headers = new Headers()
    
    switch (validatedData.format) {
      case 'svg':
        headers.set('Content-Type', 'image/svg+xml')
        break
      case 'pdf':
        headers.set('Content-Type', 'application/pdf')
        break
      default: // png
        headers.set('Content-Type', 'image/png')
        break
    }

    headers.set('Cache-Control', 'public, max-age=3600') // Cache for 1 hour

    return new NextResponse(qrCodeData, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error('QR code generation error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

// Generate and store QR code
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get poll data
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, share_token, created_by')
      .eq('id', params.id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user owns the poll
    if (poll.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Generate poll URL
    const pollUrl = `${process.env.NEXT_PUBLIC_APP_URL}/polls/${poll.id}?token=${poll.share_token}`

    // Generate QR code as PNG
    const qrCodeDataUrl = await QRCode.toDataURL(pollUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Convert data URL to buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage
    const fileName = `qr-codes/${poll.id}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('poll-assets')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload QR code' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('poll-assets')
      .getPublicUrl(fileName)

    // Update poll with QR code URL
    const { error: updateError } = await supabase
      .from('polls')
      .update({ qr_code_url: publicUrl })
      .eq('id', poll.id)

    if (updateError) {
      console.error('Poll update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update poll' },
        { status: 500 }
      )
    }

    // Track share event
    await supabase
      .from('poll_shares')
      .insert({
        poll_id: poll.id,
        shared_by: user.id,
        share_method: 'qr'
      })

    return NextResponse.json({
      success: true,
      data: {
        qr_code_url: publicUrl,
        poll_url: pollUrl
      }
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
