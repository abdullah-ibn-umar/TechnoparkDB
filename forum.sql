--
-- PostgreSQL database dump
--

-- Dumped from database version 10.7 (Ubuntu 10.7-1.pgdg18.04+1)
-- Dumped by pg_dump version 11.3 (Ubuntu 11.3-0ubuntu0.19.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: check_post_parent(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.check_post_parent() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    _thread integer;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    ELSE
        SELECT INTO _thread thread FROM post WHERE pid = NEW.parent_id;
        IF _thread <> NEW.thread THEN
            RAISE EXCEPTION 'Parent post is in another thread %', NEW.thread USING ERRCODE = '23505';
        ELSE
            RETURN NEW;
        END IF;
    END IF;
END;
$$;


ALTER FUNCTION public.check_post_parent() OWNER TO jahongir;

--
-- Name: get_post_full(integer); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.get_post_full(_id integer) RETURNS TABLE(post_full json)
    LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS(SELECT 1 FROM post WHERE pid = _id) THEN
        SELECT INTO
            post_full json_build_object(
                              'author',
                              json_build_object(
                                      'about', u.about,
                                      'email', u.email,
                                      'fullname', u.fullname,
                                      'nickname', u.nickname
                                  ),
                              'forum',
                              json_build_object(
                                      'posts', f.posts,
                                      'slug', f.slug,
                                      'threads', f.threads,
                                      'title', f.title,
                                      'user', f.author
                                  ),
                              'post',
                              json_build_object(
                                      'author', p.author,
                                      'created', to_char(p.created::timestamptz at time zone 'UTC',
                                                         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                                      'forum', p.forum,
                                      'id', p.pid,
                                      'isEdited', p.is_edited,
                                      'message', p.message,
                                      'parent', p.parent_id,
                                      'thread', p.thread
                                  ),
                              'thread',
                              json_build_object(
                                      'author', t.author,
                                      'created', to_char(t.created::timestamptz at time zone 'UTC',
                                                         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                                      'forum', t.forum,
                                      'id', t.tid,
                                      'message', t.message,
                                      'slug', t.slug,
                                      'title', t.title,
                                      'votes', t.votes
                                  )
                          )
        FROM post p, users u, thread t, forum f WHERE p.pid = _id
                                                  AND p.author = u.nickname
                                                  AND p.thread = t.tid
                                                  AND p.forum = f.slug;
        RETURN NEXT;
    ELSE
        RETURN;
    END IF;
END
$$;


ALTER FUNCTION public.get_post_full(_id integer) OWNER TO jahongir;

--
-- Name: update_post(text, integer); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_post(msg text, _id integer) RETURNS TABLE(author public.citext, created timestamp with time zone, forum public.citext, id integer, is_edited boolean, message text, parent integer, thread integer)
    LANGUAGE plpgsql
AS $$
DECLARE
    _message text;
BEGIN
    SELECT INTO _message post.message FROM post WHERE pid = _id;
    IF FOUND THEN
        IF msg <> _message THEN
            UPDATE post
            SET message    = msg,
                is_edited = true
            WHERE pid = _id;
        END IF;

        RETURN QUERY
            SELECT post.author,
                   post.created,
                   post.forum,
                   post.pid as id,
                   post.is_edited,
                   post.message,
                   post.parent_id as parent,
                   post.thread
            FROM post
            WHERE pid = _id;
    ELSE
        RETURN;
    END IF;
END
$$;

ALTER FUNCTION public.update_post(msg text, _id integer) OWNER TO jahongir;

--
-- Name: update_post_quantity(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_post_quantity() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE forum
    SET posts = posts + 1
    WHERE slug = NEW.forum;

    INSERT INTO user_posts (author, forum)
    SELECT NEW.author, NEW.forum
    WHERE NOT EXISTS (
            SELECT 1
            FROM user_posts
            WHERE author = NEW.author
              AND forum = NEW.forum
            LIMIT 1
        );

    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_post_quantity() OWNER TO jahongir;

--
-- Name: update_thread_quantity(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_thread_quantity() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE forum
    SET threads = threads + 1
    WHERE slug = NEW.forum;

    INSERT INTO user_posts (author, forum)
    SELECT NEW.author, NEW.forum
    WHERE NOT EXISTS (
            SELECT 1
            FROM user_posts
            WHERE author = NEW.author
              AND forum = NEW.forum
            LIMIT 1
        );

    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_thread_quantity() OWNER TO jahongir;

--
-- Name: update_thread_votes(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_thread_votes() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE thread
    SET votes = votes + NEW.voice
    WHERE tid = NEW.thread;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_thread_votes() OWNER TO jahongir;

--
-- Name: update_thread_votes2(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_thread_votes2() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE thread
    SET votes = votes + 2 * New.voice
    WHERE tid = NEW.thread;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_thread_votes2() OWNER TO jahongir;

--
-- Name: update_vote(text, integer, integer); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_vote(_author text, _thread integer, _voice integer) RETURNS integer
    LANGUAGE plpgsql
AS $$
DECLARE
    _id        integer;
    _old_voice integer;
BEGIN
    SELECT voice, vid INTO _old_voice, _id FROM public.vote WHERE author = _author AND thread = _thread;
    IF FOUND THEN
        IF _old_voice = _voice THEN
            RETURN 0;
        ELSE
            UPDATE public.vote SET voice = _voice WHERE vid = _id;
            RETURN 2 * _voice;
        END IF;
    ELSE
        INSERT INTO public.vote(author, thread, voice)
        VALUES (_author, _thread, _voice);
        RETURN _voice;
    END IF;
END;
$$;


ALTER FUNCTION public.update_vote(_author text, _thread integer, _voice integer) OWNER TO jahongir;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: users; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.users (
                              about text NOT NULL,
                              email public.citext NOT NULL UNIQUE,
                              fullname text NOT NULL,
                              nickname public.citext NOT NULL UNIQUE
);


ALTER TABLE public.users OWNER TO jahongir;

--
-- Name: forum; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.forum (
                              author public.citext NOT NULL REFERENCES public.users(nickname),
                              slug public.citext NOT NULL PRIMARY KEY UNIQUE,
                              threads integer DEFAULT 0,
                              title text NOT NULL,
                              posts integer DEFAULT 0
);

ALTER TABLE public.forum OWNER TO jahongir;

--
-- Name: thread; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.thread (
                               tid serial NOT NULL PRIMARY KEY,
                               forum public.citext NOT NULL REFERENCES public.forum(slug),
                               author public.citext NOT NULL REFERENCES public.users(nickname),
                               created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                               slug public.citext UNIQUE,
                               message text NOT NULL,
                               title text NOT NULL,
                               votes integer DEFAULT 0
);


ALTER TABLE public.thread OWNER TO jahongir;

--
-- Name: tid; Type: SEQUENCE; Schema: public; Owner: jahongir
--

CREATE SEQUENCE public.tid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tid OWNER TO jahongir;

--
-- Name: tid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.tid OWNED BY public.thread.tid;

--
-- Name: post; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.post (
                             pid serial NOT NULL PRIMARY KEY,
                             root  integer NOT NULL DEFAULT 0,
                             forum public.citext NOT NULL REFERENCES public.forum(slug),
                             author public.citext NOT NULL REFERENCES public.users(nickname),
                             thread integer NOT NULL REFERENCES public.thread(tid),
                             parent_id integer REFERENCES public.post (pid),
                             is_edited boolean DEFAULT false,
                             message text NOT NULL,
                             created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                             path integer[] DEFAULT '{}'::integer[]
);

ALTER TABLE public.post OWNER TO jahongir;

--
-- Name: pid; Type: SEQUENCE; Schema: public; Owner: jahongir
--

CREATE SEQUENCE public.pid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pid OWNER TO jahongir;

--
-- Name: pid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.pid OWNED BY public.post.pid;

CREATE FUNCTION public.new_post() RETURNS trigger AS
$$
BEGIN
    NEW.path = NEW.path || (SELECT currval('pid'))::INTEGER;
    NEW.root = NEW.path[1];
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;


CREATE TRIGGER new_post BEFORE INSERT ON public.post
    FOR EACH ROW EXECUTE PROCEDURE public.new_post();

--
-- Name: user_posts; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.user_posts (
                                   forum  public.citext NOT NULL REFERENCES public.forum(slug),
                                   author public.citext NOT NULL REFERENCES public.users(nickname)
);


ALTER TABLE public.user_posts OWNER TO jahongir;

--
-- Name: vote; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.vote (
                             vid serial NOT NULL PRIMARY KEY,
                             author public.citext NOT NULL REFERENCES public.users(nickname),
                             thread integer NOT NULL REFERENCES public.thread(tid),
                             voice integer NOT NULL
);


ALTER TABLE public.vote OWNER TO jahongir;

--
-- Name: vid; Type: SEQUENCE; Schema: public; Owner: jahongir
--

CREATE SEQUENCE public.vid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vid OWNER TO jahongir;

--
-- Name: vid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.vid OWNED BY public.vote.vid;

--a
-- Name: thread TID; Type: DEFAULT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.thread ALTER COLUMN tid SET DEFAULT nextval('public.tid'::regclass);
ALTER TABLE ONLY public.vote ALTER COLUMN vid SET DEFAULT nextval('public.vid'::regclass);
ALTER TABLE ONLY public.post ALTER COLUMN pid SET DEFAULT nextval('public.pid'::regclass);

--
-- Name: index_on_posts_path; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE INDEX index_on_root_posts_path ON public.post USING btree (root, path);

--
-- Name: index_on_posts_thread_id; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE INDEX index_on_posts_thread_id ON public.post USING btree (thread, pid);

--
-- Name: index_on_threads_slug; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE UNIQUE INDEX index_on_threads_slug ON public.thread USING btree (slug);

--
-- Name: index_on_user_posts; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE UNIQUE INDEX index_on_user_posts ON public.user_posts USING btree (author, forum);

--
-- Name: index_on_user_posts_forum; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE INDEX index_on_user_posts_forum ON public.user_posts USING btree (forum);

--
-- Name: index_on_users_nickname_c; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE UNIQUE INDEX index_on_users_nickname_c ON public.users USING btree (nickname COLLATE "C");

--
-- Name: post before_insert; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER before_insert BEFORE INSERT ON public.post FOR EACH ROW EXECUTE PROCEDURE public.check_post_parent();

--
-- Name: vote insert_vote; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER insert_vote AFTER INSERT ON public.vote FOR EACH ROW EXECUTE PROCEDURE public.update_thread_votes();

--
-- Name: post update_forum_post; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER update_forum_post AFTER INSERT ON public.post FOR EACH ROW EXECUTE PROCEDURE public.update_post_quantity();

--
-- Name: thread update_forum_thread; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER update_forum_thread AFTER INSERT ON public.thread FOR EACH ROW EXECUTE PROCEDURE public.update_thread_quantity();

--
-- Name: vote update_vote; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER update_vote AFTER UPDATE ON public.vote FOR EACH ROW EXECUTE PROCEDURE public.update_thread_votes2();

CREATE INDEX index_on_threads_forum_created ON public.thread (forum, created);
--
-- PostgreSQL database dump complete
--
