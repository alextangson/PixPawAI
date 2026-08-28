-- Local migration only: apply after deployment approval.
-- FLUX-dev prompt_strength=1 destroys the reference image information.
-- The API also caps this style so stale rows/client overrides cannot restore 0.92.
UPDATE public.styles
SET recommended_strength_min = 0.9,
    enable_go_fast = false,
    prompt_suffix = ', pet portrait of the original animal wearing a fluffy red and white Santa hat fitted around its ears, preserve the pet face and natural animal anatomy, festive holiday spirit, bright joyful eyes, solid bold red background, professional pet photography, clean composition, warm and cheerful atmosphere, 8k resolution.'
WHERE id = 'Christmas-Vibe';
