
CREATE TABLE public.auth_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_type text NOT NULL DEFAULT 'bearer'::text,
  access_expires_at timestamp with time zone NOT NULL,
  session_expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT auth_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  api_base_url text NOT NULL UNIQUE,
  rate_limit text,
  registration_limit integer NOT NULL DEFAULT 2,
  supports_immersive_translation boolean NOT NULL DEFAULT false,
  supports_ldc boolean NOT NULL DEFAULT false,
  supports_checkin boolean NOT NULL DEFAULT false,
  checkin_url text,
  checkin_note text,
  benefit_url text,
  status_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  is_visible boolean NOT NULL DEFAULT true,
  CONSTRAINT site_pkey PRIMARY KEY (id),
  CONSTRAINT site_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT site_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.site_extension_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  CONSTRAINT site_extension_links_pkey PRIMARY KEY (id),
  CONSTRAINT site_extension_links_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.site(id),
  CONSTRAINT site_extension_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT site_extension_links_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.site_maintainers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  name text NOT NULL,
  profile_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  CONSTRAINT site_maintainers_pkey PRIMARY KEY (id),
  CONSTRAINT site_maintainers_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.site(id),
  CONSTRAINT site_maintainers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT site_maintainers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.site_tags (
  site_id uuid NOT NULL,
  tag_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT site_tags_pkey PRIMARY KEY (site_id, tag_id),
  CONSTRAINT site_tags_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.site(id),
  CONSTRAINT site_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);