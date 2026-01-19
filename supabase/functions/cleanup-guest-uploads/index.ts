/**
 * Supabase Edge Function: Cleanup Guest Uploads
 * 
 * Purpose: Automatically delete temporary files older than 24 hours
 * Trigger: Cron job (daily at 2:00 AM UTC)
 * 
 * Cleanup targets:
 * - guest-uploads/guest-*/ (游客上传的原图)
 * 
 * This helps control storage costs by removing temporary files
 * that are no longer needed after testing or generation.
 * 
 * ⚠️ TODO: DEPLOYMENT DEFERRED TO PHASE 3
 * 
 * Status: Code ready, not deployed
 * Reason: MVP stage cost too low (~$0.01-0.03/month) to justify deployment
 * Deploy when: Daily guest uploads > 100 OR monthly storage cost > $1
 * Estimated time to deploy: 10-15 minutes
 * 
 * Manual cleanup alternative (run in Supabase SQL Editor):
 *   DELETE FROM storage.objects 
 *   WHERE bucket_id = 'guest-uploads' 
 *   AND created_at < NOW() - INTERVAL '7 days';
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DeleteResult {
  totalFiles: number
  expiredFiles: number
  deletedFiles: number
  errors: string[]
  deletedPaths: string[]
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client with service role key (full access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🧹 Starting cleanup of guest-uploads bucket...')
    console.log('📂 Targets: guest-*/ folders')

    // Define cutoff time (24 hours ago)
    const RETENTION_HOURS = 24
    const cutoffTime = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000)
    console.log(`⏰ Cutoff time: ${cutoffTime.toISOString()}`)

    const result: DeleteResult = {
      totalFiles: 0,
      expiredFiles: 0,
      deletedFiles: 0,
      errors: [],
      deletedPaths: []
    }

    // List all folders in guest-uploads bucket
    const { data: folders, error: listError } = await supabase.storage
      .from('guest-uploads')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      throw new Error(`Failed to list folders: ${listError.message}`)
    }

    if (!folders || folders.length === 0) {
      console.log('✅ No files found in guest-uploads')
      return new Response(
        JSON.stringify({ message: 'No files to clean up', result }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📂 Found ${folders.length} top-level items`)

    // Process each folder (guest-1768xxx, etc.)
    for (const folder of folders) {
      // Only process guest- folders
      const isGuestFolder = folder.name.startsWith('guest-')
      
      if (!isGuestFolder) continue

      console.log(`\n📁 Processing folder: ${folder.name}`)

      // List files in this guest folder
      const { data: files, error: filesError } = await supabase.storage
        .from('guest-uploads')
        .list(folder.name, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        })

      if (filesError) {
        console.error(`❌ Error listing files in ${folder.name}:`, filesError)
        result.errors.push(`${folder.name}: ${filesError.message}`)
        continue
      }

      if (!files || files.length === 0) {
        console.log(`  ℹ️  Empty folder, skipping`)
        continue
      }

      result.totalFiles += files.length
      console.log(`  📊 Found ${files.length} files`)

      // Filter expired files
      const expiredFiles = files.filter(file => {
        const fileDate = new Date(file.created_at)
        return fileDate < cutoffTime
      })

      if (expiredFiles.length === 0) {
        console.log(`  ✓ No expired files in this folder`)
        continue
      }

      result.expiredFiles += expiredFiles.length
      console.log(`  🗑️  ${expiredFiles.length} expired files to delete`)

      // Prepare full paths for deletion
      const filePaths = expiredFiles.map(f => `${folder.name}/${f.name}`)

      // Delete expired files
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('guest-uploads')
        .remove(filePaths)

      if (deleteError) {
        console.error(`  ❌ Delete error:`, deleteError)
        result.errors.push(`${folder.name}: ${deleteError.message}`)
        continue
      }

      result.deletedFiles += expiredFiles.length
      result.deletedPaths.push(...filePaths)
      console.log(`  ✅ Deleted ${expiredFiles.length} files from ${folder.name}`)
    }

    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Cleanup Summary:')
    console.log(`  Total files scanned: ${result.totalFiles}`)
    console.log(`  Expired files found: ${result.expiredFiles}`)
    console.log(`  Files deleted: ${result.deletedFiles}`)
    console.log(`  Errors: ${result.errors.length}`)
    console.log('='.repeat(50))

    // Return detailed result
    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed: ${result.deletedFiles} files deleted`,
        result,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Cleanup function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
