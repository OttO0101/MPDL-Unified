import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const device = formData.get('device') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!device) {
      return NextResponse.json({ error: 'No device provided' }, { status: 400 })
    }

    // Create a unique filename with device and timestamp
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `photos/${device}-${timestamp}.${extension}`

    // Upload to Blob (public store so it can be embedded in reports)
    const blob = await put(filename, file, {
      access: 'public',
    })

    console.log('[v0] Photo uploaded successfully:', blob.url)

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname,
      device,
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    await del(url)

    console.log('[v0] Photo deleted successfully:', url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
