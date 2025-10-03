-- Add updated_at column to allpatients table
ALTER TABLE "public"."allpatients" 
ADD COLUMN "updated_at" timestamp with time zone DEFAULT "now"();

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to allpatients table
CREATE TRIGGER update_allpatients_updated_at 
    BEFORE UPDATE ON "public"."allpatients" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();