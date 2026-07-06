import openpyxl
from django.core.management.base import BaseCommand
from api.models import VoterRecord
import os

class Command(BaseCommand):
    help = 'Import voter register from Excel'

    def handle(self, *args, **options):
        from django.conf import settings
        import os

        # 1. Import from the complete CSV first (Place file in root directory)
        csv_path = os.path.join(settings.BASE_DIR, 'voters_complete.csv')
        total_count = 0

        if os.path.exists(csv_path):
            import csv
            import re
            self.stdout.write(f'Importing from {csv_path}...')
            voter_records = []
            batch_size = 2000
            try:
                with open(csv_path, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        id_raw = row.get('id_number', '').strip()
                        last_name = row.get('last_name', '').strip()
                        first_middle = row.get('first_middle_name', '').strip()
                        ward = row.get('ward', '').strip()
                        polling_station = row.get('polling_centre', '').strip()
                        dob = row.get('date_of_birth', '').strip() or row.get('dob', '').strip() or row.get('Date of Birth', '').strip()
                        gender = row.get('gender', '').strip() or row.get('sex', '').strip() or row.get('Sex', '').strip() or row.get('SexElectoral Number', '').strip()

                        id_in_name = re.search(r'\b(\d{7,8})\b', first_middle)
                        id_number = id_raw
                        if id_in_name and ('*' in id_number or not id_number):
                            id_number = id_in_name.group(1)
                            first_middle = first_middle.replace(id_in_name.group(0), '').replace('-', '').strip()

                        full_name = f"{first_middle} {last_name}".strip()
                        voter_records.append(VoterRecord(
                            id_number=id_number,
                            full_name=full_name,
                            ward=ward,
                            polling_station=polling_station,
                            dob=dob,
                            gender=gender
                        ))

                        if len(voter_records) >= batch_size:
                            VoterRecord.objects.bulk_create(voter_records, ignore_conflicts=True)
                            total_count += len(voter_records)
                            voter_records = []
                            self.stdout.write(f'  Imported {total_count} records...')

                    if voter_records:
                        VoterRecord.objects.bulk_create(voter_records, ignore_conflicts=True)
                        total_count += len(voter_records)
                self.stdout.write(self.style.SUCCESS(f'CSV Import Complete: {total_count} records.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'CSV Error: {str(e)}'))
        
        # 2. Scan for additional Excel files in the register directory
        base_dir = os.path.join(settings.BASE_DIR, 'voter_register_excels')
        if os.path.exists(base_dir):
            self.stdout.write(f'Scanning for additional Excel files in {base_dir}...')
            excel_count = 0
            for root, dirs, files in os.walk(base_dir):
                for file in files:
                    if file.endswith('.xlsx'):
                        file_path = os.path.join(root, file)
                        ward_name = os.path.basename(root).replace('_voter_register', '').title()
                        if '2022' in ward_name:
                             ward_name = file.split(' ')[0].title()

                        self.stdout.write(f'  Processing {file}...')
                        try:
                            wb = openpyxl.load_workbook(file_path, data_only=True)
                            ws = wb.active
                            current_ward = ward_name
                            current_station = "Unknown"
                            
                            for row in ws.iter_rows(min_row=1):
                                name_val = row[1].value if len(row) > 1 else None
                                
                                # Convert row to string to catch PDF-dumped cells
                                row_text = " ".join([str(c.value).strip() for c in row if c.value])
                                if not row_text:
                                    continue
                                    
                                # 1. Try to detect Ward from text (e.g. "0453 - KARAU")
                                ward_match = re.search(r'^\d{3,4}\s*-\s*([A-Z\s]+)$', row_text.strip())
                                if ward_match and "PRIMARY" not in row_text and "SCHOOL" not in row_text:
                                    current_ward = ward_match.group(1).strip().title()
                                    
                                # 2. Try to detect Polling Station
                                if ward_match and ("PRIMARY" in row_text or "SCHOOL" in row_text or "NURSERY" in row_text or "CENTRE" in row_text):
                                    current_station = ward_match.group(1).strip().title()
                                    
                                # 3. Check if it's a PDF-dumped voter line!
                                voter_match = re.search(r"(\d{1,4})(ID|PP)(\d\*{4,8}\d)([A-Z\s\-]+?)(\d{4})([MF])(\d+-\d+)", row_text)
                                
                                if voter_match:
                                    id_val = voter_match.group(3)
                                    raw_name = voter_match.group(4)
                                    # Insert space between lowercase and uppercase letters
                                    name_val = re.sub(r"([a-z])([A-Z])", r"\1 \2", raw_name) 
                                    dob_val = voter_match.group(5)
                                    gender_val = voter_match.group(6)
                                    
                                    _, created = VoterRecord.objects.get_or_create(
                                        full_name=name_val.strip(),
                                        id_number=id_val,
                                        defaults={'ward': current_ward, 'polling_station': current_station, 'dob': dob_val, 'gender': gender_val}
                                    )
                                    if created: excel_count += 1
                                    
                                elif name_val and len(row) >= 4:
                                    # Standard Excel Fallback
                                    num_candidate = str(row[4].value if len(row) > 4 else row[0].value).strip()
                                    id_val = num_candidate if 7 <= len(num_candidate) <= 8 else None
                                    phone_val = num_candidate if len(num_candidate) >= 9 else None
                                    dob_val = str(row[2].value).strip() if len(row) > 2 and row[2].value else None
                                    gender_val = str(row[3].value).strip() if len(row) > 3 and row[3].value else None

                                    _, created = VoterRecord.objects.get_or_create(
                                        full_name=str(name_val).strip(),
                                        id_number=id_val,
                                        defaults={'ward': current_ward, 'polling_station': current_station, 'phone_number': phone_val, 'dob': dob_val, 'gender': gender_val}
                                    )
                                    if created: excel_count += 1
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'    Error: {str(e)}'))
            
            self.stdout.write(self.style.SUCCESS(f'Excel Import Complete: {excel_count} new records added.'))
            total_count += excel_count

        self.stdout.write(self.style.SUCCESS(f'Total database now has {VoterRecord.objects.count()} records.'))
