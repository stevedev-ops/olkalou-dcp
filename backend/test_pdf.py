import pdfplumber

pdf_path = "olkalau data/0453/OBF_018091045300101_30-06-2022_213833.pdf"
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        if tables:
            for row in tables[0][1:10]:
                print(row)
            break
