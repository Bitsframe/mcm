-- Backfill allpatients.dob from the latest appointment row per patient_id.
-- The insert_or_update_allpatients trigger never copied dob on insert/update.

UPDATE public.allpatients ap
SET dob = sub.dob
FROM (
  SELECT DISTINCT ON (patient_id)
    patient_id,
    dob
  FROM public."Appoinments"
  WHERE patient_id IS NOT NULL
    AND dob IS NOT NULL
  ORDER BY patient_id, created_at DESC
) sub
WHERE ap.id = sub.patient_id
  AND ap.dob IS NULL
  AND ap.deleted_at IS NULL;
