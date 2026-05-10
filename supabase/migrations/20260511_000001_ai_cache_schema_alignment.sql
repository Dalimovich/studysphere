-- Align AI/RAG cache schema with the current Netlify functions.
-- Safe to run on existing databases: all changes are additive/idempotent.

alter table if exists public.ai_answer_cache
  add column if not exists mode text not null default 'strict';

alter table if exists public.ai_question_cache
  add column if not exists mode text not null default 'strict';

alter table if exists public.retrieval_cache
  add column if not exists chunk_entries jsonb;

-- Older installs used top_chunk_ids uuid[]. Convert those rows to the richer
-- shape expected by ai-ask.js, preserving order and leaving similarity unknown.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'retrieval_cache'
      and column_name = 'top_chunk_ids'
  ) then
    execute $sql$
      update public.retrieval_cache
      set chunk_entries = (
        select coalesce(jsonb_agg(jsonb_build_object('id', chunk_id::text, 'similarity', 0.5) order by ord), '[]'::jsonb)
        from unnest(top_chunk_ids) with ordinality as t(chunk_id, ord)
      )
      where chunk_entries is null
    $sql$;
  end if;
end $$;

update public.retrieval_cache
set chunk_entries = '[]'::jsonb
where chunk_entries is null;

alter table if exists public.retrieval_cache
  alter column chunk_entries set not null;

create index if not exists ai_answer_cache_lookup_mode_idx
  on public.ai_answer_cache (user_id, course_id, question_hash, document_version_hash, mode);

create index if not exists ai_question_cache_lookup_mode_idx
  on public.ai_question_cache (user_id, course_id, document_version_hash, mode);

create index if not exists retrieval_cache_lookup_idx
  on public.retrieval_cache (user_id, course_id, question_hash, document_version_hash);

create or replace function public.match_cached_questions(
  p_user_id               uuid,
  p_course_id             text,
  p_embedding             vector(1536),
  p_document_version_hash text,
  p_mode                  text             default 'strict',
  p_threshold             double precision default 0.92,
  p_limit                 integer          default 1
)
returns table (
  id              uuid,
  question        text,
  answer_cache_id uuid,
  similarity      double precision
)
language sql stable as $$
  select
    qc.id,
    qc.question,
    qc.answer_cache_id,
    1 - (qc.question_embedding <=> p_embedding) as similarity
  from public.ai_question_cache qc
  where qc.user_id = p_user_id
    and qc.course_id = p_course_id
    and qc.document_version_hash = p_document_version_hash
    and qc.mode = p_mode
    and qc.answer_cache_id is not null
    and 1 - (qc.question_embedding <=> p_embedding) >= p_threshold
  order by qc.question_embedding <=> p_embedding
  limit p_limit;
$$;

grant execute on function public.match_cached_questions(uuid, text, vector, text, text, double precision, integer)
  to authenticated, service_role;
