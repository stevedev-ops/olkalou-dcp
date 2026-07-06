import os
import re
import pdfplumber
from django.core.management.base import BaseCommand
from api.models import VoterRecord
import time

class Command(BaseCommand):
    help = 'Import voter register directly from IEBC PDFs'

    def handle(self, *args, **options):
        # The base directory where the 091 folder is located
        base_dir = '/home/steve/client websites/olkalou-dcp/backend/olkalau data'
        
        if not os.path.exists(base_dir):
            self.stdout.write(self.style.ERROR(f"Directory not found: {base_dir}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Scanning for PDF files in {base_dir}..."))
        
        pdf_files = []
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
                    
        self.stdout.write(self.style.SUCCESS(f"Found {len(pdf_files)} PDF files to process."))
        
        total_voters_imported = 0
        
        for idx, pdf_path in enumerate(pdf_files):
            self.stdout.write(f"[{idx+1}/{len(pdf_files)}] Processing {os.path.basename(pdf_path)}...")
            
            ward_name = None
            ps_name = None
            voter_records = []
            
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    # Try to extract ward and polling station from the first page text
                    first_page_text = pdf.pages[0].extract_text()
                    if first_page_text:
                        ward_match = re.search(r"COUNTY ASSEMBLY WARD:\s*\d+\s*-\s*([^\n]+)", first_page_text)
                        ps_match = re.search(r"POLLING CENTRE:\s*\d+\s*-\s*([^\n]+)", first_page_text)
                        
                        if ward_match:
                            ward_name = ward_match.group(1).strip().title()
                        if ps_match:
                            ps_name = ps_match.group(1).strip().title()

                    # Extract the tables from each page
                    for page_num, page in enumerate(pdf.pages):
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                # A valid voter row usually has a numeric "Order" string in the first column
                                if not row or not row[0]:
                                    continue
                                    
                                if str(row[0]).strip().isdigit():
                                    id_raw = str(row[1]) if len(row) > 1 and row[1] else ""
                                    id_clean = id_raw.replace("ID", "").strip()
                                    
                                    last_name = str(row[2]) if len(row) > 2 and row[2] else ""
                                    first_name = str(row[3]) if len(row) > 3 and row[3] else ""
                                    dob_val = str(row[4]) if len(row) > 4 and row[4] else ""
                                    gender_val = str(row[5]) if len(row) > 5 and row[5] else ""
                                    
                                    full_name = f"{first_name} {last_name}".replace("-", "").strip()
                                    full_name = re.sub(r"\s+", " ", full_name)  # Clean up extra spaces
                                    
                                    if full_name:
                                        voter_records.append(VoterRecord(
                                            id_number=id_clean,
                                            full_name=full_name,
                                            ward=ward_name,
                                            polling_station=ps_name,
                                            dob=dob_val,
                                            gender=gender_val
                                        ))
                                        
                # Bulk create records for this PDF file to save database hits
                if voter_records:
                    VoterRecord.objects.bulk_create(voter_records, ignore_conflicts=True)
                    total_voters_imported += len(voter_records)
                    self.stdout.write(self.style.SUCCESS(f"  --> Saved {len(voter_records)} voters from this file."))
                else:
                    self.stdout.write(self.style.WARNING("  --> No voters found in this file."))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  --> Error reading {os.path.basename(pdf_path)}: {e}"))
                
        self.stdout.write(self.style.SUCCESS(f"\nFINISHED! Total voters imported: {total_voters_imported}"))
        self.stdout.write(self.style.SUCCESS(f"Database now has {VoterRecord.objects.count()} total records."))
