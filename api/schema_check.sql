--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_ajustementappels_type_ajustement; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_ajustementappels_type_ajustement AS ENUM (
    'Remise',
    'Majoration',
    'Correction'
);


--
-- Name: enum_appels_section; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appels_section AS ENUM (
    'Expert Comptable',
    'Société Expert'
);


--
-- Name: enum_appels_statut; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appels_statut AS ENUM (
    'Expert Comptable',
    'Expert Stagiaire'
);


--
-- Name: enum_appels_titre; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appels_titre AS ENUM (
    'Tableau A',
    'Tableau B'
);


--
-- Name: enum_dossier_revision_statut; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_dossier_revision_statut AS ENUM (
    'OUI',
    'NON',
    'NA'
);


--
-- Name: enum_recherche_doublons_statut; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_recherche_doublons_statut AS ENUM (
    'VALIDE',
    'NON_VALIDE'
);


--
-- Name: enum_revu_analytique_type_revue; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_revu_analytique_type_revue AS ENUM (
    'analytiqueNN1',
    'analytiqueMensuelle'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abonnements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abonnements (
    id integer NOT NULL,
    compte_id bigint DEFAULT 0 NOT NULL,
    date_debut timestamp with time zone,
    date_fin timestamp with time zone,
    expire boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: abonnements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.abonnements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: abonnements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.abonnements_id_seq OWNED BY public.abonnements.id;


--
-- Name: ajustementappels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ajustementappels (
    id integer NOT NULL,
    exercice_id integer NOT NULL,
    membre_id integer NOT NULL,
    montant_ajustement numeric(15,2) DEFAULT 0,
    motif character varying(255) NOT NULL,
    type_ajustement public.enum_ajustementappels_type_ajustement DEFAULT 'Correction'::public.enum_ajustementappels_type_ajustement,
    date_ajustement timestamp with time zone,
    section character varying(255),
    statut character varying(255),
    titre character varying(255),
    etat character varying(255) DEFAULT 'En attente'::character varying,
    valide boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: ajustementappels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ajustementappels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ajustementappels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ajustementappels_id_seq OWNED BY public.ajustementappels.id;


--
-- Name: analyse_client_anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyse_client_anomalies (
    id integer NOT NULL,
    id_dossier integer NOT NULL,
    id_ligne integer NOT NULL,
    compte character varying(255) NOT NULL,
    id_periode integer,
    id_exercice integer NOT NULL,
    type_anomalie character varying(100) NOT NULL,
    commentaire text NOT NULL,
    valider boolean DEFAULT false NOT NULL,
    commentaire_validation text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: COLUMN analyse_client_anomalies.type_anomalie; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.analyse_client_anomalies.type_anomalie IS 'Type d''anomalie: paiement_sans_facture, facture_3mois, ajustement_non_traite, solde_suspens';


--
-- Name: analyse_client_anomalies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analyse_client_anomalies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analyse_client_anomalies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analyse_client_anomalies_id_seq OWNED BY public.analyse_client_anomalies.id;


--
-- Name: analyse_client_lignes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyse_client_lignes (
    id integer NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer,
    id_ligne integer NOT NULL,
    compte character varying(255) NOT NULL,
    code_journal character varying(255),
    type_journal character varying(50),
    date_ecriture date,
    piece character varying(255),
    libelle text,
    debit numeric(15,2) DEFAULT 0 NOT NULL,
    credit numeric(15,2) DEFAULT 0 NOT NULL,
    lettrage character varying(50),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: analyse_client_lignes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analyse_client_lignes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analyse_client_lignes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analyse_client_lignes_id_seq OWNED BY public.analyse_client_lignes.id;


--
-- Name: analyse_fournisseur_anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyse_fournisseur_anomalies (
    id integer NOT NULL,
    id_dossier integer NOT NULL,
    id_ligne integer NOT NULL,
    compte character varying(255) NOT NULL,
    id_periode integer,
    id_exercice integer NOT NULL,
    type_anomalie character varying(100) NOT NULL,
    commentaire text NOT NULL,
    valider boolean DEFAULT false NOT NULL,
    commentaire_validation text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: COLUMN analyse_fournisseur_anomalies.type_anomalie; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.analyse_fournisseur_anomalies.type_anomalie IS 'Type d''anomalie: paiement_sans_facture, facture_3mois, ajustement_non_traite, solde_suspens';


--
-- Name: analyse_fournisseur_anomalies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analyse_fournisseur_anomalies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analyse_fournisseur_anomalies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analyse_fournisseur_anomalies_id_seq OWNED BY public.analyse_fournisseur_anomalies.id;


--
-- Name: analyse_fournisseur_lignes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyse_fournisseur_lignes (
    id integer NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer,
    id_ligne integer NOT NULL,
    compte character varying(255) NOT NULL,
    code_journal character varying(255),
    type_journal character varying(50),
    date_ecriture date,
    piece character varying(255),
    libelle text,
    debit numeric(15,2) DEFAULT 0 NOT NULL,
    credit numeric(15,2) DEFAULT 0 NOT NULL,
    lettrage character varying(50),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: analyse_fournisseur_lignes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analyse_fournisseur_lignes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analyse_fournisseur_lignes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analyse_fournisseur_lignes_id_seq OWNED BY public.analyse_fournisseur_lignes.id;


--
-- Name: analytiques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytiques (
    id bigint NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint NOT NULL,
    id_exercice bigint NOT NULL,
    id_ligne_ecriture bigint NOT NULL,
    id_axe bigint NOT NULL,
    id_section bigint NOT NULL,
    debit double precision DEFAULT '0'::double precision NOT NULL,
    credit double precision DEFAULT '0'::double precision NOT NULL,
    pourcentage double precision DEFAULT '0'::double precision NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: analytiques_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytiques_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytiques_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytiques_id_seq OWNED BY public.analytiques.id;


--
-- Name: appels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appels (
    id integer NOT NULL,
    exercice_id integer NOT NULL,
    membre_id integer NOT NULL,
    montant_du numeric(15,2) DEFAULT 0,
    regime character varying(255),
    date_appel timestamp with time zone,
    etat character varying(255) DEFAULT 'En attente'::character varying,
    section public.enum_appels_section,
    statut public.enum_appels_statut,
    titre public.enum_appels_titre,
    associe integer,
    valide boolean DEFAULT false,
    total_ajustement numeric(15,2) DEFAULT 0,
    appelnet numeric(15,2) DEFAULT 0
);


--
-- Name: appels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appels_id_seq OWNED BY public.appels.id;


--
-- Name: balanceimportees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balanceimportees (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    id_exercice bigint DEFAULT 0 NOT NULL,
    compte character varying(50),
    libelle character varying(100),
    mvtdebit double precision DEFAULT '0'::double precision NOT NULL,
    mvtcredit double precision DEFAULT '0'::double precision NOT NULL,
    soldedebit double precision DEFAULT '0'::double precision NOT NULL,
    soldecredit double precision DEFAULT '0'::double precision NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: balanceimportees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.balanceimportees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: balanceimportees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.balanceimportees_id_seq OWNED BY public.balanceimportees.id;


--
-- Name: balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balances (
    id integer NOT NULL,
    id_compte bigint DEFAULT 0 NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    id_exercice bigint DEFAULT 0 NOT NULL,
    id_numcompte bigint DEFAULT 0 NOT NULL,
    id_numcomptecentr bigint DEFAULT 0 NOT NULL,
    mvtdebit double precision DEFAULT '0'::double precision NOT NULL,
    mvtcredit double precision DEFAULT '0'::double precision NOT NULL,
    soldedebit double precision DEFAULT '0'::double precision NOT NULL,
    soldecredit double precision DEFAULT '0'::double precision NOT NULL,
    mvtdebittreso double precision DEFAULT '0'::double precision NOT NULL,
    mvtcredittreso double precision DEFAULT '0'::double precision NOT NULL,
    soldedebittreso double precision DEFAULT '0'::double precision NOT NULL,
    soldecredittreso double precision DEFAULT '0'::double precision NOT NULL,
    valeur double precision DEFAULT '0'::double precision NOT NULL,
    valeurtreso double precision DEFAULT '0'::double precision NOT NULL,
    rubriquebilanbrut bigint DEFAULT 0 NOT NULL,
    rubriquebilanamort bigint DEFAULT 0 NOT NULL,
    rubriquecrn bigint DEFAULT 0 NOT NULL,
    rubriquecrf bigint DEFAULT 0 NOT NULL,
    rubriquetftd bigint DEFAULT 0 NOT NULL,
    rubriquetfti bigint DEFAULT 0 NOT NULL,
    rubriqueevcp bigint DEFAULT 0 NOT NULL,
    nature character varying(25),
    senscalculbilan character varying(3),
    senscalculcrn character varying(3),
    senscalculcrf character varying(3),
    senscalcultftd character varying(3),
    senscalcultfti character varying(3),
    rubriquebilanactifbrutexterne character varying(255) DEFAULT 0,
    rubriquebilanactifamortexterne character varying(255) DEFAULT 0,
    rubriquebilanpassifbrutexterne character varying(255) DEFAULT 0,
    rubriquecrnexterne character varying(255) DEFAULT 0,
    rubriquecrfexterne character varying(255) DEFAULT 0,
    rubriquetftdexterne character varying(255) DEFAULT 0,
    rubriquetftiexterne character varying(255) DEFAULT 0,
    rubriquesig character varying(255) DEFAULT 0,
    senscalculbilanamort character varying(3),
    senscalculbilanbrut character varying(3),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.balances_id_seq OWNED BY public.balances.id;


--
-- Name: caaxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caaxes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    libelle character varying(100) NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: caaxes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.caaxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: caaxes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.caaxes_id_seq OWNED BY public.caaxes.id;


--
-- Name: casections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.casections (
    id integer NOT NULL,
    id_axe bigint NOT NULL,
    section character varying(50) NOT NULL,
    intitule character varying(100),
    compte character varying(30),
    id_compte bigint NOT NULL,
    id_dossier bigint NOT NULL,
    fermer boolean DEFAULT false,
    par_defaut boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: casections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.casections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: casections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.casections_id_seq OWNED BY public.casections.id;


--
-- Name: codejournals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codejournals (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    code character varying(10),
    libelle character varying(100),
    type character varying(20),
    compteassocie character varying(30),
    nif character varying(25),
    stat character varying(25),
    adresse character varying(200),
    taux_tva numeric(10,4),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: codejournals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codejournals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codejournals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codejournals_id_seq OWNED BY public.codejournals.id;


--
-- Name: commentaire_analytique_mensuelle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commentaire_analytique_mensuelle (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_exercice bigint NOT NULL,
    id_dossier bigint NOT NULL,
    id_periode bigint,
    compte character varying(50) NOT NULL,
    commentaire text,
    anomalies boolean DEFAULT false NOT NULL,
    valide_anomalie boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: commentaire_analytique_mensuelle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commentaire_analytique_mensuelle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commentaire_analytique_mensuelle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commentaire_analytique_mensuelle_id_seq OWNED BY public.commentaire_analytique_mensuelle.id;


--
-- Name: commentaireanalytiques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commentaireanalytiques (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_exercice bigint NOT NULL,
    id_dossier bigint NOT NULL,
    id_periode bigint,
    compte character varying(50) NOT NULL,
    commentaire text,
    valide_anomalie boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: COLUMN commentaireanalytiques.compte; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.commentaireanalytiques.compte IS 'Référence au compte général (comptegen)';


--
-- Name: COLUMN commentaireanalytiques.valide_anomalie; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.commentaireanalytiques.valide_anomalie IS 'Checkbox pour valider que l''anomalie a été traitée';


--
-- Name: commentaireanalytiques_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commentaireanalytiques_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commentaireanalytiques_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commentaireanalytiques_id_seq OWNED BY public.commentaireanalytiques.id;


--
-- Name: comptedossiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comptedossiers (
    id bigint NOT NULL,
    id_dossier integer DEFAULT 0 NOT NULL,
    user_id bigint DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: comptedossiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comptedossiers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comptedossiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comptedossiers_id_seq OWNED BY public.comptedossiers.id;


--
-- Name: compteportefeuilles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compteportefeuilles (
    id bigint NOT NULL,
    id_portefeuille integer DEFAULT 0 NOT NULL,
    user_id bigint DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: compteportefeuilles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compteportefeuilles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compteportefeuilles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compteportefeuilles_id_seq OWNED BY public.compteportefeuilles.id;


--
-- Name: consolidationdossiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consolidationdossiers (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint NOT NULL,
    id_dossier_autre bigint NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: consolidationdossiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consolidationdossiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consolidationdossiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consolidationdossiers_id_seq OWNED BY public.consolidationdossiers.id;


--
-- Name: devises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devises (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    libelle character varying(255) NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    par_defaut boolean,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: devises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.devises_id_seq OWNED BY public.devises.id;


--
-- Name: dossier_revision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossier_revision (
    id bigint NOT NULL,
    id_code character varying(255) NOT NULL,
    id_dossier bigint NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer NOT NULL,
    id_compte bigint NOT NULL,
    statut public.enum_dossier_revision_statut,
    commentaire text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossier_revision_analytique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossier_revision_analytique (
    id bigint NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    id_exercice bigint DEFAULT 0 NOT NULL,
    id_periode bigint,
    id_jnl bigint DEFAULT 0 NOT NULL,
    valider boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: dossier_revision_analytique_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossier_revision_analytique_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossier_revision_analytique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossier_revision_analytique_id_seq OWNED BY public.dossier_revision_analytique.id;


--
-- Name: dossier_revision_commentaire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossier_revision_commentaire (
    id bigint NOT NULL,
    cycle character varying(50) NOT NULL,
    id_code character varying(255),
    id_dossier bigint NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer NOT NULL,
    id_compte bigint NOT NULL,
    commentaire text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossier_revision_commentaire_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossier_revision_commentaire_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossier_revision_commentaire_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossier_revision_commentaire_id_seq OWNED BY public.dossier_revision_commentaire.id;


--
-- Name: dossier_revision_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossier_revision_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossier_revision_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossier_revision_id_seq OWNED BY public.dossier_revision.id;


--
-- Name: dossier_revision_matrice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossier_revision_matrice (
    cycle character varying(50) NOT NULL,
    code character varying(255) NOT NULL,
    questionnaire character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossier_revision_synthese; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossier_revision_synthese (
    id bigint NOT NULL,
    id_code character varying(255),
    cycle character varying(50) NOT NULL,
    progression numeric(5,2),
    points integer,
    compte_associe text,
    id_dossier bigint NOT NULL,
    id_compte bigint NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossier_revision_synthese_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossier_revision_synthese_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossier_revision_synthese_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossier_revision_synthese_id_seq OWNED BY public.dossier_revision_synthese.id;


--
-- Name: dossierpasswordaccess; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossierpasswordaccess (
    id integer NOT NULL,
    user_id bigint NOT NULL,
    id_dossier bigint NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossierpasswordaccess_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossierpasswordaccess_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossierpasswordaccess_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossierpasswordaccess_id_seq OWNED BY public.dossierpasswordaccess.id;


--
-- Name: dossierplancomptabledetailcptchgs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossierplancomptabledetailcptchgs (
    id integer NOT NULL,
    id_compte bigint DEFAULT 0 NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    id_detail bigint DEFAULT 0 NOT NULL,
    compte character varying(255),
    libelle character varying(255),
    id_comptecompta bigint DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossierplancomptabledetailcptchgs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossierplancomptabledetailcptchgs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossierplancomptabledetailcptchgs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossierplancomptabledetailcptchgs_id_seq OWNED BY public.dossierplancomptabledetailcptchgs.id;


--
-- Name: dossierplancomptabledetailcpttvas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossierplancomptabledetailcpttvas (
    id integer NOT NULL,
    id_compte bigint DEFAULT 0 NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    id_detail bigint DEFAULT 0 NOT NULL,
    compte character varying(255),
    libelle character varying(255),
    id_comptecompta bigint DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossierplancomptabledetailcpttvas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossierplancomptabledetailcpttvas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossierplancomptabledetailcpttvas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossierplancomptabledetailcpttvas_id_seq OWNED BY public.dossierplancomptabledetailcpttvas.id;


--
-- Name: dossierplancomptables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossierplancomptables (
    id integer NOT NULL,
    id_compte bigint DEFAULT 0 NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    compte character varying(50),
    libelle character varying(150),
    nature character varying(20),
    baseaux character varying(20),
    cptcharge integer DEFAULT 0,
    typetier character varying(15),
    cpttva integer DEFAULT 0,
    nif character varying(20),
    statistique character varying(20),
    adresse character varying(200),
    motcle character varying(50),
    cin character varying(15),
    datecin timestamp with time zone,
    autrepieceid character varying(50),
    refpieceid character varying(50),
    adressesansnif character varying(150),
    nifrepresentant character varying(50),
    adresseetranger character varying(150),
    pays character varying(50),
    mvtdebit double precision DEFAULT '0'::double precision NOT NULL,
    mvtcredit double precision DEFAULT '0'::double precision NOT NULL,
    soldedebit double precision DEFAULT '0'::double precision NOT NULL,
    soldecredit double precision DEFAULT '0'::double precision NOT NULL,
    mvtdebittreso double precision DEFAULT '0'::double precision NOT NULL,
    mvtcredittreso double precision DEFAULT '0'::double precision NOT NULL,
    soldedebittreso double precision DEFAULT '0'::double precision NOT NULL,
    soldecredittreso double precision DEFAULT '0'::double precision NOT NULL,
    valeur double precision DEFAULT '0'::double precision NOT NULL,
    valeurtreso double precision DEFAULT '0'::double precision NOT NULL,
    rubriquebilan integer DEFAULT 0 NOT NULL,
    rubriquecrn integer DEFAULT 0 NOT NULL,
    rubriquecrf integer DEFAULT 0 NOT NULL,
    rubriquetftd integer DEFAULT 0 NOT NULL,
    rubriquetfti integer DEFAULT 0 NOT NULL,
    rubriqueevcp integer DEFAULT 0 NOT NULL,
    baseaux_id bigint,
    nom character varying(150),
    province character varying(100),
    region character varying(100),
    district character varying(100),
    commune character varying(100),
    fokontany character varying(100),
    typecomptabilite character varying(20) DEFAULT 'Français'::character varying,
    compteautre character varying(50),
    libelleautre character varying(150),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossierplancomptables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossierplancomptables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossierplancomptables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossierplancomptables_id_seq OWNED BY public.dossierplancomptables.id;


--
-- Name: dossiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossiers (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_portefeuille bigint[],
    id_user bigint DEFAULT 0 NOT NULL,
    dossier character varying(150) NOT NULL,
    responsable character varying(150),
    nbrpart integer DEFAULT 0 NOT NULL,
    avecmotdepasse boolean,
    motdepasse character varying(255),
    seuil_revu_analytique double precision DEFAULT '30'::double precision NOT NULL,
    retard_fourns integer DEFAULT 3 NOT NULL,
    retard_clt integer DEFAULT 3 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: dossiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dossiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossiers_id_seq OWNED BY public.dossiers.id;


--
-- Name: exercices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercices (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    date_debut timestamp with time zone NOT NULL,
    date_fin timestamp with time zone NOT NULL,
    libelle_rang character varying(5),
    rang integer DEFAULT 0,
    cloture boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: exercices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exercices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exercices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exercices_id_seq OWNED BY public.exercices.id;


--
-- Name: journals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journals (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    id_exercice bigint DEFAULT 0 NOT NULL,
    id_ecriture character varying(25),
    datesaisie timestamp with time zone,
    dateecriture timestamp with time zone NOT NULL,
    vraie_date timestamp with time zone,
    id_journal bigint DEFAULT 0 NOT NULL,
    id_numcpt bigint DEFAULT 0,
    id_numcptcentralise bigint DEFAULT 0 NOT NULL,
    piece character varying(50),
    piecedate timestamp with time zone,
    libelle character varying(50),
    debit double precision DEFAULT '0'::double precision NOT NULL,
    credit double precision DEFAULT '0'::double precision NOT NULL,
    devise character varying(10) NOT NULL,
    lettrage character varying(10),
    lettragedate timestamp with time zone,
    saisiepar bigint DEFAULT 0 NOT NULL,
    modifierpar bigint DEFAULT 0 NOT NULL,
    fichier character varying(255) DEFAULT NULL::character varying,
    id_devise bigint DEFAULT 0,
    taux double precision DEFAULT '0'::double precision,
    montant_devise double precision DEFAULT '0'::double precision,
    id_immob integer DEFAULT 0,
    num_facture character varying(50),
    decltvamois integer DEFAULT 0,
    decltvaannee integer DEFAULT 0,
    decltva boolean DEFAULT false,
    declisimois integer DEFAULT 0,
    declisiannee integer DEFAULT 0,
    declisi boolean DEFAULT false,
    rapprocher boolean DEFAULT false,
    date_rapprochement date,
    comptegen character varying(100),
    compteaux character varying(100),
    libelleaux character varying(250),
    libellecompte character varying(250),
    id_revision_controle integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: journals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journals_id_seq OWNED BY public.journals.id;


--
-- Name: localites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.localites (
    id integer NOT NULL,
    province character varying(100) NOT NULL,
    region character varying(100) NOT NULL,
    district character varying(100) NOT NULL,
    commune character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: localites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.localites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: localites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.localites_id_seq OWNED BY public.localites.id;


--
-- Name: paiements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paiements (
    id integer NOT NULL,
    compte_id integer NOT NULL,
    compte character varying(255),
    date_paiement date,
    montant_paye numeric(15,2) DEFAULT 0,
    mode_paiement character varying(255),
    periode_date_debut date,
    periode_date_fin date,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: paiements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paiements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paiements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paiements_id_seq OWNED BY public.paiements.id;


--
-- Name: periodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodes (
    id integer NOT NULL,
    id_exercice bigint NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint DEFAULT 0 NOT NULL,
    libelle character varying(50),
    date_debut timestamp with time zone NOT NULL,
    date_fin timestamp with time zone NOT NULL,
    rang integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: periodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.periodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: periodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.periodes_id_seq OWNED BY public.periodes.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    nom character varying(50) NOT NULL,
    code character varying(25) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: portefeuilles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portefeuilles (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    nom character varying(50),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: portefeuilles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portefeuilles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portefeuilles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portefeuilles_id_seq OWNED BY public.portefeuilles.id;


--
-- Name: recherche_doublons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recherche_doublons (
    id integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer,
    id_jnl integer NOT NULL,
    date date NOT NULL,
    compte character varying(255),
    journal character varying(255),
    piece character varying(255),
    libelle character varying(255),
    debit numeric(15,2) DEFAULT 0,
    credit numeric(15,2) DEFAULT 0,
    id_doublon integer NOT NULL,
    statut public.enum_recherche_doublons_statut DEFAULT 'NON_VALIDE'::public.enum_recherche_doublons_statut,
    date_validation timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: recherche_doublons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recherche_doublons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recherche_doublons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recherche_doublons_id_seq OWNED BY public.recherche_doublons.id;


--
-- Name: resettokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resettokens (
    id bigint NOT NULL,
    user_id bigint DEFAULT 0 NOT NULL,
    token_hash character varying(150) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: resettokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resettokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resettokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resettokens_id_seq OWNED BY public.resettokens.id;


--
-- Name: revision_analytique_resultats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revision_analytique_resultats (
    id integer NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer,
    id_jnl integer NOT NULL,
    date date NOT NULL,
    compte character varying(50) NOT NULL,
    libelle character varying(500),
    debit numeric(15,2) DEFAULT 0,
    credit numeric(15,2) DEFAULT 0,
    total_analytiques numeric(15,2) DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: revision_analytique_resultats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revision_analytique_resultats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revision_analytique_resultats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revision_analytique_resultats_id_seq OWNED BY public.revision_analytique_resultats.id;


--
-- Name: revision_commentaire_anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revision_commentaire_anomalies (
    id integer NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    id_periode integer,
    id_controle character varying(255),
    id_jnl character varying(255),
    id_anomalie integer,
    valide boolean DEFAULT false NOT NULL,
    commentaire text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: revision_commentaire_anomalies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revision_commentaire_anomalies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revision_commentaire_anomalies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revision_commentaire_anomalies_id_seq OWNED BY public.revision_commentaire_anomalies.id;


--
-- Name: revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revisions (
    id integer NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    "Type" character varying(255) NOT NULL,
    "Description" text NOT NULL,
    "NbrAnomalies" integer DEFAULT 0 NOT NULL,
    "Status" boolean DEFAULT false NOT NULL,
    "Commentaire" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: revisions_controles_matrices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revisions_controles_matrices (
    id integer NOT NULL,
    id_controle character varying(255) NOT NULL,
    "Type" character varying(255) NOT NULL,
    compte character varying(255) NOT NULL,
    test text NOT NULL,
    description text NOT NULL,
    anomalies text,
    details text,
    "Valider" boolean DEFAULT false NOT NULL,
    "Commentaire" text,
    "Affichage" character varying(50) DEFAULT 'ligne'::character varying,
    "paramUn" bigint,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: revisions_controles_matrices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revisions_controles_matrices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revisions_controles_matrices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revisions_controles_matrices_id_seq OWNED BY public.revisions_controles_matrices.id;


--
-- Name: revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revisions_id_seq OWNED BY public.revisions.id;


--
-- Name: revu_analytique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revu_analytique (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_exercice bigint NOT NULL,
    id_dossier bigint NOT NULL,
    id_periode bigint,
    compte character varying(50) NOT NULL,
    type_revue public.enum_revu_analytique_type_revue NOT NULL,
    nbr_anomalies integer DEFAULT 0 NOT NULL,
    anomalies_valides integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: revu_analytique_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revu_analytique_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revu_analytique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revu_analytique_id_seq OWNED BY public.revu_analytique.id;


--
-- Name: rolepermissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rolepermissions (
    id integer NOT NULL,
    role_id bigint NOT NULL,
    permission_id bigint NOT NULL,
    allowed boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: rolepermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rolepermissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rolepermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rolepermissions_id_seq OWNED BY public.rolepermissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code integer NOT NULL,
    nom character varying(50) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: table_controle_anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.table_controle_anomalies (
    id integer NOT NULL,
    id_compte integer NOT NULL,
    id_dossier integer NOT NULL,
    id_exercice integer NOT NULL,
    id_jnl character varying(25) NOT NULL,
    "codeCtrl" character varying(255) NOT NULL,
    id_controle character varying(50),
    message text,
    valide boolean DEFAULT false NOT NULL,
    commentaire text,
    id_periode integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    id_num_compte character varying(50)
);


--
-- Name: table_controle_anomalies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.table_controle_anomalies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: table_controle_anomalies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.table_controle_anomalies_id_seq OWNED BY public.table_controle_anomalies.id;


--
-- Name: table_revisions_controles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.table_revisions_controles (
    id integer NOT NULL,
    id_compte bigint NOT NULL,
    id_dossier bigint NOT NULL,
    id_exercice bigint NOT NULL,
    id_revision bigint,
    id_controle character varying(255) NOT NULL,
    "Type" character varying(255) NOT NULL,
    compte character varying(255) NOT NULL,
    test text NOT NULL,
    description text NOT NULL,
    anomalies text,
    details text,
    "Valider" boolean DEFAULT false NOT NULL,
    "Commentaire" text,
    "Affichage" character varying(50) DEFAULT 'ligne'::character varying,
    "paramUn" bigint,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: table_revisions_controles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.table_revisions_controles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: table_revisions_controles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.table_revisions_controles_id_seq OWNED BY public.table_revisions_controles.id;


--
-- Name: userpermissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.userpermissions (
    id integer NOT NULL,
    user_id bigint NOT NULL,
    permission_id bigint NOT NULL,
    allowed boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: userpermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.userpermissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: userpermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.userpermissions_id_seq OWNED BY public.userpermissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    compte_id bigint DEFAULT 0 NOT NULL,
    role_id bigint DEFAULT 0,
    id_portefeuille bigint[],
    username character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    roles json NOT NULL,
    refresh_token character varying(350),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: userscomptes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.userscomptes (
    id bigint NOT NULL,
    nom character varying(150) NOT NULL,
    email character varying(150),
    raison_sociale character varying(100),
    nif character varying(50),
    stat character varying(50),
    numero_telephone character varying(25),
    type_abonnement character varying(25),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: userscomptes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.userscomptes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: userscomptes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.userscomptes_id_seq OWNED BY public.userscomptes.id;


--
-- Name: abonnements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnements ALTER COLUMN id SET DEFAULT nextval('public.abonnements_id_seq'::regclass);


--
-- Name: ajustementappels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustementappels ALTER COLUMN id SET DEFAULT nextval('public.ajustementappels_id_seq'::regclass);


--
-- Name: analyse_client_anomalies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_client_anomalies ALTER COLUMN id SET DEFAULT nextval('public.analyse_client_anomalies_id_seq'::regclass);


--
-- Name: analyse_client_lignes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_client_lignes ALTER COLUMN id SET DEFAULT nextval('public.analyse_client_lignes_id_seq'::regclass);


--
-- Name: analyse_fournisseur_anomalies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_fournisseur_anomalies ALTER COLUMN id SET DEFAULT nextval('public.analyse_fournisseur_anomalies_id_seq'::regclass);


--
-- Name: analyse_fournisseur_lignes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_fournisseur_lignes ALTER COLUMN id SET DEFAULT nextval('public.analyse_fournisseur_lignes_id_seq'::regclass);


--
-- Name: analytiques id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytiques ALTER COLUMN id SET DEFAULT nextval('public.analytiques_id_seq'::regclass);


--
-- Name: appels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appels ALTER COLUMN id SET DEFAULT nextval('public.appels_id_seq'::regclass);


--
-- Name: balanceimportees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balanceimportees ALTER COLUMN id SET DEFAULT nextval('public.balanceimportees_id_seq'::regclass);


--
-- Name: balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances ALTER COLUMN id SET DEFAULT nextval('public.balances_id_seq'::regclass);


--
-- Name: caaxes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caaxes ALTER COLUMN id SET DEFAULT nextval('public.caaxes_id_seq'::regclass);


--
-- Name: casections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casections ALTER COLUMN id SET DEFAULT nextval('public.casections_id_seq'::regclass);


--
-- Name: codejournals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codejournals ALTER COLUMN id SET DEFAULT nextval('public.codejournals_id_seq'::regclass);


--
-- Name: commentaire_analytique_mensuelle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaire_analytique_mensuelle ALTER COLUMN id SET DEFAULT nextval('public.commentaire_analytique_mensuelle_id_seq'::regclass);


--
-- Name: commentaireanalytiques id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaireanalytiques ALTER COLUMN id SET DEFAULT nextval('public.commentaireanalytiques_id_seq'::regclass);


--
-- Name: comptedossiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptedossiers ALTER COLUMN id SET DEFAULT nextval('public.comptedossiers_id_seq'::regclass);


--
-- Name: compteportefeuilles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compteportefeuilles ALTER COLUMN id SET DEFAULT nextval('public.compteportefeuilles_id_seq'::regclass);


--
-- Name: consolidationdossiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consolidationdossiers ALTER COLUMN id SET DEFAULT nextval('public.consolidationdossiers_id_seq'::regclass);


--
-- Name: devises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devises ALTER COLUMN id SET DEFAULT nextval('public.devises_id_seq'::regclass);


--
-- Name: dossier_revision id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision ALTER COLUMN id SET DEFAULT nextval('public.dossier_revision_id_seq'::regclass);


--
-- Name: dossier_revision_analytique id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_analytique ALTER COLUMN id SET DEFAULT nextval('public.dossier_revision_analytique_id_seq'::regclass);


--
-- Name: dossier_revision_commentaire id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_commentaire ALTER COLUMN id SET DEFAULT nextval('public.dossier_revision_commentaire_id_seq'::regclass);


--
-- Name: dossier_revision_synthese id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_synthese ALTER COLUMN id SET DEFAULT nextval('public.dossier_revision_synthese_id_seq'::regclass);


--
-- Name: dossierpasswordaccess id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierpasswordaccess ALTER COLUMN id SET DEFAULT nextval('public.dossierpasswordaccess_id_seq'::regclass);


--
-- Name: dossierplancomptabledetailcptchgs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptabledetailcptchgs ALTER COLUMN id SET DEFAULT nextval('public.dossierplancomptabledetailcptchgs_id_seq'::regclass);


--
-- Name: dossierplancomptabledetailcpttvas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptabledetailcpttvas ALTER COLUMN id SET DEFAULT nextval('public.dossierplancomptabledetailcpttvas_id_seq'::regclass);


--
-- Name: dossierplancomptables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptables ALTER COLUMN id SET DEFAULT nextval('public.dossierplancomptables_id_seq'::regclass);


--
-- Name: dossiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers ALTER COLUMN id SET DEFAULT nextval('public.dossiers_id_seq'::regclass);


--
-- Name: exercices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercices ALTER COLUMN id SET DEFAULT nextval('public.exercices_id_seq'::regclass);


--
-- Name: journals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals ALTER COLUMN id SET DEFAULT nextval('public.journals_id_seq'::regclass);


--
-- Name: localites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localites ALTER COLUMN id SET DEFAULT nextval('public.localites_id_seq'::regclass);


--
-- Name: paiements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements ALTER COLUMN id SET DEFAULT nextval('public.paiements_id_seq'::regclass);


--
-- Name: periodes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes ALTER COLUMN id SET DEFAULT nextval('public.periodes_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: portefeuilles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portefeuilles ALTER COLUMN id SET DEFAULT nextval('public.portefeuilles_id_seq'::regclass);


--
-- Name: recherche_doublons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recherche_doublons ALTER COLUMN id SET DEFAULT nextval('public.recherche_doublons_id_seq'::regclass);


--
-- Name: resettokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resettokens ALTER COLUMN id SET DEFAULT nextval('public.resettokens_id_seq'::regclass);


--
-- Name: revision_analytique_resultats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats ALTER COLUMN id SET DEFAULT nextval('public.revision_analytique_resultats_id_seq'::regclass);


--
-- Name: revision_commentaire_anomalies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_commentaire_anomalies ALTER COLUMN id SET DEFAULT nextval('public.revision_commentaire_anomalies_id_seq'::regclass);


--
-- Name: revisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revisions ALTER COLUMN id SET DEFAULT nextval('public.revisions_id_seq'::regclass);


--
-- Name: revisions_controles_matrices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revisions_controles_matrices ALTER COLUMN id SET DEFAULT nextval('public.revisions_controles_matrices_id_seq'::regclass);


--
-- Name: revu_analytique id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revu_analytique ALTER COLUMN id SET DEFAULT nextval('public.revu_analytique_id_seq'::regclass);


--
-- Name: rolepermissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rolepermissions ALTER COLUMN id SET DEFAULT nextval('public.rolepermissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: table_controle_anomalies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_controle_anomalies ALTER COLUMN id SET DEFAULT nextval('public.table_controle_anomalies_id_seq'::regclass);


--
-- Name: table_revisions_controles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_revisions_controles ALTER COLUMN id SET DEFAULT nextval('public.table_revisions_controles_id_seq'::regclass);


--
-- Name: userpermissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userpermissions ALTER COLUMN id SET DEFAULT nextval('public.userpermissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: userscomptes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userscomptes ALTER COLUMN id SET DEFAULT nextval('public.userscomptes_id_seq'::regclass);


--
-- Name: abonnements abonnements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnements
    ADD CONSTRAINT abonnements_pkey PRIMARY KEY (id);


--
-- Name: ajustementappels ajustementappels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustementappels
    ADD CONSTRAINT ajustementappels_pkey PRIMARY KEY (id);


--
-- Name: analyse_client_anomalies analyse_client_anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_client_anomalies
    ADD CONSTRAINT analyse_client_anomalies_pkey PRIMARY KEY (id);


--
-- Name: analyse_client_lignes analyse_client_lignes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_client_lignes
    ADD CONSTRAINT analyse_client_lignes_pkey PRIMARY KEY (id);


--
-- Name: analyse_fournisseur_anomalies analyse_fournisseur_anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_fournisseur_anomalies
    ADD CONSTRAINT analyse_fournisseur_anomalies_pkey PRIMARY KEY (id);


--
-- Name: analyse_fournisseur_lignes analyse_fournisseur_lignes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_fournisseur_lignes
    ADD CONSTRAINT analyse_fournisseur_lignes_pkey PRIMARY KEY (id);


--
-- Name: analytiques analytiques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytiques
    ADD CONSTRAINT analytiques_pkey PRIMARY KEY (id);


--
-- Name: appels appels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appels
    ADD CONSTRAINT appels_pkey PRIMARY KEY (id);


--
-- Name: balanceimportees balanceimportees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balanceimportees
    ADD CONSTRAINT balanceimportees_pkey PRIMARY KEY (id);


--
-- Name: balances balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_pkey PRIMARY KEY (id);


--
-- Name: caaxes caaxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caaxes
    ADD CONSTRAINT caaxes_pkey PRIMARY KEY (id);


--
-- Name: casections casections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casections
    ADD CONSTRAINT casections_pkey PRIMARY KEY (id);


--
-- Name: codejournals codejournals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codejournals
    ADD CONSTRAINT codejournals_pkey PRIMARY KEY (id);


--
-- Name: commentaire_analytique_mensuelle commentaire_analytique_mensuelle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaire_analytique_mensuelle
    ADD CONSTRAINT commentaire_analytique_mensuelle_pkey PRIMARY KEY (id);


--
-- Name: commentaireanalytiques commentaireanalytiques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaireanalytiques
    ADD CONSTRAINT commentaireanalytiques_pkey PRIMARY KEY (id);


--
-- Name: comptedossiers comptedossiers_id_dossier_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptedossiers
    ADD CONSTRAINT comptedossiers_id_dossier_user_id_key UNIQUE (id_dossier, user_id);


--
-- Name: comptedossiers comptedossiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptedossiers
    ADD CONSTRAINT comptedossiers_pkey PRIMARY KEY (id);


--
-- Name: compteportefeuilles compteportefeuilles_id_portefeuille_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compteportefeuilles
    ADD CONSTRAINT compteportefeuilles_id_portefeuille_user_id_key UNIQUE (id_portefeuille, user_id);


--
-- Name: compteportefeuilles compteportefeuilles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compteportefeuilles
    ADD CONSTRAINT compteportefeuilles_pkey PRIMARY KEY (id);


--
-- Name: consolidationdossiers consolidationdossiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consolidationdossiers
    ADD CONSTRAINT consolidationdossiers_pkey PRIMARY KEY (id);


--
-- Name: devises devises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devises
    ADD CONSTRAINT devises_pkey PRIMARY KEY (id);


--
-- Name: dossier_revision_analytique dossier_revision_analytique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_analytique
    ADD CONSTRAINT dossier_revision_analytique_pkey PRIMARY KEY (id);


--
-- Name: dossier_revision_commentaire dossier_revision_commentaire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_commentaire
    ADD CONSTRAINT dossier_revision_commentaire_pkey PRIMARY KEY (id);


--
-- Name: dossier_revision_matrice dossier_revision_matrice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_matrice
    ADD CONSTRAINT dossier_revision_matrice_pkey PRIMARY KEY (cycle, code, questionnaire, type);


--
-- Name: dossier_revision dossier_revision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision
    ADD CONSTRAINT dossier_revision_pkey PRIMARY KEY (id);


--
-- Name: dossier_revision_synthese dossier_revision_synthese_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossier_revision_synthese
    ADD CONSTRAINT dossier_revision_synthese_pkey PRIMARY KEY (id);


--
-- Name: dossierpasswordaccess dossierpasswordaccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierpasswordaccess
    ADD CONSTRAINT dossierpasswordaccess_pkey PRIMARY KEY (id);


--
-- Name: dossierpasswordaccess dossierpasswordaccess_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierpasswordaccess
    ADD CONSTRAINT dossierpasswordaccess_user_id_key UNIQUE (user_id);


--
-- Name: dossierplancomptabledetailcptchgs dossierplancomptabledetailcptchgs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptabledetailcptchgs
    ADD CONSTRAINT dossierplancomptabledetailcptchgs_pkey PRIMARY KEY (id);


--
-- Name: dossierplancomptabledetailcpttvas dossierplancomptabledetailcpttvas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptabledetailcpttvas
    ADD CONSTRAINT dossierplancomptabledetailcpttvas_pkey PRIMARY KEY (id);


--
-- Name: dossierplancomptables dossierplancomptables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptables
    ADD CONSTRAINT dossierplancomptables_pkey PRIMARY KEY (id);


--
-- Name: dossiers dossiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers
    ADD CONSTRAINT dossiers_pkey PRIMARY KEY (id);


--
-- Name: exercices exercices_date_fin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercices
    ADD CONSTRAINT exercices_date_fin_key UNIQUE (date_fin);


--
-- Name: exercices exercices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercices
    ADD CONSTRAINT exercices_pkey PRIMARY KEY (id);


--
-- Name: journals journals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_pkey PRIMARY KEY (id);


--
-- Name: localites localites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localites
    ADD CONSTRAINT localites_pkey PRIMARY KEY (id);


--
-- Name: paiements paiements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_pkey PRIMARY KEY (id);


--
-- Name: periodes periodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes
    ADD CONSTRAINT periodes_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_nom_key UNIQUE (nom);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: portefeuilles portefeuilles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portefeuilles
    ADD CONSTRAINT portefeuilles_pkey PRIMARY KEY (id);


--
-- Name: recherche_doublons recherche_doublons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recherche_doublons
    ADD CONSTRAINT recherche_doublons_pkey PRIMARY KEY (id);


--
-- Name: resettokens resettokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resettokens
    ADD CONSTRAINT resettokens_pkey PRIMARY KEY (id);


--
-- Name: revision_analytique_resultats revision_analytique_resultats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats
    ADD CONSTRAINT revision_analytique_resultats_pkey PRIMARY KEY (id);


--
-- Name: revision_commentaire_anomalies revision_commentaire_anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_commentaire_anomalies
    ADD CONSTRAINT revision_commentaire_anomalies_pkey PRIMARY KEY (id);


--
-- Name: revisions_controles_matrices revisions_controles_matrices_id_controle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revisions_controles_matrices
    ADD CONSTRAINT revisions_controles_matrices_id_controle_key UNIQUE (id_controle);


--
-- Name: revisions_controles_matrices revisions_controles_matrices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revisions_controles_matrices
    ADD CONSTRAINT revisions_controles_matrices_pkey PRIMARY KEY (id);


--
-- Name: revisions revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_pkey PRIMARY KEY (id);


--
-- Name: revu_analytique revu_analytique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revu_analytique
    ADD CONSTRAINT revu_analytique_pkey PRIMARY KEY (id);


--
-- Name: rolepermissions rolepermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nom_key UNIQUE (nom);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: table_controle_anomalies table_controle_anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_controle_anomalies
    ADD CONSTRAINT table_controle_anomalies_pkey PRIMARY KEY (id);


--
-- Name: table_revisions_controles table_revisions_controles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_revisions_controles
    ADD CONSTRAINT table_revisions_controles_pkey PRIMARY KEY (id);


--
-- Name: userpermissions userpermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userpermissions
    ADD CONSTRAINT userpermissions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: userscomptes userscomptes_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userscomptes
    ADD CONSTRAINT userscomptes_email_key UNIQUE (email);


--
-- Name: userscomptes userscomptes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userscomptes
    ADD CONSTRAINT userscomptes_pkey PRIMARY KEY (id);


--
-- Name: analytiques_id_axe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytiques_id_axe ON public.analytiques USING btree (id_axe);


--
-- Name: analytiques_id_compte_id_dossier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytiques_id_compte_id_dossier ON public.analytiques USING btree (id_compte, id_dossier);


--
-- Name: analytiques_id_ligne_ecriture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytiques_id_ligne_ecriture ON public.analytiques USING btree (id_ligne_ecriture);


--
-- Name: analytiques_id_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytiques_id_section ON public.analytiques USING btree (id_section);


--
-- Name: casections_id_axe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX casections_id_axe ON public.casections USING btree (id_axe);


--
-- Name: casections_id_compte_id_dossier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX casections_id_compte_id_dossier ON public.casections USING btree (id_compte, id_dossier);


--
-- Name: codejournals_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codejournals_code ON public.codejournals USING btree (code);


--
-- Name: codejournals_id_compte_id_dossier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codejournals_id_compte_id_dossier ON public.codejournals USING btree (id_compte, id_dossier);


--
-- Name: codejournals_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codejournals_type ON public.codejournals USING btree (type);


--
-- Name: dossierplancomptables_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dossierplancomptables_compte ON public.dossierplancomptables USING btree (compte);


--
-- Name: dossierplancomptables_id_compte_id_dossier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dossierplancomptables_id_compte_id_dossier ON public.dossierplancomptables USING btree (id_compte, id_dossier);


--
-- Name: journals_dateecriture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journals_dateecriture ON public.journals USING btree (dateecriture);


--
-- Name: journals_id_compte_id_dossier_id_exercice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journals_id_compte_id_dossier_id_exercice ON public.journals USING btree (id_compte, id_dossier, id_exercice);


--
-- Name: journals_id_ecriture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journals_id_ecriture ON public.journals USING btree (id_ecriture);


--
-- Name: journals_id_journal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journals_id_journal ON public.journals USING btree (id_journal);


--
-- Name: journals_id_numcpt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journals_id_numcpt ON public.journals USING btree (id_numcpt);


--
-- Name: journals_id_numcptcentralise; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journals_id_numcptcentralise ON public.journals USING btree (id_numcptcentralise);


--
-- Name: revisions_controles_matrices__type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX revisions_controles_matrices__type ON public.revisions_controles_matrices USING btree ("Type");


--
-- Name: revisions_controles_matrices_id_controle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX revisions_controles_matrices_id_controle ON public.revisions_controles_matrices USING btree (id_controle);


--
-- Name: table_revisions_controles__type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_revisions_controles__type ON public.table_revisions_controles USING btree ("Type");


--
-- Name: table_revisions_controles_id_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_revisions_controles_id_compte ON public.table_revisions_controles USING btree (id_compte);


--
-- Name: table_revisions_controles_id_controle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_revisions_controles_id_controle ON public.table_revisions_controles USING btree (id_controle);


--
-- Name: table_revisions_controles_id_dossier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_revisions_controles_id_dossier ON public.table_revisions_controles USING btree (id_dossier);


--
-- Name: table_revisions_controles_id_exercice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_revisions_controles_id_exercice ON public.table_revisions_controles USING btree (id_exercice);


--
-- Name: abonnements abonnements_compte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnements
    ADD CONSTRAINT abonnements_compte_id_fkey FOREIGN KEY (compte_id) REFERENCES public.userscomptes(id);


--
-- Name: analyse_client_anomalies analyse_client_anomalies_id_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_client_anomalies
    ADD CONSTRAINT analyse_client_anomalies_id_ligne_fkey FOREIGN KEY (id_ligne) REFERENCES public.journals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analyse_client_lignes analyse_client_lignes_id_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_client_lignes
    ADD CONSTRAINT analyse_client_lignes_id_ligne_fkey FOREIGN KEY (id_ligne) REFERENCES public.journals(id);


--
-- Name: analyse_fournisseur_anomalies analyse_fournisseur_anomalies_id_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_fournisseur_anomalies
    ADD CONSTRAINT analyse_fournisseur_anomalies_id_ligne_fkey FOREIGN KEY (id_ligne) REFERENCES public.journals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analyse_fournisseur_lignes analyse_fournisseur_lignes_id_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyse_fournisseur_lignes
    ADD CONSTRAINT analyse_fournisseur_lignes_id_ligne_fkey FOREIGN KEY (id_ligne) REFERENCES public.journals(id);


--
-- Name: analytiques analytiques_id_axe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytiques
    ADD CONSTRAINT analytiques_id_axe_fkey FOREIGN KEY (id_axe) REFERENCES public.caaxes(id) ON UPDATE CASCADE;


--
-- Name: analytiques analytiques_id_ligne_ecriture_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytiques
    ADD CONSTRAINT analytiques_id_ligne_ecriture_fkey FOREIGN KEY (id_ligne_ecriture) REFERENCES public.journals(id) ON UPDATE CASCADE;


--
-- Name: analytiques analytiques_id_section_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytiques
    ADD CONSTRAINT analytiques_id_section_fkey FOREIGN KEY (id_section) REFERENCES public.casections(id) ON UPDATE CASCADE;


--
-- Name: appels appels_exercice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appels
    ADD CONSTRAINT appels_exercice_id_fkey FOREIGN KEY (exercice_id) REFERENCES public.exercices(id) ON UPDATE CASCADE;


--
-- Name: balances balances_id_numcompte_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_id_numcompte_fkey FOREIGN KEY (id_numcompte) REFERENCES public.dossierplancomptables(id) ON UPDATE CASCADE;


--
-- Name: balances balances_id_numcomptecentr_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_id_numcomptecentr_fkey FOREIGN KEY (id_numcomptecentr) REFERENCES public.dossierplancomptables(id) ON UPDATE CASCADE;


--
-- Name: caaxes caaxes_id_compte_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caaxes
    ADD CONSTRAINT caaxes_id_compte_fkey FOREIGN KEY (id_compte) REFERENCES public.userscomptes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: caaxes caaxes_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caaxes
    ADD CONSTRAINT caaxes_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: casections casections_id_axe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casections
    ADD CONSTRAINT casections_id_axe_fkey FOREIGN KEY (id_axe) REFERENCES public.caaxes(id) ON UPDATE CASCADE;


--
-- Name: comptedossiers comptedossiers_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptedossiers
    ADD CONSTRAINT comptedossiers_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comptedossiers comptedossiers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptedossiers
    ADD CONSTRAINT comptedossiers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: compteportefeuilles compteportefeuilles_id_portefeuille_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compteportefeuilles
    ADD CONSTRAINT compteportefeuilles_id_portefeuille_fkey FOREIGN KEY (id_portefeuille) REFERENCES public.portefeuilles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: compteportefeuilles compteportefeuilles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compteportefeuilles
    ADD CONSTRAINT compteportefeuilles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consolidationdossiers consolidationdossiers_id_compte_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consolidationdossiers
    ADD CONSTRAINT consolidationdossiers_id_compte_fkey FOREIGN KEY (id_compte) REFERENCES public.userscomptes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consolidationdossiers consolidationdossiers_id_dossier_autre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consolidationdossiers
    ADD CONSTRAINT consolidationdossiers_id_dossier_autre_fkey FOREIGN KEY (id_dossier_autre) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consolidationdossiers consolidationdossiers_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consolidationdossiers
    ADD CONSTRAINT consolidationdossiers_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devises devises_id_compte_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devises
    ADD CONSTRAINT devises_id_compte_fkey FOREIGN KEY (id_compte) REFERENCES public.userscomptes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devises devises_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devises
    ADD CONSTRAINT devises_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dossierpasswordaccess dossierpasswordaccess_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierpasswordaccess
    ADD CONSTRAINT dossierpasswordaccess_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dossierpasswordaccess dossierpasswordaccess_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierpasswordaccess
    ADD CONSTRAINT dossierpasswordaccess_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dossierplancomptables dossierplancomptables_baseaux_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptables
    ADD CONSTRAINT dossierplancomptables_baseaux_id_fkey FOREIGN KEY (baseaux_id) REFERENCES public.dossierplancomptables(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dossierplancomptables dossierplancomptables_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossierplancomptables
    ADD CONSTRAINT dossierplancomptables_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE;


--
-- Name: journals journals_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journals journals_id_journal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_id_journal_fkey FOREIGN KEY (id_journal) REFERENCES public.codejournals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journals journals_id_numcpt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_id_numcpt_fkey FOREIGN KEY (id_numcpt) REFERENCES public.dossierplancomptables(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: journals journals_id_numcptcentralise_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_id_numcptcentralise_fkey FOREIGN KEY (id_numcptcentralise) REFERENCES public.dossierplancomptables(id) ON UPDATE CASCADE;


--
-- Name: portefeuilles portefeuilles_id_compte_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portefeuilles
    ADD CONSTRAINT portefeuilles_id_compte_fkey FOREIGN KEY (id_compte) REFERENCES public.userscomptes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recherche_doublons recherche_doublons_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recherche_doublons
    ADD CONSTRAINT recherche_doublons_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id);


--
-- Name: recherche_doublons recherche_doublons_id_exercice_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recherche_doublons
    ADD CONSTRAINT recherche_doublons_id_exercice_fkey FOREIGN KEY (id_exercice) REFERENCES public.exercices(id);


--
-- Name: recherche_doublons recherche_doublons_id_jnl_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recherche_doublons
    ADD CONSTRAINT recherche_doublons_id_jnl_fkey FOREIGN KEY (id_jnl) REFERENCES public.journals(id);


--
-- Name: recherche_doublons recherche_doublons_id_periode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recherche_doublons
    ADD CONSTRAINT recherche_doublons_id_periode_fkey FOREIGN KEY (id_periode) REFERENCES public.periodes(id);


--
-- Name: resettokens resettokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resettokens
    ADD CONSTRAINT resettokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: revision_analytique_resultats revision_analytique_resultats_id_compte_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats
    ADD CONSTRAINT revision_analytique_resultats_id_compte_fkey FOREIGN KEY (id_compte) REFERENCES public.userscomptes(id) ON UPDATE CASCADE;


--
-- Name: revision_analytique_resultats revision_analytique_resultats_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats
    ADD CONSTRAINT revision_analytique_resultats_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossiers(id) ON UPDATE CASCADE;


--
-- Name: revision_analytique_resultats revision_analytique_resultats_id_exercice_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats
    ADD CONSTRAINT revision_analytique_resultats_id_exercice_fkey FOREIGN KEY (id_exercice) REFERENCES public.exercices(id) ON UPDATE CASCADE;


--
-- Name: revision_analytique_resultats revision_analytique_resultats_id_jnl_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats
    ADD CONSTRAINT revision_analytique_resultats_id_jnl_fkey FOREIGN KEY (id_jnl) REFERENCES public.journals(id) ON UPDATE CASCADE;


--
-- Name: revision_analytique_resultats revision_analytique_resultats_id_periode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_analytique_resultats
    ADD CONSTRAINT revision_analytique_resultats_id_periode_fkey FOREIGN KEY (id_periode) REFERENCES public.periodes(id);


--
-- Name: rolepermissions rolepermissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rolepermissions rolepermissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: table_revisions_controles table_revisions_controles_id_revision_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_revisions_controles
    ADD CONSTRAINT table_revisions_controles_id_revision_fkey FOREIGN KEY (id_revision) REFERENCES public.revisions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: userpermissions userpermissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userpermissions
    ADD CONSTRAINT userpermissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: userpermissions userpermissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userpermissions
    ADD CONSTRAINT userpermissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_compte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_compte_id_fkey FOREIGN KEY (compte_id) REFERENCES public.userscomptes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

