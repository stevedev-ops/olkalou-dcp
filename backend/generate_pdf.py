from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import os

pdf_filename = "/home/steve/client websites/olkalou-dcp/backend/DCP_Security_Team_Polling_Report.pdf"

doc = SimpleDocTemplate(pdf_filename, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    name='TitleStyle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=18,
    spaceAfter=14,
    alignment=TA_CENTER
)
subtitle_style = ParagraphStyle(
    name='SubtitleStyle',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=14,
    spaceAfter=20,
    textColor=colors.darkred
)
body_style = styles["Normal"]

Story = []

# Title
Story.append(Paragraph("DEMOCRATIC CONGRESS PARTY (DCP)", title_style))
Story.append(Paragraph("OL KALOU CONSTITUENCY POLLING DATA", title_style))
Story.append(Spacer(1, 12))

# Subtitle
Story.append(Paragraph("STRICTLY CONFIDENTIAL - SECURITY TEAM ORGANISING", subtitle_style))
Story.append(Spacer(1, 12))

# Intro text
intro = """This report details the polling center and station breakdown across Ol Kalou constituency wards. 
It is intended for the DCP Security Team for deployment and monitoring purposes during the election."""
Story.append(Paragraph(intro, body_style))
Story.append(Spacer(1, 12))

# Data table
data = [
    ['Ward Code', 'Ward Name', 'Centers', 'Stations', 'Voters', 'Center Staff\n(5/center)', 'Ward Mgrs\n(1/ward)'],
    ['0453', 'KARAU', '13', '27', '13,594', '65', '1'],
    ['0454', 'KANJUIRI RANGE', '17', '32', '15,596', '85', '1'],
    ['0455', 'MIRANGINE', '13', '25', '14,695', '65', '1'],
    ['0456', 'KAIMBAGA', '13', '25', '13,540', '65', '1'],
    ['0457', 'RURII', '17', '33', '15,572', '85', '1'],
    ['TOTAL', '', '73', '142', '72,997', '365', '5']
]

t = Table(data, colWidths=[55, 95, 50, 50, 60, 75, 75])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'), # bold total row
    ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
]))

Story.append(t)
Story.append(Spacer(1, 24))

footer_text = "Generated for DCP Election Security Operations. Please do not distribute without authorization."
Story.append(Paragraph(footer_text, ParagraphStyle(name='Footer', parent=body_style, fontName='Helvetica-Oblique', fontSize=9, textColor=colors.gray)))

doc.build(Story)
print("PDF created successfully at", pdf_filename)
