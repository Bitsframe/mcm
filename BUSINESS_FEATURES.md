# MCM — Business Features Overview

> **Product:** Multi-location medical clinic management and retail platform  
> **Audience:** Clinic staff, administrators, and operations teams  
> **Brand context:** Built for Clínica San Miguel (internal name: MCM / MyClinicMD)

This document describes what the platform does from a business perspective — the modules, workflows, and capabilities available to clinic operators.

---

## What This Platform Is

MCM is a **back-office operations console** for a chain of medical clinics that also sell treatments and products at the point of sale. It combines:

- **Clinical operations** — patients, appointments, medical forms, pharmacy partners
- **Retail operations** — POS sales, returns, inventory, warehouse, promo codes
- **Staff & admin tools** — roles, user management, marketing broadcasts, website content
- **Financial tracking** — patient credits, transactions, staff bonuses

The system is **multi-location**: nearly every feature is scoped to a clinic location, with a global location switcher in the sidebar.

---

## Feature Map (High Level)

| Domain | Purpose |
|--------|---------|
| Dashboard | Operational overview and system health |
| Patients | Patient directory and profiles |
| Appointments | Scheduling and visit management |
| Reputation | Private patient feedback |
| POS | In-clinic and remote sales |
| Transactions | Patient financial ledger |
| Bonus | Staff commission and incentive tracking |
| Inventory | Product and stock management |
| Credits | Patient store credit balances |
| Warehouse | Central stock hub for locations |
| Stock Panel | AI-assisted inventory insights |
| Controls | Location limits, staff, email templates |
| Tools | Marketing, CMS, admin, pharmacy, forms |

---

## 1. Dashboard

- Welcome home screen with quick stats
- System monitoring visibility (uptime, SSL, DNS, response times)
- Central entry point for daily clinic operations

---

## 2. Patient Management

### Patient directory
- **All patients** — full searchable directory
- **On-site patients** — patients who visit clinics in person
- **Off-site patients** — remote / delivery patients

### Patient profiles
- Demographics: name, gender, date of birth, contact info, address
- New vs. returning patient tracking
- Linked sales history and transaction records
- Location-scoped patient data

---

## 3. Appointments

- Book and manage appointments per clinic location
- Visit types: **office visit** and **virtual visit**
- Approval workflow: new appointments → approved appointments
- Treatment/service selection, date/time scheduling
- Address capture with validation and suggestions
- Automated **confirmation emails** and **reminder emails**

---

## 4. Reputation

### Private Feedback
- Collect internal patient feedback before it becomes public reviews
- Helps clinics monitor satisfaction and respond proactively

---

## 5. Point of Sale (POS)

### Sales
- Full retail register for medical products and services
- Supports medical unit types (tablets, capsules, vials, syringes, kits, exams, X-rays, etc.)
- Patient-linked checkout
- Promo code validation at checkout
- Off-site **fulfillment workflow**: request → search → fulfill → confirmation email

### Returns
- Process product/treatment returns linked to prior sales

### History
- Searchable sales history with order details
- Patient previous purchase records

---

## 6. Transactions

- Per-patient financial ledger
- Tracks amounts, treatment types, and running balances
- Complements POS and Credits for a full financial picture

---

## 7. Bonus & Commissions

Staff incentive program with two views:

### Location Bonus
- Bonus calculations aggregated by clinic location
- Configurable thresholds and payout rules (flat or percentage)
- Weekly/monthly calculation windows
- Mark bonuses as paid or unpaid

### Individual Bonus
- Per-staff bonus tracking and distribution
- Leaderboards (highest bonus by person or location)
- Eligibility rules tied to product/sales performance

---

## 8. Inventory

### Manage Inventory
- Product and category management (create, edit, archive/unarchive)
- Per-location stock assignment
- **Stock transfers** between clinic locations
- Tracks available, assigned, and remaining stock
- Supports **unlimited stock** products
- Bonus-eligible product flagging

### Stock Panel (AI)
- AI-powered inventory analysis across the full product catalog
- Batch processing for stock insights and recommendations
- Helps operations teams identify stock issues at scale

---

## 9. Credits

- Patient store credit / account balance management
- Individual patient balances
- Per-location credit overviews
- Credit limits, averages, and totals
- Works alongside Transactions and POS

---

## 10. Warehouse

- Central warehouse stock management
- Feeds inventory to individual clinic locations
- Product management at the warehouse level

---

## 11. Controls (Operations Configuration)

| Sub-module | Business purpose |
|------------|------------------|
| **Location Limits** | Set credit limits and reporting configuration per location |
| **Email Templates** | Create, edit, and preview reusable email templates |
| **Staff** | Manage staff records, roles, multi-location assignment, active/inactive status |

---

## 12. Tools (Admin & Marketing)

### Email Broadcast
- Mass email campaigns to filtered patient segments
- Filters: gender, treatment type, visit type, location, price range
- Template selection and preview before send

### Text / SMS Broadcast
- Bulk SMS capability (built; currently hidden from main menu)
- Supports US, Canada, and international number formats

### Website Content (CMS)
Manages the public marketing website in English and Spanish:
- About
- Testimonials
- Career
- Locations
- FAQs
- Services
- Blogs
- Specials

### Promo Codes
- Create and manage discount codes
- Validated at POS checkout

### Specials
- Promotional image gallery for marketing displays

### Roles & Permissions
- Role-based access control (RBAC)
- Custom roles with granular permission toggles
- Assign roles to users

### User Management
- Create, edit, and deactivate staff accounts
- Password management

### Pharmacy
- Manage partner pharmacy listings
- Name, address, phone, delivery capability, hours

### Medical Forms
- Manage patient intake / medical forms
- Synced to the patient-facing website (see Integrations)

### Settings
- User profile settings
- Security settings

---

## 13. Additional Capabilities

### Multi-language (English & Spanish)
- Full UI localization for English (`en`) and Spanish (`es`)
- Locale-prefixed routing
- Website CMS supports per-language content

### Multi-location operations
- Global location switcher in sidebar
- All major modules respect active location context

### Authentication & security
- Staff login with password setup flow
- Role-based module access
- Bot protection (Cloudflare Turnstile)

### Inbox (scaffold)
- WhatsApp and Text inbox pages (foundation for messaging workflows)

### Automated reporting
- Scheduled report emails to staff by location (cron-based)

---

## Integrations (Business View)

| Integration | Business use |
|-------------|--------------|
| **Supabase** | Core database, authentication, and data storage |
| **AWS SNS** | SMS / text message delivery |
| **Email (Lambda + Nodemailer)** | Appointment, reminder, fulfillment, broadcast, and transactional emails |
| **OpenAI** | AI Stock Panel inventory analysis |
| **Mapbox (address validation)** | US address verification for appointments and patients |
| **Cloudflare Turnstile** | Login and form bot protection |
| **Cronitor** | Scheduled job and uptime monitoring |
| **Parent → Child DB Sync** | Keeps medical forms in sync between this admin app and the patient-facing website |

---

## Typical User Roles & What They Use

| Role type | Primary modules |
|-----------|-----------------|
| Front desk / reception | Appointments, Patients, POS Sales |
| Clinic manager | Dashboard, Inventory, Controls, Bonus |
| Marketing | Email Broadcast, Website Content, Promo Codes, Specials |
| Admin / IT | User Management, Roles, Settings |
| Warehouse / ops | Warehouse, Inventory, Stock Panel, Fulfillment |
| Finance | Transactions, Credits, POS History, Returns |

---

## Module Summary (Quick Reference)

```
Home
├── Dashboard

Patients
├── All
├── On-site
└── Off-site

Appointments

Reputation
└── Private Feedback

POS
├── Sales (+ Fulfillment)
├── History
└── Return

Transactions

Bonus
├── Location Bonus
└── Individual Bonus

Inventory (Manage)

Credits

Warehouse (Manage)

Stock Panel (AI)

Controls
├── Location Limits
├── Email Templates
└── Staff

Tools
├── Email Broadcast
├── Website Content
├── Promo Codes
├── Roles & Permissions
├── User Management
├── Specials
├── Settings
├── Pharmacy
└── Medical Forms
```

---

*Generated from codebase exploration — July 2026*
