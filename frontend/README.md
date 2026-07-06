# DCP Command Center
### Next-Generation Political Mobilization \u0026 Election Management Platform

The **DCP Command Center** is a state-of-the-art, end-to-end digital platform designed specifically for modern political campaigns. It bridges the gap between field organizers and headquarters, providing real-time data, verified voter intelligence, and seamless logistical control from the start of the campaign through Election Day.

---

## Executive Summary

Winning elections requires precision, organization, and real-time intelligence. The DCP Command Center replaces fragmented spreadsheets and paper trails with a centralized, unified platform. By empowering field agents with a mobile-friendly Progressive Web App (PWA) and providing HQ with a high-level analytics dashboard, campaigns can mobilize voters faster, verify data instantly, and respond to on-the-ground situations in real time.

---

## Core Capabilities \u0026 Modules

### 1. Advanced Network \u0026 Recruitment Engine
* **Hierarchical Mobilization**: Build a structured, multi-tier recruitment network (Roots \u0026 Branches). Track who recruited whom to identify your most effective mobilizers.
* **Smart Quotas**: Automatically enforce recruitment targets to ensure sustainable network growth and accountability at every tier.
* **Interactive Lineage Trees**: Visually navigate your entire organizational structure from the top down.

### 2. Real-Time Voter Verification
* **Registry Integration**: Automatically cross-reference newly recruited members against official voter registries to ensure accurate, actionable data.
* **Intelligent Matching**: Utilizes advanced, privacy-compliant algorithms to match field data with official electoral records, ensuring every recruit is a guaranteed vote.
* **Ward \u0026 Polling Station Mapping**: Automatically assign and sort your supporters into their designated voting zones.

### 3. Election Day Arsenal (GOTV)
* **Parallel Vote Tabulation (PVT)**: Equip agents to upload real-time tally results and Form 34A evidence directly from polling stations, feeding instantly into the HQ dashboard.
* **Get Out The Vote (GOTV) Strike-offs**: Live-tracking of voter turnout. Agents can mark supporters as \\"Voted\\" to focus resources exclusively on those who haven't shown up.
* **Incident Reporting**: Real-time logging of irregularities, security threats, or voter suppression, allowing legal teams to respond instantly.

### 4. Field Logistics \u0026 Transport Management
* **Boda-Boda Dispatch**: Seamlessly manage transport requests for voters who need rides to the polling stations.
* **Agent Check-Ins**: Monitor your polling agents with digital check-ins, ensuring 100% coverage across all wards and stations.

### 5. Secure \u0026 Instant Communication
* **Emergency Broadcast System**: HQ can override the platform screen of every logged-in field agent with critical, instant alerts.
* **Targeted Phone Banking**: Built-in caller modules to distribute call lists and track response outcomes automatically.
* **Data Exportation**: One-click SMS list exports and CSV downloads for targeted external campaigning.

---

## Platform Advantages

* **Progressive Web App (PWA) Technology**: Field agents do not need to download anything from the App Store. The system installs directly to their home screen and uses minimal data, ensuring reliability even in remote areas with poor connectivity.
* **Frictionless Authentication**: Password-less, secure login flow using secure ID verification, eliminating the number one cause of user lockouts in the field.
* **Data Privacy \u0026 Security**: Built on enterprise-grade architecture (Django/React) to ensure that sensitive voter data and campaign intelligence remain strictly confidential and protected against external threats.
* **Actionable Intelligence**: Transform raw field data into beautiful, easy-to-read charts and metrics that allow campaign managers to make split-second strategic decisions.

---

*Equip your campaign with the tools built for victory. The DCP Command Center turns crowds into organized, trackable, and verifiable political power.*

---

## How to Start the System

You need to run both the backend (Django) and the frontend (React/Vite) servers simultaneously in two separate terminal windows.

### Terminal 1: Start the Backend
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```
*The backend API will run on http://127.0.0.1:8000*

### Terminal 2: Start the Frontend
```bash
cd frontend
npm run dev
```
*The frontend app will usually run on http://localhost:5173 (check your terminal output).*

---

## Developer Setup \u0026 Data Seeding

### 1. Creating Admin/Test Users
To seed the database with an HQ Administrator and a test Field Agent:
```bash
cd backend
source venv/bin/activate
python manage.py shell < create_users.py
```

### 2. Importing Voter Register from IEBC PDFs
To automatically extract and import the entire Ol Kalou voter register directly from the original IEBC PDFs (located in `/home/steve/client websites/olkalau /091`), run the custom importer script:
```bash
cd backend
source venv/bin/activate
python manage.py import_pdfs
```
*Note: This script recursively scans all PDFs, extracts tables page-by-page using `pdfplumber`, and bulk-creates the records. It may take 20-30 minutes for ~70,000 records.*
