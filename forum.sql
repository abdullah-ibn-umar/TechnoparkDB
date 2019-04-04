--
-- PostgreSQL database dump
--

-- Dumped from database version 10.7 (Ubuntu 10.7-1.pgdg18.04+1)
-- Dumped by pg_dump version 11.2 (Ubuntu 11.2-1.pgdg18.04+1)

-- Started on 2019-04-04 06:38:04 MSK

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 24808)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 3070 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 262 (class 1255 OID 26203)
-- Name: check_post_parent(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.check_post_parent() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE 
	_thread integer;
BEGIN 
	IF NEW."ParentID" = NULL THEN
		RETURN NEW;
	ELSE
		SELECT INTO _thread "ThreadID" FROM post WHERE "PID" = NEW."ParentID";
		IF _thread <> NEW."ThreadID" THEN 
			RAISE EXCEPTION 'Parent post is in another thread %', NEW."ThreadID" USING ERRCODE='23505';
		ELSE
			RETURN NEW;
		END IF;
	END IF;
END;
$$;


ALTER FUNCTION public.check_post_parent() OWNER TO jahongir;

--
-- TOC entry 264 (class 1255 OID 24758)
-- Name: get_post_full(integer); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.get_post_full(_id integer) RETURNS TABLE(post_full json)
    LANGUAGE plpgsql
    AS $$BEGIN       
    IF EXISTS (SELECT 1 FROM post WHERE "PID" = _id) THEN
        SELECT INTO post_full json_build_object (
			'author',
                json_build_object (
                    'about', u.about,
                    'email', u.email,
                    'fullname', u.fullname,
                    'nickname', u.nickname
                ),
            'forum',  
                json_build_object (
                    'posts', f.posts,
                    'slug', f.slug,
                    'threads', f.threads,
                    'title', f.title,
                    'user', u3.nickname
                ),
            'post', 
                json_build_object(
                    'author', u.nickname,
                    'created', to_char(p.created::timestamptz at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                    'forum', f.slug,
                    'id', p."PID",
                    'isEdited', p."isEdited",
                    'message', p.message,
                    'parent', p."ParentID",
                    'thread', t."TID"
                ),
			'thread',   
                json_build_object (
                    'author', u2.nickname,
                    'created', to_char(t.created::timestamptz at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                    'forum', f.slug,
                    'id', t."TID",
                    'message', t.message,
                    'slug', t.slug,
                    'title', t.title,
                    'votes', t.votes
                )
            )
        FROM post p 
        INNER JOIN users u ON u."UID" = p."AuthorID"
        INNER JOIN forum f ON f."FID" = p."ForumID"
        INNER JOIN thread t ON t."TID" = p."ThreadID"
		INNER JOIN users u2 ON u2."UID" = t."AuthorID"
		INNER JOIN users u3 ON u3."UID" = f."UID"
        WHERE p."PID" = _id;
        RETURN NEXT;
    ELSE
        RETURN;
    END IF;
END 
$$;


ALTER FUNCTION public.get_post_full(_id integer) OWNER TO jahongir;

--
-- TOC entry 265 (class 1255 OID 25963)
-- Name: update_post(text, integer); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_post(msg text, _id integer) RETURNS TABLE(author public.citext, created timestamp with time zone, forum public.citext, id integer, "isEdited" boolean, message text, parent integer, thread integer)
    LANGUAGE plpgsql
    AS $$DECLARE 
	_message text;
BEGIN
	SELECT INTO _message post.message FROM post WHERE "PID" = _id;
	IF FOUND THEN 
		IF msg <> _message THEN 
			UPDATE post
				SET message = msg, "isEdited" = true
			WHERE "PID" = _id;
		END IF;
		
		RETURN QUERY
        SELECT
            u."nickname" as author,
            p.created,  
            f."slug" as forum,
            p."PID" as id,  
            p."isEdited", 
            p.message, 
            p."ParentID" as parent,
            t."TID" as thread
        FROM post p
        INNER JOIN users u ON u."UID" = p."AuthorID"
        INNER JOIN forum f ON f."FID" = p."ForumID"
        INNER JOIN thread t ON t."TID" = p."ThreadID"
        WHERE "PID" = _id;
	ELSE 
		RETURN;
	END IF;
END 
$$;


ALTER FUNCTION public.update_post(msg text, _id integer) OWNER TO jahongir;

--
-- TOC entry 213 (class 1255 OID 24735)
-- Name: update_post_quantity(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_post_quantity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN 
    UPDATE forum SET posts = posts + 1
	WHERE "FID" = NEW."ForumID";
	RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_post_quantity() OWNER TO jahongir;

--
-- TOC entry 212 (class 1255 OID 24737)
-- Name: update_thread_quantity(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_thread_quantity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN 
    UPDATE forum SET threads = threads + 1
	WHERE "FID" = NEW."ForumID";
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_thread_quantity() OWNER TO jahongir;

--
-- TOC entry 240 (class 1255 OID 24797)
-- Name: update_thread_votes(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_thread_votes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN 
    UPDATE thread SET votes = votes + NEW.voice
    WHERE "TID" = NEW."ThreadID"; 
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_thread_votes() OWNER TO jahongir;

--
-- TOC entry 261 (class 1255 OID 25678)
-- Name: update_thread_votes2(); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_thread_votes2() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN 
	UPDATE thread SET votes = votes + 2 * New.voice
	WHERE "TID" = NEW."ThreadID";
	RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_thread_votes2() OWNER TO jahongir;

--
-- TOC entry 263 (class 1255 OID 25555)
-- Name: update_vote(text, integer, integer); Type: FUNCTION; Schema: public; Owner: jahongir
--

CREATE FUNCTION public.update_vote(_author text, _thread integer, _voice integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$DECLARE 
    _uid integer;
    _old_voice integer;
    _id integer;
BEGIN 
    SELECT INTO _uid "UID" FROM users WHERE nickname = _author; 
    SELECT INTO _old_voice, _id voice, "VID" FROM vote WHERE "AuthorID" = _uid AND "ThreadID" = _thread;
    IF FOUND THEN
        IF _old_voice = _voice THEN
            RETURN 0;
        ELSE
            UPDATE vote SET voice = _voice WHERE "VID" = _id;
            RETURN 2 * _voice;
        END IF;
    ELSE
        INSERT INTO vote("AuthorID", "ThreadID", voice)
        VALUES (_uid, _thread, _voice);
        RETURN _voice;
    END IF;
END;
$$;


ALTER FUNCTION public.update_vote(_author text, _thread integer, _voice integer) OWNER TO jahongir;

SET default_with_oids = false;

--
-- TOC entry 199 (class 1259 OID 24629)
-- Name: forum; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.forum (
    "FID" integer NOT NULL,
    "UID" integer NOT NULL,
    slug public.citext NOT NULL,
    threads integer DEFAULT 0,
    title text NOT NULL,
    posts integer DEFAULT 0
);


ALTER TABLE public.forum OWNER TO jahongir;

--
-- TOC entry 200 (class 1259 OID 24644)
-- Name: fid; Type: SEQUENCE; Schema: public; Owner: jahongir
--

CREATE SEQUENCE public.fid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fid OWNER TO jahongir;

--
-- TOC entry 3071 (class 0 OID 0)
-- Dependencies: 200
-- Name: fid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.fid OWNED BY public.forum."FID";


--
-- TOC entry 203 (class 1259 OID 24672)
-- Name: post; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.post (
    "PID" integer NOT NULL,
    "ForumID" integer NOT NULL,
    "AuthorID" integer NOT NULL,
    "ThreadID" integer NOT NULL,
    "ParentID" integer,
    "isEdited" boolean DEFAULT false,
    message text NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    path integer[] DEFAULT '{}'::integer[]
);


ALTER TABLE public.post OWNER TO jahongir;

--
-- TOC entry 204 (class 1259 OID 24696)
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
-- TOC entry 3072 (class 0 OID 0)
-- Dependencies: 204
-- Name: pid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.pid OWNED BY public.post."PID";


--
-- TOC entry 201 (class 1259 OID 24649)
-- Name: thread; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.thread (
    "TID" integer NOT NULL,
    "ForumID" integer NOT NULL,
    "AuthorID" integer NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    slug public.citext,
    message text NOT NULL,
    title text NOT NULL,
    votes integer DEFAULT 0
);


ALTER TABLE public.thread OWNER TO jahongir;

--
-- TOC entry 202 (class 1259 OID 24667)
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
-- TOC entry 3073 (class 0 OID 0)
-- Dependencies: 202
-- Name: tid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.tid OWNED BY public.thread."TID";


--
-- TOC entry 197 (class 1259 OID 24591)
-- Name: users; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.users (
    "UID" integer NOT NULL,
    about text NOT NULL,
    email public.citext NOT NULL,
    fullname text NOT NULL,
    nickname public.citext NOT NULL
);


ALTER TABLE public.users OWNER TO jahongir;

--
-- TOC entry 198 (class 1259 OID 24601)
-- Name: uid; Type: SEQUENCE; Schema: public; Owner: jahongir
--

CREATE SEQUENCE public.uid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.uid OWNER TO jahongir;

--
-- TOC entry 3074 (class 0 OID 0)
-- Dependencies: 198
-- Name: uid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.uid OWNED BY public.users."UID";


--
-- TOC entry 205 (class 1259 OID 24777)
-- Name: vote; Type: TABLE; Schema: public; Owner: jahongir
--

CREATE TABLE public.vote (
    "VID" integer NOT NULL,
    "AuthorID" integer NOT NULL,
    "ThreadID" integer NOT NULL,
    voice integer NOT NULL
);


ALTER TABLE public.vote OWNER TO jahongir;

--
-- TOC entry 206 (class 1259 OID 24792)
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
-- TOC entry 3075 (class 0 OID 0)
-- Dependencies: 206
-- Name: vid; Type: SEQUENCE OWNED BY; Schema: public; Owner: jahongir
--

ALTER SEQUENCE public.vid OWNED BY public.vote."VID";


--
-- TOC entry 2902 (class 2604 OID 24646)
-- Name: forum FID; Type: DEFAULT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.forum ALTER COLUMN "FID" SET DEFAULT nextval('public.fid'::regclass);


--
-- TOC entry 2909 (class 2604 OID 24698)
-- Name: post PID; Type: DEFAULT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.post ALTER COLUMN "PID" SET DEFAULT nextval('public.pid'::regclass);


--
-- TOC entry 2905 (class 2604 OID 24669)
-- Name: thread TID; Type: DEFAULT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.thread ALTER COLUMN "TID" SET DEFAULT nextval('public.tid'::regclass);


--
-- TOC entry 2901 (class 2604 OID 24603)
-- Name: users UID; Type: DEFAULT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.users ALTER COLUMN "UID" SET DEFAULT nextval('public.uid'::regclass);


--
-- TOC entry 2912 (class 2604 OID 24794)
-- Name: vote VID; Type: DEFAULT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.vote ALTER COLUMN "VID" SET DEFAULT nextval('public.vid'::regclass);


--
-- TOC entry 2920 (class 2606 OID 24636)
-- Name: forum forum_pkey; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.forum
    ADD CONSTRAINT forum_pkey PRIMARY KEY ("FID");


--
-- TOC entry 2922 (class 2606 OID 25086)
-- Name: forum forum_slug_key; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.forum
    ADD CONSTRAINT forum_slug_key UNIQUE (slug);


--
-- TOC entry 2927 (class 2606 OID 24680)
-- Name: post post_pkey; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_pkey PRIMARY KEY ("PID");


--
-- TOC entry 2925 (class 2606 OID 24656)
-- Name: thread thread_pkey; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.thread
    ADD CONSTRAINT thread_pkey PRIMARY KEY ("TID");


--
-- TOC entry 2914 (class 2606 OID 24919)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 2916 (class 2606 OID 24943)
-- Name: users users_nickname_key; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nickname_key UNIQUE (nickname);


--
-- TOC entry 2918 (class 2606 OID 24598)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY ("UID");


--
-- TOC entry 2929 (class 2606 OID 24781)
-- Name: vote vote_pkey; Type: CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.vote
    ADD CONSTRAINT vote_pkey PRIMARY KEY ("VID");


--
-- TOC entry 2923 (class 1259 OID 25351)
-- Name: index_on_threads_slug; Type: INDEX; Schema: public; Owner: jahongir
--

CREATE UNIQUE INDEX index_on_threads_slug ON public.thread USING btree (slug);


--
-- TOC entry 2941 (class 2620 OID 26204)
-- Name: post before_insert; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER before_insert BEFORE INSERT ON public.post FOR EACH ROW EXECUTE PROCEDURE public.check_post_parent();


--
-- TOC entry 2942 (class 2620 OID 25792)
-- Name: vote insert_vote; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER insert_vote AFTER INSERT ON public.vote FOR EACH ROW EXECUTE PROCEDURE public.update_thread_votes();


--
-- TOC entry 2940 (class 2620 OID 24736)
-- Name: post update_forum_post; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER update_forum_post AFTER INSERT ON public.post FOR EACH ROW EXECUTE PROCEDURE public.update_post_quantity();


--
-- TOC entry 2939 (class 2620 OID 24738)
-- Name: thread update_forum_thread; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER update_forum_thread AFTER INSERT ON public.thread FOR EACH ROW EXECUTE PROCEDURE public.update_thread_quantity();


--
-- TOC entry 2943 (class 2620 OID 25825)
-- Name: vote update_vote; Type: TRIGGER; Schema: public; Owner: jahongir
--

CREATE TRIGGER update_vote AFTER UPDATE ON public.vote FOR EACH ROW EXECUTE PROCEDURE public.update_thread_votes2();


--
-- TOC entry 2930 (class 2606 OID 24637)
-- Name: forum forum_UID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.forum
    ADD CONSTRAINT "forum_UID_fkey" FOREIGN KEY ("UID") REFERENCES public.users("UID");


--
-- TOC entry 2936 (class 2606 OID 24730)
-- Name: post parent_id; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT parent_id FOREIGN KEY ("ParentID") REFERENCES public.post("PID");


--
-- TOC entry 2933 (class 2606 OID 24681)
-- Name: post post_AuthorID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT "post_AuthorID_fkey" FOREIGN KEY ("AuthorID") REFERENCES public.users("UID");


--
-- TOC entry 2934 (class 2606 OID 24686)
-- Name: post post_ForumID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT "post_ForumID_fkey" FOREIGN KEY ("ForumID") REFERENCES public.forum("FID");


--
-- TOC entry 2935 (class 2606 OID 24691)
-- Name: post post_ThreadID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT "post_ThreadID_fkey" FOREIGN KEY ("ThreadID") REFERENCES public.thread("TID");


--
-- TOC entry 2931 (class 2606 OID 24657)
-- Name: thread thread_AuthorID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.thread
    ADD CONSTRAINT "thread_AuthorID_fkey" FOREIGN KEY ("AuthorID") REFERENCES public.users("UID");


--
-- TOC entry 2932 (class 2606 OID 24662)
-- Name: thread thread_ForumID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.thread
    ADD CONSTRAINT "thread_ForumID_fkey" FOREIGN KEY ("ForumID") REFERENCES public.forum("FID");


--
-- TOC entry 2937 (class 2606 OID 24782)
-- Name: vote vote_AuthorID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.vote
    ADD CONSTRAINT "vote_AuthorID_fkey" FOREIGN KEY ("AuthorID") REFERENCES public.users("UID");


--
-- TOC entry 2938 (class 2606 OID 24787)
-- Name: vote vote_ThreadID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jahongir
--

ALTER TABLE ONLY public.vote
    ADD CONSTRAINT "vote_ThreadID_fkey" FOREIGN KEY ("ThreadID") REFERENCES public.thread("TID");


-- Completed on 2019-04-04 06:38:04 MSK

--
-- PostgreSQL database dump complete
--

