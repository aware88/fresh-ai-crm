-- Migration: Enhance supplier_documents table for AI processing
-- Description: Add columns to support AI document processing pipeline

BEGIN;

-- Add new columns to supplier_documents table
ALTER TABLE public.supplier_documents
  -- Processing status column
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed', 'pending_review', 'approved', 'rejected')),
  
  -- Extracted data in JSON format
  ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}'::jsonb,
  
  -- Processing metadata (e.g., confidence scores, processing timestamps)
  ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Processing error message if any
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  
  -- When the document was processed
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  
  -- Who reviewed/approved the extracted data
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  
  -- When the extracted data was reviewed
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Create index on processing_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_supplier_documents_processing_status 
ON public.supplier_documents(processing_status);

-- Create index on processed_at for sorting by processing time
CREATE INDEX IF NOT EXISTS idx_supplier_documents_processed_at 
ON public.supplier_documents(processed_at);

-- Add comments for documentation
COMMENT ON COLUMN public.supplier_documents.processing_status IS 'Status of AI processing: pending, processing, processed, failed, pending_review, approved, rejected';
COMMENT ON COLUMN public.supplier_documents.extracted_data IS 'Structured data extracted from the document by AI';
COMMENT ON COLUMN public.supplier_documents.processing_metadata IS 'Metadata about the processing (confidence scores, etc.)';
COMMENT ON COLUMN public.supplier_documents.processing_error IS 'Error message if processing failed';
COMMENT ON COLUMN public.supplier_documents.processed_at IS 'When the document was processed by AI';
COMMENT ON COLUMN public.supplier_documents.reviewed_by IS 'User who reviewed/approved the extracted data';
COMMENT ON COLUMN public.supplier_documents.reviewed_at IS 'When the extracted data was reviewed';

-- Create a view for documents pending review
CREATE OR REPLACE VIEW supplier_documents_pending_review AS
SELECT 
  d.*,
  s.name as supplier_name,
  s.email as supplier_email
FROM 
  public.supplier_documents d
JOIN 
  public.suppliers s ON d.supplier_id = s.id
WHERE 
  d.processing_status = 'pending_review';

-- Create a function to update processed_at timestamp when status changes to 'processed'
CREATE OR REPLACE FUNCTION update_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.processing_status = 'processed' AND 
     (OLD.processing_status IS NULL OR OLD.processing_status != 'processed') THEN
    NEW.processed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update reviewed_at timestamp when status changes to 'approved' or 'rejected'
CREATE OR REPLACE FUNCTION update_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.processing_status = 'approved' OR NEW.processing_status = 'rejected') AND
     (OLD.processing_status != 'approved' AND OLD.processing_status != 'rejected') THEN
    NEW.reviewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the functions
DROP TRIGGER IF EXISTS trigger_update_processed_at ON public.supplier_documents;
CREATE TRIGGER trigger_update_processed_at
BEFORE UPDATE ON public.supplier_documents
FOR EACH ROW
EXECUTE FUNCTION update_processed_at();

DROP TRIGGER IF EXISTS trigger_update_reviewed_at ON public.supplier_documents;
CREATE TRIGGER trigger_update_reviewed_at
BEFORE UPDATE ON public.supplier_documents
FOR EACH ROW
EXECUTE FUNCTION update_reviewed_at();

-- RLS is already enabled on this table in migration 51
-- We just need to ensure our new columns respect the existing policies
-- No need to create new policies as the existing ones use created_by = auth.uid()

COMMIT;
