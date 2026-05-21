import io
import hashlib
from pypdf import PdfReader

def calculate_sha256(file_bytes: bytes) -> str:
    """
    Calculate the SHA-256 hash of file bytes.
    Used to detect if the same file is being uploaded multiple times.
    """
    return hashlib.sha256(file_bytes).hexdigest()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract readable text content from a PDF file in memory.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        # Join pages with clean newlines
        full_text = "\n".join(extracted_text).strip()
        
        if not full_text:
            raise ValueError("No text could be extracted. The PDF might be scanned/image-only or encrypted.")
            
        return full_text
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")
