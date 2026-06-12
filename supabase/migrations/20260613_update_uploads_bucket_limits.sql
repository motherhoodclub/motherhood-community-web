-- Raise the upload size limit and broaden the accepted file types for the
-- `uploads` bucket (used by topics, workshops, collections, chat, profiles, files).
--
-- NOTE: The effective per-file ceiling is also bounded by the project-level
-- "Upload file size limit" under Storage settings in the Supabase dashboard.
-- If 500MB uploads are rejected, raise that global limit too.

update storage.buckets
set
  -- 500 MB per file (matches the UI copy on the new-topic form)
  file_size_limit = 524288000,
  -- NULL = allow every MIME type (images, videos, audio, pdf, docs, ...)
  allowed_mime_types = null
where id = 'uploads';
