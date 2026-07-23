-- Workshop recordings: a Loom (or similar) embed URL, separate from the
-- live-meeting `zoom_url`. Populated by the admin after a workshop has
-- happened; rendered as an embedded player on the workshop detail page
-- instead of (or alongside) a plain "watch recording" link.

alter table if exists workshops
  add column if not exists recording_embed text;

comment on column workshops.recording_embed is
  'Safe embeddable iframe src URL for the workshop recording (e.g. a Loom /embed/ link), extracted from an admin-pasted embed snippet. See lib/embed.ts.';
