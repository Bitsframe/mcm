

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."after_order_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if the promo_code_id is not NULL
    IF NEW.promo_code_id IS NOT NULL THEN
        -- Insert a new record into the promousage table
        INSERT INTO promousage (created_at, patientid, promocodeid)
        VALUES (NOW(), NEW.patient_id, NEW.promo_code_id);
    END IF;
    
    -- Return the new row (required for the trigger function)
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."after_order_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_associated_products"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update all products associated with the category being updated
    UPDATE products
    SET archived = TRUE
    WHERE category_id = NEW.category_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."archive_associated_products"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."concat_name"("firstname" "text", "lastname" "text") RETURNS "text"
    LANGUAGE "sql"
    AS $$
  select firstname || ' ' || lastname;
$$;


ALTER FUNCTION "public"."concat_name"("firstname" "text", "lastname" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_fetch_profiles_with_auth_users_and_ban_status"() RETURNS TABLE("profile_id" "uuid", "full_name" "text", "active" boolean, "role_name" "text", "locations" "json", "email" "text", "created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "is_banned" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        profiles.id,
        profiles.full_name,
        profiles.active,
        roles.name,
        json_agg(json_build_object('location_id', ul.location_id, 'location_title', l.title)) AS locations,
        auth.users.email,
        auth.users.created_at,
        auth.users.last_sign_in_at,
        auth.users.is_banned
    FROM profiles
    LEFT JOIN roles ON profiles.role_id = roles.id
    LEFT JOIN user_locations ul ON profiles.id = ul.profile_id
    LEFT JOIN Locations l ON ul.location_id = l.id
    LEFT JOIN auth.users ON profiles.id = auth.users.id
    GROUP BY profiles.id, roles.name, auth.users.email, auth.users.created_at, auth.users.last_sign_in_at, auth.users.is_banned;
END;
$$;


ALTER FUNCTION "public"."custom_fetch_profiles_with_auth_users_and_ban_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_updated_promotypes"() RETURNS TABLE("id" bigint, "created_at" timestamp without time zone, "typename" "text", "percentage" bigint, "active" boolean, "multiple" boolean, "expiry" "date")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update active status
  UPDATE promotype
  SET active = CASE 
      WHEN expiry < CURRENT_DATE THEN FALSE 
      ELSE TRUE 
  END;

  -- Return the updated rows
  RETURN QUERY SELECT * FROM promotype;
END;
$$;


ALTER FUNCTION "public"."get_updated_promotypes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_return_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the sales_history table by adding the return quantity
  UPDATE sales_history
  SET return_qty = return_qty + NEW.quantity
  WHERE sales_history_id = NEW.sales_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_return_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_allpatients"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Assuming the columns in appointments and allpatients have similar names
  INSERT INTO allpatients (column1, column2, column3) 
  VALUES (NEW.column1, NEW.column2, NEW.column3);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_allpatients"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_inventory_for_new_product"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert an inventory row for each location
    INSERT INTO inventory (product_id, location_id, quantity, price, last_updated, archived)
    SELECT NEW.product_id, "id", 0, 0, NOW(), FALSE FROM "Locations";

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_inventory_for_new_product"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_or_update_allpatients"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    existing_patient RECORD;
BEGIN
    -- Check if a patient with the same email or phone number already exists
    SELECT * INTO existing_patient
    FROM allpatients
    WHERE email = NEW.email_address OR phone = NEW.phone
    LIMIT 1;

    IF existing_patient IS NOT NULL THEN
        -- Update the lastvisit and other relevant fields if a match is found
        UPDATE allpatients
        SET 
            lastvisit = now()
        WHERE id = existing_patient.id;
    ELSE
        -- Insert a new row into allpatients if no match is found
        INSERT INTO allpatients (
            created_at, 
            firstname, 
            lastname, 
            email, 
            phone, 
            Treatmenttype, 
            Gender, 
            lastvisit, 
            locationid,
            onsite,
            email_opt,
            text_opt
        ) VALUES (
            now(),
            NEW.first_name,
            NEW.last_name,
            NEW.email_address,
            NEW.phone,
            NEW.service,
            NEW.sex,
            now(),
            NEW.location_id,
            NEW.in_office_patient,
            NEW.email_opt,
            NEW.text_opt 

        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_or_update_allpatients"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_or_update_allpatients_from_pos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    existing_patient RECORD;
    new_patient_id INT;
BEGIN
    -- Check if a patient with the same email or phone number already exists
    SELECT * INTO existing_patient
    FROM allpatients
    WHERE email = NEW.email OR phone = NEW.phone
    LIMIT 1;

    IF existing_patient IS NOT NULL THEN
        -- Update last visit for existing patient
        UPDATE allpatients
        SET lastvisit = now()
        WHERE id = existing_patient.id;

        -- Assign the existing patient ID
        new_patient_id := existing_patient.id;
    ELSE
        -- Insert a new patient and capture the new patient ID
        INSERT INTO allpatients (
            created_at, firstname, lastname, email, phone, treatmenttype, gender, lastvisit, locationid, onsite, email_opt, text_opt
        ) VALUES (
            now(), NEW.firstname, NEW.lastname, NEW.email, NEW.phone, NEW.treatmenttype, NEW.gender, now(), NEW.locationid, true, NEW.email_opt, NEW.text_opt
        ) 
        RETURNING id INTO new_patient_id;
    END IF;

    -- Update the pos table with the patientId
    UPDATE pos 
    SET patientId = new_patient_id 
    WHERE id = NEW.id;

    -- Return the new row
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_or_update_allpatients_from_pos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_date_and_time_null_if_empty"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if date_and_time is empty (or just spaces)
  IF TRIM(NEW.date_and_time) = '' THEN
    NEW.date_and_time := NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_date_and_time_null_if_empty"() OWNER TO "postgres";


CREATE PROCEDURE "public"."update_active_promotype_status"()
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE promotypes
    SET active = CASE
        WHEN Expiry < CURRENT_DATE THEN FALSE
        ELSE TRUE
    END;
END;
$$;


ALTER PROCEDURE "public"."update_active_promotype_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_active_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.Expiry < CURRENT_DATE THEN
        NEW.active := FALSE;
    ELSE
        NEW.active := TRUE;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_active_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_associated_products"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the `archived` status of products based on the category's `archived` status
    UPDATE products
    SET archived = NEW.archived
    WHERE category_id = NEW.category_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_associated_products"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_on_sale"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if the inventory exists and update the quantity
    UPDATE inventory
    SET quantity = GREATEST(quantity - NEW.quantity_sold, 0) -- Ensures it doesn't go negative
    WHERE inventory_id = NEW.inventory_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inventory_on_sale"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_quantity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the inventory table by adding the quantity from the returns table
    UPDATE inventory
    SET quantity = quantity + NEW.quantity
    WHERE inventory_id = NEW.inventory_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inventory_quantity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_promotypes_status"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE promotype
  SET active = CASE 
      WHEN expiry < CURRENT_DATE THEN FALSE 
      ELSE TRUE 
  END;
END;
$$;


ALTER FUNCTION "public"."update_promotypes_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quantity_available"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE products
    SET quantity_available = quantity_available - NEW.quantity_sold
    WHERE product_id = NEW.product_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_quantity_available"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."About_Short" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text" DEFAULT '''''::text'::"text" NOT NULL
);


ALTER TABLE "public"."About_Short" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."About_Short_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text" DEFAULT '''''::text'::"text" NOT NULL
);


ALTER TABLE "public"."About_Short_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."About_Short_es" IS 'This is a duplicate of About_short';



CREATE TABLE IF NOT EXISTS "public"."about" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text_1" "text" DEFAULT ''::"text" NOT NULL,
    "title_1" "text",
    "image_1" "text",
    "title_2" "text",
    "text_2" "text",
    "image_2" "text",
    "title_3" "text",
    "text_3" "text",
    "image_3" "text",
    "title_4" "text",
    "text_4" "text",
    "image_4" "text",
    "title_5" "text",
    "text_5" "text",
    "image_5" "text"
);


ALTER TABLE "public"."about" OWNER TO "postgres";


ALTER TABLE "public"."about" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."About_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."About_Short" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."About_short_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."About_Short_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Aboutshort_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Appoinments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" bigint NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email_address" "text" NOT NULL,
    "dob" "date",
    "sex" "text" NOT NULL,
    "service" "text" NOT NULL,
    "in_office_patient" boolean NOT NULL,
    "new_patient" boolean NOT NULL,
    "address" "text",
    "phone" "text",
    "date_and_time" "text" DEFAULT 'NULL'::"text",
    "text_opt" boolean DEFAULT false NOT NULL,
    "email_opt" boolean DEFAULT false NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."Appoinments" OWNER TO "postgres";


ALTER TABLE "public"."Appoinments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Appoinments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Blog" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "image" "text" DEFAULT ''::"text",
    "content" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."Blog" OWNER TO "postgres";


ALTER TABLE "public"."Blog" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Blog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."FAQs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question" "text" DEFAULT ''::"text" NOT NULL,
    "answer" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."FAQs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FAQs_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question" "text" DEFAULT ''::"text" NOT NULL,
    "answer" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."FAQs_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."FAQs_es" IS 'This is a spanish of FAQs';



ALTER TABLE "public"."FAQs_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."FAQs_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."FAQs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."FAQs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Hero_Section" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."Hero_Section" OWNER TO "postgres";


ALTER TABLE "public"."Hero_Section" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Hero Section_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Hero_Section_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."Hero_Section_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."Hero_Section_es" IS 'spanish Hero_Section';



ALTER TABLE "public"."Hero_Section_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Hero_Section_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Images" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" bigint NOT NULL,
    "image" "text" NOT NULL
);


ALTER TABLE "public"."Images" OWNER TO "postgres";


ALTER TABLE "public"."Images" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Locations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "direction" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "mon_timing" "text" DEFAULT ''::"text" NOT NULL,
    "tuesday_timing" "text" DEFAULT ''::"text" NOT NULL,
    "wednesday_timing" "text" DEFAULT ''::"text" NOT NULL,
    "thursday_timing" "text" DEFAULT ''::"text" NOT NULL,
    "friday_timing" "text" DEFAULT ''::"text" NOT NULL,
    "saturday_timing" "text" DEFAULT ''::"text" NOT NULL,
    "sunday_timing" "text" DEFAULT ''::"text" NOT NULL,
    "title" "text" NOT NULL,
    "Group" "text",
    "email_address" "text",
    "report_time" time without time zone
);


ALTER TABLE "public"."Locations" OWNER TO "postgres";


ALTER TABLE "public"."Locations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Mission" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "Icon" "text",
    "Title" "text",
    "Text" "text"
);


ALTER TABLE "public"."Mission" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Mission_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "Icon" "text",
    "Title" "text",
    "Text" "text"
);


ALTER TABLE "public"."Mission_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."Mission_es" IS 'This is a duplicate of Mission';



ALTER TABLE "public"."Mission_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Mission_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."Mission" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Mission_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Newsletter" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text"
);


ALTER TABLE "public"."Newsletter" OWNER TO "postgres";


ALTER TABLE "public"."Newsletter" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Newsletter_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Qr" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locationid" bigint,
    "qrcode" "text",
    "locationtitle" "text" NOT NULL
);


ALTER TABLE "public"."Qr" OWNER TO "postgres";


ALTER TABLE "public"."Qr" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Qr_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "image" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text"
);


ALTER TABLE "public"."services" OWNER TO "postgres";


ALTER TABLE "public"."services" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Specials" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image" "text" NOT NULL,
    "title" "text"
);


ALTER TABLE "public"."Specials" OWNER TO "postgres";


ALTER TABLE "public"."Specials" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Specials_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Testinomial" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "rating" "text" DEFAULT ''::"text" NOT NULL,
    "review" "text" DEFAULT ''::"text" NOT NULL,
    "location_id" bigint NOT NULL
);


ALTER TABLE "public"."Testinomial" OWNER TO "postgres";


ALTER TABLE "public"."Testinomial" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Testinomial_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Tickers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text"
);


ALTER TABLE "public"."Tickers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Tickers_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text"
);


ALTER TABLE "public"."Tickers_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."Tickers_es" IS 'This is a duplicate of Tickers';



ALTER TABLE "public"."Tickers_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Tickers_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."Tickers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Tickers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."about_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text_1" "text" DEFAULT ''::"text" NOT NULL,
    "title_1" "text",
    "image_1" "text",
    "title_2" "text",
    "text_2" "text",
    "image_2" "text",
    "title_3" "text",
    "text_3" "text",
    "image_3" "text",
    "title_4" "text",
    "text_4" "text",
    "image_4" "text",
    "title_5" "text",
    "text_5" "text",
    "image_5" "text"
);


ALTER TABLE "public"."about_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."about_es" IS 'This is a duplicate of about';



ALTER TABLE "public"."about_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."about_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."allpatients" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "firstname" "text",
    "lastname" "text",
    "email" "text",
    "phone" "text",
    "treatmenttype" "text",
    "gender" "text",
    "lastvisit" "date",
    "locationid" bigint,
    "onsite" boolean NOT NULL,
    "text_opt" boolean DEFAULT false,
    "email_opt" boolean DEFAULT false,
    "note" "text"
);


ALTER TABLE "public"."allpatients" OWNER TO "postgres";


ALTER TABLE "public"."allpatients" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."allpatients_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."career" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "Text" "text" NOT NULL
);


ALTER TABLE "public"."career" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "Text" "text" NOT NULL
);


ALTER TABLE "public"."career_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."career_es" IS 'This is a duplicate of career';



ALTER TABLE "public"."career_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."career_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."career" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."career_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "category_id" bigint NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "category_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."categories_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "feedback_id" bigint NOT NULL,
    "order_id" integer,
    "feedback_text" "text",
    "rating" integer,
    "patient_id" bigint,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text")
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


ALTER TABLE "public"."feedback" ALTER COLUMN "feedback_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."feedback_feedback_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inpatients" (
    "patient_id" bigint NOT NULL,
    "name" character varying(100) NOT NULL,
    "email" character varying(100),
    "phone" character varying(15)
);


ALTER TABLE "public"."inpatients" OWNER TO "postgres";


ALTER TABLE "public"."inpatients" ALTER COLUMN "patient_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."inpatients_patient_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "inventory_id" bigint NOT NULL,
    "product_id" integer,
    "quantity" integer NOT NULL,
    "last_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "location_id" bigint,
    "price" bigint,
    "archived" boolean DEFAULT false
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


ALTER TABLE "public"."inventory" ALTER COLUMN "inventory_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."inventory_inventory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."loginid" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userid" "text" NOT NULL,
    "password" "text" NOT NULL
);


ALTER TABLE "public"."loginid" OWNER TO "postgres";


ALTER TABLE "public"."loginid" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."loginid_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."offsite_patients" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."offsite_patients" OWNER TO "postgres";


ALTER TABLE "public"."offsite_patients" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."offsite_patients_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "order_id" bigint NOT NULL,
    "patient_id" bigint,
    "order_date" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "promo_code_id" integer
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


ALTER TABLE "public"."orders" ALTER COLUMN "order_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."orders_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "permission" "text"
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


ALTER TABLE "public"."permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "firstname" "text",
    "lastname" "text",
    "email" "text",
    "phone" "text",
    "treatmenttype" "text",
    "gender" "text",
    "locationid" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email_opt" boolean DEFAULT false NOT NULL,
    "text_opt" boolean DEFAULT false NOT NULL,
    "patientid" integer
);


ALTER TABLE "public"."pos" OWNER TO "postgres";


ALTER TABLE "public"."pos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_id" bigint NOT NULL,
    "category_id" integer NOT NULL,
    "product_name" character varying(100) NOT NULL,
    "archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


ALTER TABLE "public"."products" ALTER COLUMN "product_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."products_product_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role_id" integer,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "active" boolean DEFAULT false NOT NULL,
    "email" "text",
    "profile_pictures" "text" DEFAULT 'https://vsvueqtgulraaczqnnvh.supabase.co/storage/v1/object/public/profile-pictures//Default-p.png'::"text" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promocodes" (
    "id" bigint NOT NULL,
    "code" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" bigint,
    "assign" bigint
);


ALTER TABLE "public"."promocodes" OWNER TO "postgres";


ALTER TABLE "public"."promocodes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."promocodes_promo_code_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."promotype" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "typename" "text",
    "percentage" bigint,
    "active" boolean DEFAULT true,
    "multiple" boolean DEFAULT false,
    "expiry" "date"
);


ALTER TABLE "public"."promotype" OWNER TO "postgres";


ALTER TABLE "public"."promotype" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."promotype_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."promousage" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "patientid" bigint,
    "promocodeid" bigint
);


ALTER TABLE "public"."promousage" OWNER TO "postgres";


ALTER TABLE "public"."promousage" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."promousage_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."returnreasons" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text"
);


ALTER TABLE "public"."returnreasons" OWNER TO "postgres";


ALTER TABLE "public"."returnreasons" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."returnreasons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."returns" (
    "return_id" bigint NOT NULL,
    "inventory_id" integer,
    "return_date" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "quantity" integer NOT NULL,
    "reason" character varying(255),
    "sales_id" bigint,
    "merge" boolean DEFAULT false
);


ALTER TABLE "public"."returns" OWNER TO "postgres";


ALTER TABLE "public"."returns" ALTER COLUMN "return_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."returns_return_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";



CREATE TABLE IF NOT EXISTS "public"."sales_history" (
    "sales_history_id" bigint NOT NULL,
    "order_id" bigint,
    "inventory_id" bigint,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "date_sold" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "quantity_sold" integer NOT NULL,
    "total_price" numeric NOT NULL,
    "paymentcash" boolean,
    "return_qty" bigint DEFAULT '0'::bigint
);


ALTER TABLE "public"."sales_history" OWNER TO "postgres";


ALTER TABLE "public"."sales_history" ALTER COLUMN "sales_history_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sales_history_sales_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."services_es" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "image" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text"
);


ALTER TABLE "public"."services_es" OWNER TO "postgres";


COMMENT ON TABLE "public"."services_es" IS 'This is a duplicate of services';



ALTER TABLE "public"."services_es" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."services_es_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_locations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "location_id" bigint
);


ALTER TABLE "public"."user_locations" OWNER TO "postgres";


ALTER TABLE "public"."user_locations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "roles" integer NOT NULL,
    "permissions" bigint NOT NULL
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


ALTER TABLE "public"."user_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."about"
    ADD CONSTRAINT "About_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."About_Short"
    ADD CONSTRAINT "About_short_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."About_Short_es"
    ADD CONSTRAINT "Aboutshort_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Appoinments"
    ADD CONSTRAINT "Appoinments_date_and_time_key" UNIQUE ("date_and_time");



ALTER TABLE ONLY "public"."Appoinments"
    ADD CONSTRAINT "Appoinments_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."Appoinments"
    ADD CONSTRAINT "Appoinments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Blog"
    ADD CONSTRAINT "Blog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FAQs_es"
    ADD CONSTRAINT "FAQs_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FAQs"
    ADD CONSTRAINT "FAQs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Hero_Section"
    ADD CONSTRAINT "Hero Section_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Hero_Section_es"
    ADD CONSTRAINT "Hero_Section_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Images"
    ADD CONSTRAINT "Images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Locations"
    ADD CONSTRAINT "Locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Locations"
    ADD CONSTRAINT "Locations_title_key" UNIQUE ("title");



ALTER TABLE ONLY "public"."Mission_es"
    ADD CONSTRAINT "Mission_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Mission"
    ADD CONSTRAINT "Mission_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Newsletter"
    ADD CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Qr"
    ADD CONSTRAINT "Qr_locationid_key" UNIQUE ("locationid");



ALTER TABLE ONLY "public"."Qr"
    ADD CONSTRAINT "Qr_locationtitle_key" UNIQUE ("locationtitle");



ALTER TABLE ONLY "public"."Qr"
    ADD CONSTRAINT "Qr_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "Services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Specials"
    ADD CONSTRAINT "Specials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Testinomial"
    ADD CONSTRAINT "Testinomial_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Tickers_es"
    ADD CONSTRAINT "Tickers_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Tickers"
    ADD CONSTRAINT "Tickers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."about_es"
    ADD CONSTRAINT "about_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."allpatients"
    ADD CONSTRAINT "allpatients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."career_es"
    ADD CONSTRAINT "career_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."career"
    ADD CONSTRAINT "career_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("feedback_id");



ALTER TABLE ONLY "public"."inpatients"
    ADD CONSTRAINT "inpatients_pkey" PRIMARY KEY ("patient_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_inventory_id_key" UNIQUE ("inventory_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id");



ALTER TABLE ONLY "public"."loginid"
    ADD CONSTRAINT "loginid_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loginid"
    ADD CONSTRAINT "loginid_userid_key" UNIQUE ("userid");



ALTER TABLE ONLY "public"."offsite_patients"
    ADD CONSTRAINT "offsite_patients_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."offsite_patients"
    ADD CONSTRAINT "offsite_patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos"
    ADD CONSTRAINT "pos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promocodes"
    ADD CONSTRAINT "promocodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotype"
    ADD CONSTRAINT "promotype_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promousage"
    ADD CONSTRAINT "promousage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."returnreasons"
    ADD CONSTRAINT "returnreasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_pkey" PRIMARY KEY ("return_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_history"
    ADD CONSTRAINT "sales_history_pkey" PRIMARY KEY ("sales_history_id");



ALTER TABLE ONLY "public"."services_es"
    ADD CONSTRAINT "services_es_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."services_es"
    ADD CONSTRAINT "services_es_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "after_appoinments_insert" AFTER INSERT ON "public"."Appoinments" FOR EACH ROW EXECUTE FUNCTION "public"."insert_or_update_allpatients"();



CREATE OR REPLACE TRIGGER "before_insert_set_date_and_time_null" BEFORE INSERT ON "public"."Appoinments" FOR EACH ROW EXECUTE FUNCTION "public"."set_date_and_time_null_if_empty"();



CREATE OR REPLACE TRIGGER "check_expiry_on_delete" BEFORE DELETE ON "public"."promotype" FOR EACH ROW EXECUTE FUNCTION "public"."update_active_status"();



CREATE OR REPLACE TRIGGER "check_expiry_on_insert" BEFORE INSERT ON "public"."promotype" FOR EACH ROW EXECUTE FUNCTION "public"."update_active_status"();



CREATE OR REPLACE TRIGGER "check_expiry_on_update" BEFORE UPDATE ON "public"."promotype" FOR EACH ROW EXECUTE FUNCTION "public"."update_active_status"();



CREATE OR REPLACE TRIGGER "insert_or_update_allpatients_from_pos" AFTER INSERT ON "public"."pos" FOR EACH ROW EXECUTE FUNCTION "public"."insert_or_update_allpatients_from_pos"();



CREATE OR REPLACE TRIGGER "order_after_insert" AFTER INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."after_order_insert"();



CREATE OR REPLACE TRIGGER "sales_inventory_update" AFTER INSERT ON "public"."sales_history" FOR EACH ROW WHEN (("new"."inventory_id" IS NOT NULL)) EXECUTE FUNCTION "public"."update_inventory_on_sale"();



CREATE OR REPLACE TRIGGER "trigger_insert_inventory" AFTER INSERT ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."insert_inventory_for_new_product"();



CREATE OR REPLACE TRIGGER "trigger_update_products" AFTER UPDATE ON "public"."categories" FOR EACH ROW WHEN (("old"."archived" IS DISTINCT FROM "new"."archived")) EXECUTE FUNCTION "public"."update_associated_products"();



CREATE OR REPLACE TRIGGER "update_quantity_on_merge" AFTER UPDATE OF "merge" ON "public"."returns" FOR EACH ROW WHEN (("new"."merge" = true)) EXECUTE FUNCTION "public"."update_inventory_quantity"();



CREATE OR REPLACE TRIGGER "update_sales_history_return_qty" AFTER INSERT ON "public"."returns" FOR EACH ROW EXECUTE FUNCTION "public"."handle_return_insert"();



ALTER TABLE ONLY "public"."Appoinments"
    ADD CONSTRAINT "Appoinments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."Qr"
    ADD CONSTRAINT "Qr_locationid_fkey" FOREIGN KEY ("locationid") REFERENCES "public"."Locations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Qr"
    ADD CONSTRAINT "Qr_locationtitle_fkey" FOREIGN KEY ("locationtitle") REFERENCES "public"."Locations"("title") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Testinomial"
    ADD CONSTRAINT "Testinomial_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."allpatients"
    ADD CONSTRAINT "allpatients_locationid_fkey" FOREIGN KEY ("locationid") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."pos"("id");



ALTER TABLE ONLY "public"."pos"
    ADD CONSTRAINT "fk_patient" FOREIGN KEY ("patientid") REFERENCES "public"."allpatients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."pos"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promocodes"("id");



ALTER TABLE ONLY "public"."pos"
    ADD CONSTRAINT "pos_locationid_fkey" FOREIGN KEY ("locationid") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."promocodes"
    ADD CONSTRAINT "promocodes_assign_fkey" FOREIGN KEY ("assign") REFERENCES "public"."pos"("id");



ALTER TABLE ONLY "public"."promocodes"
    ADD CONSTRAINT "promocodes_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."promotype"("id");



ALTER TABLE ONLY "public"."promousage"
    ADD CONSTRAINT "promousage_patientid_fkey" FOREIGN KEY ("patientid") REFERENCES "public"."pos"("id");



ALTER TABLE ONLY "public"."promousage"
    ADD CONSTRAINT "promousage_promocodeid_fkey" FOREIGN KEY ("promocodeid") REFERENCES "public"."promocodes"("id");



ALTER TABLE ONLY "public"."Images"
    ADD CONSTRAINT "public_Images_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("inventory_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales_history"("sales_history_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sales_history"
    ADD CONSTRAINT "sales_history_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("inventory_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sales_history"
    ADD CONSTRAINT "sales_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."Locations"("id");



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_permissions_fkey" FOREIGN KEY ("permissions") REFERENCES "public"."permissions"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_roles_fkey" FOREIGN KEY ("roles") REFERENCES "public"."roles"("id");



CREATE POLICY "About Short Update" ON "public"."About_Short" FOR UPDATE USING (true);



ALTER TABLE "public"."About_Short" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."About_Short_es" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "About_es_update" ON "public"."about_es" FOR UPDATE USING (true);



CREATE POLICY "All Acttions" ON "public"."pos" USING (true);



CREATE POLICY "All Allowed" ON "public"."orders" USING (true);



CREATE POLICY "All Allowed" ON "public"."promocodes" USING (true);



CREATE POLICY "All Allowed" ON "public"."promotype" USING (true);



CREATE POLICY "All Allowed" ON "public"."returns" USING (true);



CREATE POLICY "Allowed" ON "public"."feedback" USING (true);



ALTER TABLE "public"."Appoinments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Blog" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "CRUD Allowed" ON "public"."sales_history" USING (true);



CREATE POLICY "Edit enabled" ON "public"."FAQs" FOR UPDATE USING (true);



CREATE POLICY "Edit enabled" ON "public"."career" FOR UPDATE USING (true);



CREATE POLICY "Edit enabled" ON "public"."career_es" FOR UPDATE USING (true);



CREATE POLICY "Enable edit" ON "public"."Testinomial" FOR UPDATE USING (true);



CREATE POLICY "Enable edit" ON "public"."about" FOR UPDATE USING (true);



CREATE POLICY "Enable edit access for all users" ON "public"."Mission" FOR UPDATE USING (true);



CREATE POLICY "Enable edit access for all users" ON "public"."Mission_es" FOR UPDATE USING (true);



CREATE POLICY "Enable edit access for all users " ON "public"."About_Short_es" FOR UPDATE USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."Hero_Section" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."Hero_Section_es" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."Testinomial" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."About_Short" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."About_Short_es" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Blog" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."FAQs" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."FAQs_es" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Hero_Section" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Hero_Section_es" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Images" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Locations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Mission" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Mission_es" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Specials" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Testinomial" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."about" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."about_es" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."career" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."career_es" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."services_es" FOR SELECT USING (true);



CREATE POLICY "Enable update for users based on email" ON "public"."Hero_Section_es" FOR UPDATE USING (true);



ALTER TABLE "public"."FAQs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FAQs_es" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Hero_Section" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Hero_Section_es" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Insert enabled" ON "public"."FAQs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Insert enabled" ON "public"."Locations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Insert enabled" ON "public"."career" FOR INSERT WITH CHECK (true);



CREATE POLICY "Insert enabled" ON "public"."career_es" FOR INSERT WITH CHECK (true);



CREATE POLICY "Inventory read" ON "public"."inventory" FOR SELECT USING (true);



ALTER TABLE "public"."Locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Mission" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Mission_es" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Newletter Insert" ON "public"."Newsletter" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."Newsletter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Qr" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Read" ON "public"."Tickers" FOR SELECT USING (true);



CREATE POLICY "Read" ON "public"."returnreasons" FOR SELECT USING (true);



ALTER TABLE "public"."Specials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Testinomial" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Tickers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Tickers_es" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Update" ON "public"."categories" FOR UPDATE USING (true);



CREATE POLICY "Update HeroSection" ON "public"."Hero_Section" FOR UPDATE USING (true);



CREATE POLICY "Update Location" ON "public"."Locations" FOR UPDATE USING (true);



ALTER TABLE "public"."about" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."about_es" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "add" ON "public"."products" FOR INSERT WITH CHECK (true);



CREATE POLICY "all policies" ON "public"."allpatients" USING (true);



CREATE POLICY "allow" ON "public"."Qr" FOR SELECT USING (true);



CREATE POLICY "allowed" ON "public"."Newsletter" USING (true);



ALTER TABLE "public"."allpatients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."career" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."career_es" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category delete" ON "public"."categories" FOR DELETE USING (true);



CREATE POLICY "category read" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "create" ON "public"."categories" FOR INSERT WITH CHECK (true);



CREATE POLICY "create appointment" ON "public"."Appoinments" FOR INSERT WITH CHECK (true);



CREATE POLICY "curd policy" ON "public"."user_permissions" USING (true);



CREATE POLICY "del policy" ON "public"."Appoinments" FOR DELETE USING (true);



CREATE POLICY "delete policy" ON "public"."roles" FOR DELETE USING (true);



CREATE POLICY "edit policy" ON "public"."roles" FOR UPDATE USING (true);



ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inpatients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert" ON "public"."allpatients" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory  crud" ON "public"."inventory" USING (true);



ALTER TABLE "public"."loginid" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offsite_patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order trigger will create" ON "public"."promousage" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product read" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promocodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotype" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promousage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public access for all operations" ON "public"."Appoinments" USING (true) WITH CHECK (true);



CREATE POLICY "read" ON "public"."Tickers_es" FOR SELECT USING (true);



CREATE POLICY "read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "read" ON "public"."promousage" FOR SELECT USING (true);



CREATE POLICY "read" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "read" ON "public"."user_locations" FOR SELECT USING (true);



CREATE POLICY "read permissions" ON "public"."permissions" FOR SELECT USING (true);



ALTER TABLE "public"."returnreasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."returns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services_es" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trigger on update" ON "public"."inventory" FOR UPDATE USING (true);



CREATE POLICY "update" ON "public"."products" FOR UPDATE USING (true);



CREATE POLICY "update appointment" ON "public"."Appoinments" FOR SELECT USING (true);



ALTER TABLE "public"."user_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "write policy" ON "public"."roles" FOR INSERT WITH CHECK (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."after_order_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_order_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_order_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_associated_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."archive_associated_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_associated_products"() TO "service_role";



GRANT ALL ON FUNCTION "public"."concat_name"("firstname" "text", "lastname" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."concat_name"("firstname" "text", "lastname" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."concat_name"("firstname" "text", "lastname" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."custom_fetch_profiles_with_auth_users_and_ban_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."custom_fetch_profiles_with_auth_users_and_ban_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."custom_fetch_profiles_with_auth_users_and_ban_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_updated_promotypes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_updated_promotypes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_updated_promotypes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_return_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_return_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_return_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_allpatients"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_allpatients"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_allpatients"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_inventory_for_new_product"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_inventory_for_new_product"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_inventory_for_new_product"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_or_update_allpatients"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_or_update_allpatients"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_or_update_allpatients"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_or_update_allpatients_from_pos"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_or_update_allpatients_from_pos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_or_update_allpatients_from_pos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_date_and_time_null_if_empty"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_date_and_time_null_if_empty"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_date_and_time_null_if_empty"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."update_active_promotype_status"() TO "anon";
GRANT ALL ON PROCEDURE "public"."update_active_promotype_status"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."update_active_promotype_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_active_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_active_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_active_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_associated_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_associated_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_associated_products"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_on_sale"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_on_sale"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_on_sale"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_quantity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_quantity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_quantity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_promotypes_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_promotypes_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_promotypes_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quantity_available"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quantity_available"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quantity_available"() TO "service_role";



GRANT ALL ON TABLE "public"."About_Short" TO "anon";
GRANT ALL ON TABLE "public"."About_Short" TO "authenticated";
GRANT ALL ON TABLE "public"."About_Short" TO "service_role";



GRANT ALL ON TABLE "public"."About_Short_es" TO "anon";
GRANT ALL ON TABLE "public"."About_Short_es" TO "authenticated";
GRANT ALL ON TABLE "public"."About_Short_es" TO "service_role";



GRANT ALL ON TABLE "public"."about" TO "anon";
GRANT ALL ON TABLE "public"."about" TO "authenticated";
GRANT ALL ON TABLE "public"."about" TO "service_role";



GRANT ALL ON SEQUENCE "public"."About_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."About_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."About_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."About_short_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."About_short_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."About_short_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Aboutshort_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Aboutshort_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Aboutshort_es_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Appoinments" TO "anon";
GRANT ALL ON TABLE "public"."Appoinments" TO "authenticated";
GRANT ALL ON TABLE "public"."Appoinments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Appoinments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Appoinments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Appoinments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Blog" TO "anon";
GRANT ALL ON TABLE "public"."Blog" TO "authenticated";
GRANT ALL ON TABLE "public"."Blog" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Blog_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Blog_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Blog_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."FAQs" TO "anon";
GRANT ALL ON TABLE "public"."FAQs" TO "authenticated";
GRANT ALL ON TABLE "public"."FAQs" TO "service_role";



GRANT ALL ON TABLE "public"."FAQs_es" TO "anon";
GRANT ALL ON TABLE "public"."FAQs_es" TO "authenticated";
GRANT ALL ON TABLE "public"."FAQs_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."FAQs_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."FAQs_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."FAQs_es_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."FAQs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."FAQs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."FAQs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Hero_Section" TO "anon";
GRANT ALL ON TABLE "public"."Hero_Section" TO "authenticated";
GRANT ALL ON TABLE "public"."Hero_Section" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Hero Section_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Hero Section_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Hero Section_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Hero_Section_es" TO "anon";
GRANT ALL ON TABLE "public"."Hero_Section_es" TO "authenticated";
GRANT ALL ON TABLE "public"."Hero_Section_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Hero_Section_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Hero_Section_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Hero_Section_es_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Images" TO "anon";
GRANT ALL ON TABLE "public"."Images" TO "authenticated";
GRANT ALL ON TABLE "public"."Images" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Images_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Images_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Images_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Locations" TO "anon";
GRANT ALL ON TABLE "public"."Locations" TO "authenticated";
GRANT ALL ON TABLE "public"."Locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Mission" TO "anon";
GRANT ALL ON TABLE "public"."Mission" TO "authenticated";
GRANT ALL ON TABLE "public"."Mission" TO "service_role";



GRANT ALL ON TABLE "public"."Mission_es" TO "anon";
GRANT ALL ON TABLE "public"."Mission_es" TO "authenticated";
GRANT ALL ON TABLE "public"."Mission_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Mission_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Mission_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Mission_es_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Mission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Mission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Mission_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Newsletter" TO "anon";
GRANT ALL ON TABLE "public"."Newsletter" TO "authenticated";
GRANT ALL ON TABLE "public"."Newsletter" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Newsletter_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Newsletter_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Newsletter_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Qr" TO "anon";
GRANT ALL ON TABLE "public"."Qr" TO "authenticated";
GRANT ALL ON TABLE "public"."Qr" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Qr_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Qr_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Qr_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Specials" TO "anon";
GRANT ALL ON TABLE "public"."Specials" TO "authenticated";
GRANT ALL ON TABLE "public"."Specials" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Specials_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Specials_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Specials_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Testinomial" TO "anon";
GRANT ALL ON TABLE "public"."Testinomial" TO "authenticated";
GRANT ALL ON TABLE "public"."Testinomial" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Testinomial_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Testinomial_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Testinomial_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Tickers" TO "anon";
GRANT ALL ON TABLE "public"."Tickers" TO "authenticated";
GRANT ALL ON TABLE "public"."Tickers" TO "service_role";



GRANT ALL ON TABLE "public"."Tickers_es" TO "anon";
GRANT ALL ON TABLE "public"."Tickers_es" TO "authenticated";
GRANT ALL ON TABLE "public"."Tickers_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Tickers_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Tickers_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Tickers_es_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Tickers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Tickers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Tickers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."about_es" TO "anon";
GRANT ALL ON TABLE "public"."about_es" TO "authenticated";
GRANT ALL ON TABLE "public"."about_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."about_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."about_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."about_es_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."allpatients" TO "anon";
GRANT ALL ON TABLE "public"."allpatients" TO "authenticated";
GRANT ALL ON TABLE "public"."allpatients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."allpatients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."allpatients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."allpatients_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."career" TO "anon";
GRANT ALL ON TABLE "public"."career" TO "authenticated";
GRANT ALL ON TABLE "public"."career" TO "service_role";



GRANT ALL ON TABLE "public"."career_es" TO "anon";
GRANT ALL ON TABLE "public"."career_es" TO "authenticated";
GRANT ALL ON TABLE "public"."career_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."career_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."career_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."career_es_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."career_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."career_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."career_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON SEQUENCE "public"."feedback_feedback_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."feedback_feedback_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."feedback_feedback_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inpatients" TO "anon";
GRANT ALL ON TABLE "public"."inpatients" TO "authenticated";
GRANT ALL ON TABLE "public"."inpatients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inpatients_patient_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inpatients_patient_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inpatients_patient_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inventory_inventory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inventory_inventory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inventory_inventory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."loginid" TO "anon";
GRANT ALL ON TABLE "public"."loginid" TO "authenticated";
GRANT ALL ON TABLE "public"."loginid" TO "service_role";



GRANT ALL ON SEQUENCE "public"."loginid_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."loginid_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."loginid_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."offsite_patients" TO "anon";
GRANT ALL ON TABLE "public"."offsite_patients" TO "authenticated";
GRANT ALL ON TABLE "public"."offsite_patients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."offsite_patients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."offsite_patients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."offsite_patients_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pos" TO "anon";
GRANT ALL ON TABLE "public"."pos" TO "authenticated";
GRANT ALL ON TABLE "public"."pos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promocodes" TO "anon";
GRANT ALL ON TABLE "public"."promocodes" TO "authenticated";
GRANT ALL ON TABLE "public"."promocodes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."promocodes_promo_code_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."promocodes_promo_code_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."promocodes_promo_code_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."promotype" TO "anon";
GRANT ALL ON TABLE "public"."promotype" TO "authenticated";
GRANT ALL ON TABLE "public"."promotype" TO "service_role";



GRANT ALL ON SEQUENCE "public"."promotype_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."promotype_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."promotype_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."promousage" TO "anon";
GRANT ALL ON TABLE "public"."promousage" TO "authenticated";
GRANT ALL ON TABLE "public"."promousage" TO "service_role";



GRANT ALL ON SEQUENCE "public"."promousage_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."promousage_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."promousage_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."returnreasons" TO "anon";
GRANT ALL ON TABLE "public"."returnreasons" TO "authenticated";
GRANT ALL ON TABLE "public"."returnreasons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."returnreasons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."returnreasons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."returnreasons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."returns" TO "anon";
GRANT ALL ON TABLE "public"."returns" TO "authenticated";
GRANT ALL ON TABLE "public"."returns" TO "service_role";



GRANT ALL ON SEQUENCE "public"."returns_return_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."returns_return_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."returns_return_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_history" TO "anon";
GRANT ALL ON TABLE "public"."sales_history" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_history_sales_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_history_sales_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_history_sales_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."services_es" TO "anon";
GRANT ALL ON TABLE "public"."services_es" TO "authenticated";
GRANT ALL ON TABLE "public"."services_es" TO "service_role";



GRANT ALL ON SEQUENCE "public"."services_es_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."services_es_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."services_es_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_locations" TO "anon";
GRANT ALL ON TABLE "public"."user_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_permissions_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
