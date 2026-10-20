# SuriOS — Features & Implementation Roadmap

This document outlines the core functional modules and features being implemented in **SuriOS**.

---

## 1. Feature Breakdown by Subsystem

### Module A: Citizen & Inspector Field Reporting (`/report`)
* **One-Tap Camera Capture:** Instant mobile rear-camera capture with native file compression.
* **Auto-Geolocation Ingestion:** Accurate latitude/longitude acquisition via HTML5 Geolocation.
* **Instant Safety Feedback:** Immediate client-side visual assessment and severity preview.
* **Spam & Abuse Protection:** Automated rejection of invalid, non-road, or indoor photos.

### Module B: AI Vision & Civil Triage Pipeline (`/api/triage`)
* **ASTM D6433 Distress Classification:** AI categorization into potholes, alligator cracking, rutting, ravelling, and drainage failures.
* **Deterministic Hazard Severity Index:** Standardized 1–10 danger score calculated from defect depth, area, and road context.
* **Vulnerable Road User (VRU) Profiling:** Dedicated hazard rating for motorcycles, tricycles, and bicycles.
* **Materials & Tools Estimation:** Recommended repair technique and required crew equipment list.

### Module C: Municipal Operations Dashboard (`/dashboard`)
* **Interactive GIS Map:** Real-time map displaying geolocated hazard pins across municipal districts.
* **Severity Color Clustering:** Visual status markers (Green: Low, Amber: Moderate, Red: Critical).
* **Maintenance Dispatch Drawer:** Slide-over panel displaying defect imagery, civil diagnosis, and dispatch actions.
* **Ticket Lifecycle Tracking:** State progression from `REPORTED` to `DISPATCHED` to `RESOLVED`.
* **District Severity Filtering:** Dynamic filtering by distress category, urgency level, and date.

### Module D: Cloud Infrastructure & Security
* **Containerized Deployment:** Docker Compose configuration running Node, PostgreSQL, and Nginx.
* **SSL Termination & HTTPS:** Let's Encrypt automated TLS certificates for geolocation compliance.
* **Subdomain Reverse Proxy:** Nginx routing and client request rate limiting.

---

## 2. Implementation Phasing

```
[Phase 1: Docs & Architecture] ──> [Phase 2: AI Triage Engine] ──> [Phase 3: Database & Models] ──> [Phase 4: Mobile Report UI] ──> [Phase 5: Municipal Map Dashboard] ──> [Phase 6: Docker & Azure Cloud]
```
