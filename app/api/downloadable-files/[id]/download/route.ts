// app/api/downloadable-files/[id]/download/route.ts

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Increment download count
    const { error } = await supabaseAdmin.rpc("increment_download_count", {
      file_id: params.id,
    })

    if (error) {
      console.error("Error incrementing download count:", error)
      return NextResponse.json({ error: "Failed to track download" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in download tracking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ADD THIS GET METHOD TO FORCE DOWNLOAD
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get file details from database
    const { data: file, error } = await supabaseAdmin
      .from('downloadable_files')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Increment download count
    await supabaseAdmin.rpc("increment_download_count", {
      file_id: params.id,
    })

    if (file.file_url) {
      // Fetch the file from Supabase storage
      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.file_url}`
      
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }

      const blob = await response.blob()
      
      // Determine filename with extension
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      let extension = ''
      
      // Map content types to extensions
      if (contentType.includes('pdf')) extension = '.pdf'
      else if (contentType.includes('word') || contentType.includes('document')) extension = '.docx'
      else if (contentType.includes('sheet') || contentType.includes('excel')) extension = '.xlsx'
      else if (contentType.includes('presentation') || contentType.includes('powerpoint')) extension = '.pptx'
      else if (contentType.includes('jpeg')) extension = '.jpg'
      else if (contentType.includes('png')) extension = '.png'
      else if (contentType.includes('text')) extension = '.txt'
      
      // Create filename - handle Arabic/Unicode characters
      const baseFileName = file.title || 'download'
      const fileName = baseFileName.includes('.') ? baseFileName : `${baseFileName}${extension}`
      
      // Encode filename for Unicode support
      const encodedFileName = encodeURIComponent(fileName)
        .replace(/['()]/g, escape)
        .replace(/\*/g, '%2A')
      
      // Use RFC 5987 encoding for Unicode filenames
      const contentDisposition = `attachment; filename="${fileName.replace(/[^\x00-\x7F]/g, '_')}"; filename*=UTF-8''${encodedFileName}`

      // Return file with download headers
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/octet-stream', // Force download
          'Content-Disposition': contentDisposition,
          'Content-Length': blob.size.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } else if (file.file_drive_link) {
      // Redirect to Google Drive
      return NextResponse.redirect(file.file_drive_link)
    }

    return NextResponse.json({ error: 'No file URL found' }, { status: 400 })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
