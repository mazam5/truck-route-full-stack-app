# Spotter AI — Truck Route & FMCSA ELD Daily Log Planner

> **Enterprise Full-Stack Application** built with **Django REST Framework (Python 3.14)** and **React 19 + TypeScript + Material UI + Tailwind CSS**.

![Spotter AI Banner](https://img.shields.io/badge/Spotter_AI-ELD_&_HOS_Pro-2563eb?style=for-the-badge&logo=truck)
![FMCSA Compliant](https://img.shields.io/badge/FMCSA-49_CFR_Part_395_Compliant-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📋 Executive Overview

**Spotter AI ELD & HOS Pro** is an algorithmic route planning and Hours of Service (HOS) compliance platform designed for commercial property-carrying motor carriers.

It takes key trip parameters (Current Location, Pickup, Dropoff, and Cycle Hours Used) and produces:
1. **Interactive Route Map** with turn-by-turn geometry, waypoints, and markers for:
   - 🟢 **Origin** (Current Location)
   - 🔵 **Shipper / Pickup** (1.0 hr On-Duty Loading)
   - 🟡 **Fueling Stops** (Mandatory every $\le$ 1,000 miles, 30 min On-Duty)
   - 🟣 **Mandatory 30-Min Rest Breaks** (Every $\le$ 8 hours of cumulative driving)
   - 🟣 **10-Hour Sleeper Berth Overnight Rest** (Resets 11-hr drive & 14-hr shift window clocks)
   - 🔴 **Consignee / Dropoff** (1.0 hr On-Duty Unloading)
2. **Authentic FMCSA 24-Hour Driver's Daily Log Sheets (Form MCS-59)**:
   - Vector-rendered 24-hour graph grid across 4 duty status rows:
     1. *Off Duty*
     2. *Sleeper Berth*
     3. *Driving*
     4. *On Duty (Not Driving)*
   - Continuous step-line graph with vertical transition lines at duty shifts.
   - Dynamic location remarks mapped to exact time ticks.
   - Right-side total hours box balanced to **exactly 24.00 hours**.
   - Bottom **70-Hour / 8-Day Driver Recap** calculation table.
   - Multi-day trip support with interactive day-by-day tabs (Day 1 of $N$).
   - High-fidelity **PDF & Print Ready** styling.

---

## ⚖️ FMCSA HOS Rules & Assumptions Enforced

| Regulation | FMCSA 49 CFR Reference | Engine Implementation |
| :--- | :--- | :--- |
| **11-Hour Driving Limit** | § 395.3(a)(3) | Max 11.0 hours driving per shift after 10 consecutive hours off/sleeper. |
| **14-Hour Driving Window** | § 395.3(a)(2) | Driver cannot drive past 14th consecutive hour after coming on duty. |
| **30-Minute Rest Break** | § 395.3(a)(3)(ii) | Required after 8.0 cumulative driving hours without a 30+ min break. |
| **10-Hour Sleeper Berth** | § 395.1(g) / § 395.3(a)(1) | 10.0 consecutive hours in sleeper berth resets 11h and 14h shift clocks. |
| **70-Hour / 8-Day Cycle** | § 395.3(b) | Rolling 70-hour on-duty limit; schedules 34h restart if cycle exhausted. |
| **Fueling Interval** | Task Specification | Fuel stop (30 min on-duty) scheduled at least once every 1,000 miles. |
| **Pickup & Dropoff** | Task Specification | 1.0 hr on-duty at Shipper (loading) & 1.0 hr on-duty at Consignee (unloading). |

---

## 🏛️ Clean Architecture & Tech Stack

```
truck-route-full-stack-app/
├── backend/                        # Django REST Framework Backend
│   ├── api/
│   │   ├── services/
│   │   │   ├── geocoding_service.py # US Freight Cities DB + OSM Geocoding
│   │   │   ├── routing_service.py   # OSRM Route Engine & Polyline Interpolation
│   │   │   ├── hos_service.py       # Pure FMCSA HOS Simulation Engine
│   │   │   └── eld_log_service.py   # 24h Form MCS-59 Log Sheet Generator
│   │   ├── serializers.py          # DRF Request & Response Serializers
│   │   ├── views.py                # REST API Endpoints
│   │   ├── urls.py                 # API Routing
│   │   └── tests.py                # Unit & Integration Tests (100% Passing)
│   ├── core/                       # Django Core Settings & WSGI/ASGI
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                       # React 19 + TypeScript + Vite + MUI
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx          # Branding, Scenario Switcher, Print Action
    │   │   ├── TripForm.tsx        # Interactive Input Form & Cycle Slider
    │   │   ├── RouteMap.tsx        # Leaflet Interactive Map with Custom SVG Markers
    │   │   ├── HOSDashboard.tsx    # 4 HOS Compliance Clocks & Trip Metrics
    │   │   ├── EldLogSheet.tsx     # Form MCS-59 Daily Log & Recap Component
    │   │   ├── EldGraphGrid.tsx    # 24-Hour Canvas/SVG Step-Line Grid
    │   │   └── TimelineView.tsx    # Chronological Journey Stops Sequence
    │   ├── services/api.ts         # Axios API Client with Fallbacks
    │   ├── types/trip.ts           # Strict TypeScript Interfaces
    │   ├── App.tsx                 # Root Component & State Orchestration
    │   └── index.css               # Tailwind CSS 4 + Print Media Styles
```

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- **Python 3.10+** (tested on Python 3.14)
- **Node.js 18+** & `npm`

### 2. Backend Setup (Django REST Framework)
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & unit tests
python manage.py migrate
python manage.py test

# Start the Django API server (runs on port 8000)
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup (React + Vite)
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the frontend dev server (runs on port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🎯 Evaluator Quick Load Test Scenarios

The top navigation bar and trip form contain **1-Click Pre-set Scenarios**:
1. **Chicago, IL ➔ Dallas, TX (1,080 mi)**: Standard interstate haul with 1 fuel stop, 1 rest break, and 1 sleeper berth layover across 2 calendar days.
2. **Los Angeles, CA ➔ Miami, FL (2,733 mi)**: Coast-to-coast cross-country trip demonstrating multi-day scheduling across 5 daily log sheets with 2 fuel stops and 3 sleeper layovers.
3. **Richmond, VA ➔ Newark, NJ (340 mi)**: Short-haul 1-day trip matching the exact official FMCSA example from the DOT handbook!

---

## 🌿 Git Branch Hierarchy & Workflow

This repository follows enterprise GitFlow branching standards:
- **`master` / `production`**: Production-ready release branch.
- **`staging`**: Staging integration & QA branch.
- **`develop`**: Active development integration branch.
- **`feature/backend-hos-routing-api`**: Backend HOS engine, OSRM routing, and DRF views.
- **`feature/frontend-route-planner-map-and-eld-logs`**: Frontend UI, Leaflet map, HOS clocks, and ELD log generator.

---

## 📄 License
This project is open-source under the MIT License. Built for the Spotter AI Full-Stack Engineer Technical Assessment.
