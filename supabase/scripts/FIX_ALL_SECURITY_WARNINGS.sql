    -- Comprehensive fix for all Supabase security linter warnings
    -- Run this after ENABLE_RLS_ON_TABLES.sql

    -- ============================================================================
    -- 1. Fix SECURITY DEFINER views (convert to SECURITY INVOKER)
    -- ============================================================================

    -- Drop and recreate post_statistics view without SECURITY DEFINER
    DROP VIEW IF EXISTS public.post_statistics CASCADE;
    CREATE OR REPLACE VIEW public.post_statistics
    WITH (security_invoker = true)
    AS
    SELECT 
    p.id,
    p.thread_id,
    p.author_id,
    p.created_at,
    p.word_count,
    p.read_time_minutes,
    p.upvotes,
    p.downvotes,
    p.likes,
    p.version,
    (p.upvotes - p.downvotes) as vote_score,
    COUNT(DISTINCT pr.id) as reaction_count,
    COUNT(DISTINCT pb.id) as bookmark_count,
    COUNT(DISTINCT pv.id) as view_count,
    COUNT(DISTINCT rep.id) FILTER (WHERE rep.status = 'pending') as pending_reports
    FROM public.posts p
    LEFT JOIN public.post_reactions pr ON pr.post_id = p.id
    LEFT JOIN public.post_bookmarks pb ON pb.post_id = p.id
    LEFT JOIN public.post_views pv ON pv.post_id = p.id
    LEFT JOIN public.post_reports rep ON rep.post_id = p.id
    WHERE p.is_deleted = false
    GROUP BY p.id;

    -- Drop and recreate user_post_analytics view without SECURITY DEFINER
    DROP VIEW IF EXISTS public.user_post_analytics;
    CREATE OR REPLACE VIEW public.user_post_analytics
    WITH (security_invoker = true)
    AS
    SELECT 
    p.author_id,
    COUNT(*) as total_posts,
    SUM(p.upvotes) as total_upvotes,
    SUM(p.downvotes) as total_downvotes,
    SUM(p.upvotes - p.downvotes) as net_votes,
    AVG(p.upvotes - p.downvotes) as avg_vote_score,
    SUM(p.word_count) as total_words_written,
    COUNT(*) FILTER (WHERE p.is_answer = true) as best_answers,
    COUNT(DISTINCT pr.id) as total_reactions_received
    FROM public.posts p
    LEFT JOIN public.post_reactions pr ON pr.post_id = p.id
    WHERE p.is_deleted = false
    GROUP BY p.author_id;

    -- ============================================================================
    -- 2. Fix function search_path issues (add SET search_path)
    -- ============================================================================

    -- Fix is_admin_or_supermod function
    CREATE OR REPLACE FUNCTION public.is_admin_or_supermod(check_user_id TEXT)
    RETURNS BOOLEAN 
    LANGUAGE SQL 
    SECURITY DEFINER 
    STABLE
    SET search_path = public, pg_temp
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.forum_users
        WHERE id = check_user_id
        AND role IN ('admin', 'super_moderator')
    );
    $$;

    -- Fix handle_new_user function
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    BEGIN
        INSERT INTO public.forum_users (id, username, email, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
            NEW.email,
            'member'
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
    END;
    $$;

    -- Fix calculate_post_metrics function
    CREATE OR REPLACE FUNCTION public.calculate_post_metrics()
    RETURNS TRIGGER 
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
    AS $$
    BEGIN
    -- Calculate word count (approximate)
    NEW.word_count := array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1);
    
    -- Calculate reading time (assuming 200 words per minute)
    NEW.read_time_minutes := GREATEST(1, CEIL(NEW.word_count::NUMERIC / 200));
    
    RETURN NEW;
    END;
    $$;

    -- Fix create_post_edit_history function
    CREATE OR REPLACE FUNCTION public.create_post_edit_history()
    RETURNS TRIGGER 
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
    AS $$
    BEGIN
    -- Only create history if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        -- Increment version
        NEW.version := OLD.version + 1;
        
        -- Insert history record
        INSERT INTO public.post_edit_history (
        post_id,
        content,
        edited_by,
        edit_reason,
        edited_at,
        version,
        word_count
        ) VALUES (
        OLD.id,
        OLD.content,
        NEW.author_id,
        NEW.last_edit_reason,
        OLD.edited_at,
        OLD.version,
        OLD.word_count
        );
        
        -- Update edited_at timestamp
        NEW.edited_at := NOW();
    END IF;
    
    RETURN NEW;
    END;
    $$;

    -- Fix update_report_timestamp function
    CREATE OR REPLACE FUNCTION public.update_report_timestamp()
    RETURNS TRIGGER 
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
    AS $$
    BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
    END;
    $$;

    -- Fix update_poll_vote_counts function (if it exists)
    -- Note: This function may need to be created if it doesn't exist yet
    CREATE OR REPLACE FUNCTION public.update_poll_vote_counts()
    RETURNS TRIGGER 
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
    AS $$
    BEGIN
    -- Update poll option vote counts
    UPDATE poll_options
    SET vote_count = (
        SELECT COUNT(*) FROM poll_votes
        WHERE option_id = NEW.option_id
    )
    WHERE id = NEW.option_id;
    RETURN NEW;
    END;
    $$;

    -- Fix is_staff function
    CREATE OR REPLACE FUNCTION public.is_staff(check_user_id TEXT)
    RETURNS BOOLEAN 
    LANGUAGE SQL 
    SECURITY DEFINER 
    STABLE
    SET search_path = public, pg_temp
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.forum_users
        WHERE id = check_user_id
        AND role IN ('admin', 'super_moderator', 'moderator')
    );
    $$;

    -- ============================================================================
    -- 3. Fix overly permissive RLS policy on post_views
    -- ============================================================================

    -- Drop the permissive policy
    DROP POLICY IF EXISTS "Anyone can insert views" ON public.post_views;

    -- Drop the new policy if it exists (in case of re-running)
    DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.post_views;

    -- Create a more restrictive policy (authenticated users only)
    -- Note: If you need anonymous users to track views, keep the original policy
    -- For now, restricting to authenticated users for better security
    CREATE POLICY "Authenticated users can insert views"
    ON public.post_views
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

    -- The select policy already exists and is fine

    -- ============================================================================
    -- Verification queries
    -- ============================================================================

    -- Check views are now SECURITY INVOKER
    SELECT 
        schemaname,
        viewname,
        viewowner
    FROM pg_views
    WHERE schemaname = 'public'
        AND viewname IN ('post_statistics', 'user_post_analytics');

    -- Check functions have search_path set
    SELECT 
        n.nspname as schema,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        p.prosecdef as security_definer,
        p.proconfig as config_settings
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.proname IN (
            'is_admin_or_supermod',
            'handle_new_user',
            'calculate_post_metrics',
            'create_post_edit_history',
            'update_report_timestamp',
            'update_poll_vote_counts',
            'is_staff'
        );

    -- Check post_views policies
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'post_views';
