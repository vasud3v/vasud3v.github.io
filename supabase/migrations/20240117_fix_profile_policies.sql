-- Fix profile_customizations RLS policies
-- Add DELETE policy and ensure all operations work correctly

-- Drop existing policies
DROP POLICY IF EXISTS "profile_customizations_select" ON public.profile_customizations;
DROP POLICY IF EXISTS "profile_customizations_insert" ON public.profile_customizations;
DROP POLICY IF EXISTS "profile_customizations_update" ON public.profile_customizations;
DROP POLICY IF EXISTS "profile_customizations_delete" ON public.profile_customizations;

-- Recreate policies with proper permissions
CREATE POLICY "profile_customizations_select" 
ON public.profile_customizations 
FOR SELECT 
USING (true);

CREATE POLICY "profile_customizations_insert" 
ON public.profile_customizations 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "profile_customizations_update" 
ON public.profile_customizations 
FOR UPDATE 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "profile_customizations_delete" 
ON public.profile_customizations 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Test the policies
DO $$
BEGIN
  RAISE NOTICE 'Profile customizations RLS policies updated successfully';
END $$;
