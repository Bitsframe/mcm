# Complete Project Documentation - MyClinicMD (MCM)

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Complete File Catalog](#complete-file-catalog)
4. [Order Email System Fix](#order-email-system-fix)
5. [Architecture Overview](#architecture-overview)
6. [Configuration Files](#configuration-files)
7. [Dependencies & Technologies](#dependencies--technologies)
8. [API Endpoints](#api-endpoints)
9. [Components Library](#components-library)
10. [Utilities & Services](#utilities--services)
11. [Database Schema](#database-schema)
12. [Environment Variables](#environment-variables)
13. [Development Workflow](#development-workflow)

---

## Project Overview

**Project Name:** MyClinicMD (MCM)  
**Version:** 0.1.0  
**Framework:** Next.js 14.2.35  
**Language:** TypeScript/JavaScript  
**Package Manager:** Yarn 1.22.19  
**Database:** Supabase (PostgreSQL)  
**Authentication:** Supabase Auth  
**Deployment:** Vercel (assumed)

**Purpose:** A comprehensive clinic management system for handling patients, appointments, orders, inventory, pharmacy operations, and administrative tasks.

**Key Features:**
- Point of Sale (POS) system
- Patient management
- Appointment scheduling
- Inventory management
- Pharmacy operations
- Email notifications
- SMS notifications
- Multi-language support (English/Spanish)
- Role-based access control
- Reporting and analytics

---

## Project Structure

```
mcm/
├── actions/                    # Server actions
├── app/                       # Next.js App Router
│   ├── api/                  # API routes
│   ├── [locale]/             # Internationalized routes
│   └── [...not-found]/       # 404 handler
├── assets/                    # Static assets
├── components/                # React components
├── context/                   # React context providers
├── helper/                    # Helper functions
├── hoc/                       # Higher-order components
├── hooks/                     # Custom React hooks
├── lib/                       # Library utilities
├── locales/                   # Translation files
├── messages/                  # i18n messages
├── provider/                  # Context providers
├── public/                    # Public static files
├── services/                  # External services
├── supabase/                  # Supabase config & functions
├── types/                     # TypeScript type definitions
└── utils/                     # Utility functions
```

---

## Complete File Catalog

### Root Configuration Files

#### `package.json`
**Purpose:** Node.js project configuration and dependencies  
**Key Information:**
- Project name: `mcm`
- Version: `0.1.0`
- Package manager: Yarn
- Main dependencies: Next.js, React, Supabase, Material-UI, Tailwind CSS
- Scripts: dev, build, start, lint

#### `tsconfig.json`
**Purpose:** TypeScript compiler configuration  
**Key Settings:**
- Target: ES5
- Module: ESNext
- JSX: preserve
- Path aliases: `@/*` maps to root, utils, and types
- Strict mode enabled

#### `next.config.js`
**Purpose:** Next.js framework configuration  
**Configuration:**
- Image domains: Supabase CDN
- API rewrites: Cronitor proxy
- Custom server settings

#### `tailwind.config.ts`
**Purpose:** Tailwind CSS configuration  
**Features:**
- Custom theme extensions
- Animation utilities
- Component styling

#### `postcss.config.js`
**Purpose:** PostCSS configuration for CSS processing  
**Plugins:** Autoprefixer, Tailwind CSS

#### `.eslintrc.json`
**Purpose:** ESLint configuration for code quality  
**Extends:** Next.js recommended rules

#### `components.json`
**Purpose:** shadcn/ui component configuration  
**Usage:** Defines component paths and styling

#### `env.example`
**Purpose:** Environment variables template  
**Contains:** All required environment variables with placeholders  
**Note:** Copy to `.env.local` and fill in actual values

#### `README.md`
**Purpose:** Project documentation and setup instructions

#### `yarn.lock`
**Purpose:** Yarn lockfile for dependency version locking

#### `next-env.d.ts`
**Purpose:** Next.js TypeScript definitions (auto-generated)

---

### Actions Directory (`actions/`)

Server actions for Next.js server-side operations.

#### `actions/send-email/action.tsx`
**Purpose:** Server action for sending emails  
**Usage:** Handles email sending from server components

#### `actions/supabase_auth/action.tsx`
**Purpose:** Server action for Supabase authentication  
**Usage:** Handles auth operations server-side

---

### App Directory (`app/`)

Next.js App Router structure with API routes and pages.

#### Root Layout & Configuration

##### `app/layout.tsx`
**Purpose:** Root layout component for all pages  
**Features:**
- Global providers
- Theme configuration
- Internationalization setup

##### `app/globals.css`
**Purpose:** Global CSS styles  
**Includes:** Tailwind directives, custom styles

##### `app/i18n.js`
**Purpose:** Internationalization configuration  
**Languages:** English, Spanish

##### `app/favicon.ico`
**Purpose:** Site favicon

##### `app/[...not-found]/page.tsx`
**Purpose:** 404 Not Found page handler

#### API Routes (`app/api/`)

All API endpoints for backend operations.

##### Order Management

###### `app/api/orders/route.ts` ⭐ **CRITICAL - ORDER EMAIL FIX**
**Purpose:** Main order placement endpoint  
**Method:** POST  
**Functionality:**
- Creates orders in database
- Calculates totals and discounts
- Creates sales history
- Updates credit audit
- Updates location balance
- Sends order confirmation email (non-blocking)
- Handles sales team assignment

**Key Changes (Order Email Fix):**
- Email sending made non-blocking
- Errors logged but don't fail order
- Improved error handling

**Request Body:**
```typescript
{
  patient_id: number;
  cartArray: CartItem[];
  appliedDiscount: number;
  creditAmount: number;
  cashAmount: number;
  cardAmount: number;
  zelleAmount: number;
  promoCodeData?: PromoCode;
  selectedPatient: Patient;
  selectedLocation: Location;
  selectedSalesPersons: SalesPerson[];
  creditAuditBalance: number;
  newLocationBalance: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  order_id: number;
  message: string;
}
```

###### `app/api/orders/delete/route.ts`
**Purpose:** Delete order endpoint  
**Method:** DELETE  
**Functionality:** Removes order and related records

###### `app/api/orders/update-payment/route.ts`
**Purpose:** Update order payment information  
**Method:** PATCH/PUT  
**Functionality:** Updates payment details for existing orders

##### Email Services

###### `app/api/sendEmail/route.ts`
**Purpose:** Generic email sending endpoint  
**Method:** POST  
**Functionality:**
- Sends emails using templates
- Supports multiple recipients
- Uses `NEXT_PUBLIC_EMAIL_SENDER_URL` environment variable

###### `app/api/sendappointemntemail/route.ts`
**Purpose:** Appointment email sending  
**Method:** POST  
**Functionality:**
- Sends appointment confirmation emails
- Uses edge function for email delivery

###### `app/api/email-reply/webhook/route.ts`
**Purpose:** Email reply webhook handler  
**Method:** POST  
**Functionality:** Processes incoming email replies

##### SMS Services

###### `app/api/send-sms/route.ts`
**Purpose:** SMS sending endpoint  
**Method:** POST  
**Functionality:**
- Sends SMS via AWS SNS
- Supports multiple phone numbers
- Normalizes phone number formats
- Requires: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

##### User Management

###### `app/api/user/route.ts`
**Purpose:** User CRUD operations  
**Methods:** GET, POST  
**Functionality:** Create and retrieve users

###### `app/api/user/delete/route.ts`
**Purpose:** Delete user endpoint  
**Method:** DELETE  
**Functionality:** Removes user accounts

###### `app/api/admin/users/route.ts`
**Purpose:** Admin user management  
**Methods:** GET, POST  
**Functionality:** Admin-level user operations

###### `app/api/admin/users/actions/edit/route.ts`
**Purpose:** Edit user endpoint  
**Method:** PATCH  
**Functionality:** Update user information

###### `app/api/admin/users/actions/delete/route.ts`
**Purpose:** Delete user endpoint (admin)  
**Method:** DELETE  
**Functionality:** Admin user deletion

###### `app/api/admin/users/change-password/route.tsx`
**Purpose:** Password change endpoint  
**Method:** POST  
**Functionality:** Updates user passwords

##### Inventory Management

###### `app/api/inventory/transfer/route.ts`
**Purpose:** Inventory transfer between locations  
**Method:** POST  
**Functionality:** Transfers inventory items

###### `app/api/inventory/assign/route.ts`
**Purpose:** Assign inventory to locations  
**Method:** POST  
**Functionality:** Assigns inventory items

##### Pharmacy Operations

###### `app/api/tools/pharmacy/route.ts`
**Purpose:** Pharmacy CRUD operations  
**Methods:** GET, POST  
**Functionality:** Manage pharmacy records

###### `app/api/tools/pharmacy/[id]/route.ts`
**Purpose:** Individual pharmacy operations  
**Methods:** GET, PUT, DELETE  
**Functionality:** Single pharmacy record operations

##### Specials Management

###### `app/api/tools/specials/[id]/route.ts`
**Purpose:** Special offers management  
**Methods:** GET, POST, PUT, DELETE  
**Functionality:** Manage special promotions

###### `app/api/upload-special/route.ts`
**Purpose:** Upload special images  
**Method:** POST  
**Functionality:** Handles image uploads for specials

##### Profile Management

###### `app/api/update-profile/route.ts`
**Purpose:** Update user profile  
**Method:** POST  
**Functionality:** Updates user profile information

###### `app/api/upload-profile/route.ts`
**Purpose:** Upload profile images  
**Method:** POST  
**Functionality:** Handles profile image uploads

##### Fulfillment System

###### `app/api/fulfillment/requests/route.ts`
**Purpose:** Fulfillment request management  
**Methods:** GET, POST  
**Functionality:** Create and retrieve fulfillment requests

###### `app/api/fulfillment/fulfill/route.ts`
**Purpose:** Fulfill orders  
**Method:** POST  
**Functionality:** Mark orders as fulfilled

###### `app/api/fulfillment/search/route.ts`
**Purpose:** Search fulfillment requests  
**Method:** GET  
**Functionality:** Search and filter fulfillment requests

##### Bonus System

###### `app/api/bonuses/save/route.ts`
**Purpose:** Save bonus configurations  
**Method:** POST  
**Functionality:** Creates bonus configurations

###### `app/api/bonuses/update-paid/route.ts`
**Purpose:** Update bonus payment status  
**Method:** POST  
**Functionality:** Marks bonuses as paid

###### `app/api/bonuses/config-query/route.ts`
**Purpose:** Query bonus configurations  
**Method:** GET  
**Functionality:** Retrieves bonus configs

###### `app/api/bonuses/active-configs/route.ts`
**Purpose:** Get active bonus configurations  
**Method:** GET  
**Functionality:** Returns active bonus configs

##### Sales Team

###### `app/api/sales-team/route.ts`
**Purpose:** Sales team management  
**Methods:** GET, POST  
**Functionality:** Manage sales team records

###### `app/api/sales-team/reset/route.ts`
**Purpose:** Reset sales team  
**Method:** POST  
**Functionality:** Resets sales team data

##### Staff Controls

###### `app/api/controls/staff/create/route.ts`
**Purpose:** Create staff member  
**Method:** POST  
**Functionality:** Adds new staff members

##### Promo Codes

###### `app/api/promocode/validate/route.ts`
**Purpose:** Validate promo codes  
**Method:** POST  
**Functionality:** Validates and applies promo codes

##### Products

###### `app/api/products/category/route.ts`
**Purpose:** Product category operations  
**Methods:** GET, POST  
**Functionality:** Manage product categories

##### Order History

###### `app/api/previous-order-history/route.ts`
**Purpose:** Get order history  
**Method:** GET  
**Functionality:** Retrieves past orders for patients

##### Reminders

###### `app/api/reminder/route.ts` ⭐ **USES EMAIL SERVICE**
**Purpose:** Appointment reminder system  
**Method:** GET  
**Functionality:**
- Fetches upcoming appointments
- Sends reminder emails (2 weeks and 2 days before)
- Uses `EMAIL_SENDER_URL` environment variable
- Requires `INTERNAL_API_KEY` for security

##### Cron Jobs

###### `app/api/cron/send-reports/route.ts`
**Purpose:** Scheduled report sending  
**Method:** GET  
**Functionality:** Sends scheduled reports via email

##### AI Features

###### `app/api/stockpanel-AI/route.ts`
**Purpose:** AI-powered stock panel  
**Method:** GET  
**Functionality:**
- Uses OpenAI API
- Processes inventory data
- Requires `OPENAI_API_KEY`

##### JWT Management

###### `app/api/get-jwt/route.ts`
**Purpose:** Get JWT token  
**Method:** GET  
**Functionality:** Retrieves authentication tokens

#### Pages (`app/[locale]/`)

Internationalized pages using Next.js App Router.

**Locale Structure:**
- `en/` - English pages
- `es/` - Spanish pages

**Key Page Routes:**
- `/pos/sales` - Point of Sale interface
- `/pos/history` - Sales history
- `/patients` - Patient management
- `/appointments` - Appointment scheduling
- `/inventory` - Inventory management
- `/pharmacy` - Pharmacy operations
- `/dashboard` - Main dashboard
- `/settings` - System settings
- `/bonus` - Bonus management
- `/credits` - Credit management
- `/tools` - Administrative tools

---

### Components Directory (`components/`)

React components organized by feature.

#### UI Components (`components/ui/`)

shadcn/ui component library.

**Files:**
- `alert-dialog.tsx` - Alert dialog component
- `button.tsx` - Button component
- `calendar.tsx` - Calendar picker
- `card.tsx` - Card container
- `chart.tsx` - Chart component
- `checkbox.tsx` - Checkbox input
- `dialog.tsx` - Modal dialog
- `dropdown-menu.tsx` - Dropdown menu
- `form.tsx` - Form wrapper
- `input.tsx` - Text input
- `label.tsx` - Form label
- `popover.tsx` - Popover component
- `radio-group.tsx` - Radio button group
- `scroll-area.tsx` - Scrollable area
- `select.tsx` - Select dropdown
- `sheet.tsx` - Side sheet
- `skeleton.tsx` - Loading skeleton
- `slider.tsx` - Slider input
- `sonner.tsx` - Toast notifications
- `table.tsx` - Table component
- `tabs.tsx` - Tab navigation
- `textarea.tsx` - Textarea input

#### POS Components (`components/POS/`)

Point of Sale system components.

**Files:**
- `PosFields.tsx` - POS form fields
- `Product.tsx` - Product display component
- `ProductListModal.tsx` - Product selection modal

#### Appointment Components (`components/Appointment/`)

Appointment management components.

**Files:**
- `Add_Appointment_Modal/index.tsx` - Add appointment modal
- `Add_Appointment_Modal/ScheduleDateTime.tsx` - Date/time picker
- `Appointment_Edit/` - Edit appointment components
- `Appointment-table.tsx` - Appointment table
- `ApprovedAppointmentModal.tsx` - Approval modal
- `ComingBackTable.tsx` - Returning patients table
- `DeleteConfirmationModal.tsx` - Delete confirmation
- `Appointment-details/Appointment-Details.tsx` - Details view

#### Patient Components (`components/Patient_Table_Component/`)

Patient management components.

**Files:**
- `index.tsx` - Main patient table
- `edit-patient.modal.tsx` - Edit patient modal

#### Email Templates (`components/EmailTemplate/`)

Email template components for React Email.

**Files:**
- `template1.tsx` through `template10.tsx` - Email templates
- Templates use `@react-email/components`
- Support dynamic content injection

#### Sales History (`components/salesHistory/`)

Sales history and order components.

**Files:**
- `OrderDetailsModal.tsx` - Order details modal
- `PatientDetailsRender.tsx` - Patient info display
- `PatientPreviousRecord.tsx` - Previous orders
- `ReturnProductSection.tsx` - Return handling
- `RenderRow.tsx` - Table row renderer
- `utils/index.ts` - Utility functions
- `types/interfaces.ts` - TypeScript interfaces

#### Profile Components (`components/Profile/`)

User profile components.

**Files:**
- `ProfileHeader.tsx` - Profile header
- `ProfileSection.tsx` - Profile sections
- `Cards/` - Various stat cards:
  - `AgeByGender.tsx`
  - `Card3.tsx`, `Card4.tsx`
  - `PageFansRemove.tsx`
  - `PageImpression.tsx`
  - `PageLikes.tsx`
  - `PagePostEnagagement.tsx`
  - `PostClickLikes.tsx`
  - `TotalPage.tsx`
  - `TotalPageFans.tsx`
  - `TotalViews.tsx`

#### User Management (`components/UserManagementComponents/`)

User administration components.

**Files:**
- `index.tsx` - Main user management
- `UserManagement.tsx` - User management logic
- `AddEditUserModal.tsx` - User add/edit modal
- `LocationModal.tsx` - Location assignment modal

#### Pharmacy Components (`components/PharmacyComponents/`)

Pharmacy management components.

**Files:**
- `PharmacyList.tsx` - Pharmacy listing
- `AddEditPharmacyModal.tsx` - Pharmacy form modal

#### Sidebar (`components/Sidebar/`)

Navigation sidebar components.

**Files:**
- `index.tsx` - Main sidebar
- `SidebarPanel.tsx` - Sidebar panel
- `Clinic.tsx` - Clinic selector
- `ChangeLocationModal.tsx` - Location change modal
- `constant.tsx` - Sidebar constants

#### Other Components

**Files:**
- `Action_Button.tsx` - Action button component
- `BonusFilterSheet.tsx` - Bonus filtering
- `BonusSummaryCards.tsx` - Bonus summary display
- `ExportPDF/index.tsx` - PDF export functionality
- `ExportPDF/DateRangeModal.tsx` - Date range picker
- `ExportPDF/pdfHelpers.ts` - PDF helper functions
- `Feedbacks/PrivateFeedback.tsx` - Feedback component
- `Form_Component.tsx` - Form wrapper
- `Input_Component/index.tsx` - Input wrapper
- `Inputs_fields.tsx/Password_Input.tsx` - Password input
- `Inventory/TransferUnits.tsx` - Inventory transfer
- `LanguageChanger.js` - Language switcher
- `LanguageChanger2.js` - Alternative language switcher
- `Location_Component/index.tsx` - Location selector
- `login-form.tsx` - Login form
- `Modal_Components/Custom_Modal.tsx` - Custom modal
- `Modal_Components/ConfirmDeleteModal.tsx` - Delete confirmation
- `modals/DiscountModal.tsx` - Discount modal
- `Navbar/index.tsx` - Navigation bar
- `Navbar/MenuWithAvatar.tsx` - User menu
- `PhoneNumberInput/index.tsx` - Phone input
- `Price_Input/index.tsx` - Price input
- `PromoCodeComponent/index.tsx` - Promo code component
- `PromoCodeComponent/PromoCodeModal.tsx` - Promo code modal
- `Quantity_Field/index.tsx` - Quantity input
- `RangeDatePicker.tsx` - Date range picker
- `Rating_Component/Render_Rating.tsx` - Rating display
- `ResponsiveStatsCard.tsx` - Stats card component
- `Returns/Returns.tsx` - Returns management
- `RolesAndPermissionsComponents/index.tsx` - Roles management
- `RolesAndPermissionsComponents/PermissionToggle.tsx` - Permission toggle
- `RolesAndPermissionsComponents/RoleInput.tsx` - Role input
- `RootLayoutComponent/index.tsx` - Root layout wrapper
- `Searchable_Dropdown/index.tsx` - Searchable dropdown
- `Select_Dropdown/index.tsx` - Select dropdown
- `SetPasswordComponent/index.tsx` - Password set component
- `SettingsComponent.tsx` - Settings component
- `sliderComp.tsx` - Slider component
- `StockAlerts/index.tsx` - Stock alert component
- `TableComponent/index.tsx` - Table wrapper
- `Themetoggle.tsx` - Theme toggle
- `TranslationsProvider.js` - Translation provider
- `WebsiteContent/Home.tsx` - Website content editor
- `index.tsx` - Component exports

---

### Context Directory (`context/`)

React Context providers for global state.

#### `context/AuthContext.tsx`
**Purpose:** Authentication context  
**Provides:** User authentication state, login/logout functions

#### `context/LocationContext.tsx`
**Purpose:** Location context  
**Provides:** Selected location, location switching

#### `context/ActiveTabContext.tsx`
**Purpose:** Active tab context  
**Provides:** Current active tab state

#### `context/index.tsx`
**Purpose:** Context exports and providers wrapper

---

### Hooks Directory (`hooks/`)

Custom React hooks for data fetching and state management.

#### `hooks/useCategoriesClinica.tsx`
**Purpose:** Fetch product categories  
**Returns:** Categories data and loading state

#### `hooks/useLocationClinica.tsx`
**Purpose:** Fetch locations  
**Returns:** Locations data and loading state

#### `hooks/useMasterProductsClinica.tsx`
**Purpose:** Fetch master products  
**Returns:** Master products data

#### `hooks/useProductsClinica.tsx`
**Purpose:** Fetch products  
**Returns:** Products data and loading state

#### `hooks/useServicesClinica.tsx`
**Purpose:** Fetch services  
**Returns:** Services data

#### `hooks/useRolesAndPermissions.tsx`
**Purpose:** Fetch roles and permissions  
**Returns:** Roles, permissions, and management functions

#### `hooks/useSingleRowDataHandle.tsx`
**Purpose:** Single row data operations  
**Returns:** CRUD operations for single records

---

### Utils Directory (`utils/`)

Utility functions and helpers.

#### Email Services (`utils/emailServices/`)

##### `utils/emailServices/sendOrderEmail.ts` ⭐ **CRITICAL - ORDER EMAIL FIX**
**Purpose:** Send order confirmation emails  
**Function:** `sendOrderEmail()`

**Parameters:**
- `orderDetails`: Order information
- `patientInfo`: Patient details
- `orderItems`: Cart items
- `totalAmount`: Subtotal
- `discountAmount`: Discount value
- `appliedDiscount`: Discount percentage
- `previousCreditAmount`: Previous balance
- `newCreditBalance`: New balance

**Key Changes (Order Email Fix):**
- ✅ Uses `NEXT_PUBLIC_EMAIL_SENDER_URL` environment variable
- ✅ Validates response before JSON parsing
- ✅ Checks content-type header
- ✅ Handles HTML error responses gracefully
- ✅ Provides descriptive error messages
- ✅ Detects placeholder values

**Email Template:**
- Invoice format with order details
- Payment method display
- Credit balance information
- Feedback link with order ID

##### `utils/emailServices/sendFulfillmentRequestEmail.ts`
**Purpose:** Send fulfillment request emails  
**Function:** `sendFulfillmentRequestEmail()`

**Key Changes:**
- ✅ Uses `NEXT_PUBLIC_EMAIL_SENDER_URL` environment variable
- ✅ Placeholder detection added

##### `utils/emailServices/sendFulfillmentConfirmationEmail.ts`
**Purpose:** Send fulfillment confirmation emails  
**Function:** `sendFulfillmentConfirmationEmail()`

**Key Changes:**
- ✅ Uses `NEXT_PUBLIC_EMAIL_SENDER_URL` environment variable
- ✅ Placeholder detection added

#### Email Service (`utils/emailService/`)

##### `utils/emailService/index.ts`
**Purpose:** Generic email service  
**Functionality:** Sends emails using templates  
**Uses:** `NEXT_PUBLIC_EMAIL_SENDER_URL`

##### `utils/emailService/templateDetails.ts`
**Purpose:** Email template configuration  
**Functionality:** Defines template metadata

#### Supabase Utilities (`utils/supabase/`)

##### `utils/supabase/client.tsx`
**Purpose:** Browser Supabase client  
**Function:** `createClient()` - Creates browser-side Supabase client

##### `utils/supabase/server.tsx`
**Purpose:** Server Supabase client  
**Function:** `createClient()` - Creates server-side Supabase client with cookies

##### `utils/supabase/middleware.tsx`
**Purpose:** Supabase middleware for Next.js  
**Functionality:** Handles auth in middleware

##### `utils/supabase/data_services/data_services.tsx`
**Purpose:** Data service layer for Supabase  
**Functions:**
- `fetch_content_service()` - Generic fetch
- `create_content_service()` - Generic create
- `update_content_service()` - Generic update
- `delete_content_service()` - Generic delete
- `fetchLocations()` - Fetch locations
- `getUserAllowedLocations()` - Get user locations
- `fetchApprovedAppointmentsByLocation()` - Get appointments
- `fetchUnapprovedAppointmentsByLocation()` - Get pending appointments
- `ApproveAppointment()` - Approve appointment

#### Other Utilities

##### `utils/supabaseClient.ts`
**Purpose:** Legacy Supabase client  
**Functionality:** Direct Supabase client instance

##### `utils/smsServices/sendInvoice.ts`
**Purpose:** Send invoice via SMS  
**Functionality:** SMS invoice delivery

##### `utils/sales/totalSales.ts`
**Purpose:** Calculate total sales  
**Functionality:** Sales calculation utilities

##### `utils/facebook.ts`
**Purpose:** Facebook integration  
**Functionality:** Facebook API utilities

##### `utils/cart/cart.ts`
**Purpose:** Cart management utilities  
**Functionality:** Cart operations and calculations

##### `utils/appointment.helper.ts`
**Purpose:** Appointment helper functions  
**Functionality:** Appointment-related utilities

##### `utils/validationCheck.ts`
**Purpose:** Validation utilities  
**Functionality:** Form and data validation

##### `utils/translationConstants.ts`
**Purpose:** Translation constants  
**Functionality:** i18n constant definitions

##### `utils/getCountryName.tsx`
**Purpose:** Country name utilities  
**Functionality:** Country code to name conversion

##### `utils/list_options/dropdown_list_options.tsx`
**Purpose:** Dropdown option generators  
**Functionality:** Creates dropdown options

##### `utils/list_options/fields_list_components.tsx`
**Purpose:** Field list components  
**Functionality:** Dynamic field list generation

##### `utils/countries.json`
**Purpose:** Country data  
**Content:** Country codes and names

##### `utils/getLanguageName.json`
**Purpose:** Language data  
**Content:** Language codes and names

---

### Services Directory (`services/`)

External service integrations.

#### `services/supabase.tsx`
**Purpose:** Supabase service client  
**Functionality:** Main Supabase client instance  
**Uses:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Types Directory (`types/`)

TypeScript type definitions.

#### `types/supabase.ts`
**Purpose:** Supabase database types  
**Content:** Generated types from Supabase schema

#### `types/typesInterfaces.ts`
**Purpose:** General type interfaces  
**Content:** Shared TypeScript interfaces

#### `types/patient.interface.ts`
**Purpose:** Patient type definitions  
**Content:** Patient-related interfaces

#### `types/patient-table.interface.ts`
**Purpose:** Patient table types  
**Content:** Table-specific patient types

#### `types/appointment.interface.ts`
**Purpose:** Appointment type definitions  
**Content:** Appointment-related interfaces

#### `types/dashboard.interface.ts`
**Purpose:** Dashboard type definitions  
**Content:** Dashboard data types

#### `types/pharmacy.ts`
**Purpose:** Pharmacy type definitions  
**Content:** Pharmacy-related types

---

### Helper Directory (`helper/`)

Helper functions.

#### `helper/common_functions.tsx`
**Purpose:** Common utility functions  
**Functions:**
- `currencyFormatHandle()` - Currency formatting
- Other shared utilities

---

### HOC Directory (`hoc/`)

Higher-order components.

#### `hoc/withAuthorization.tsx`
**Purpose:** Authorization HOC  
**Functionality:** Wraps components with auth checks

---

### Provider Directory (`provider/`)

Context providers.

#### `provider/ThemeProvider.tsx`
**Purpose:** Theme context provider  
**Functionality:** Manages light/dark theme

---

### Locales Directory (`locales/`)

Translation files organized by language.

#### English (`locales/en/`)
**Files:**
- `Appoinments.json` - Appointment translations
- `bonus.json` - Bonus translations
- `Control.json`, `Controls.json` - Control translations
- `Credits.json` - Credit translations
- `Dashboard.json` - Dashboard translations
- `EmailB.json` - Email broadcast translations
- `Header.json` - Header translations
- `IndividualBonus.json` - Individual bonus translations
- `Inventory.json` - Inventory translations
- `Login.json`, `Logout.json` - Auth translations
- `Patients.json` - Patient translations
- `Pharmacy.json` - Pharmacy translations
- `POS.json`, `POS-History.json`, `POS-Return.json`, `POS-Sales.json` - POS translations
- `Privatefeedback.json` - Feedback translations
- `Procode.json` - Promo code translations
- `Profile.json` - Profile translations
- `Return.json` - Return translations
- `Rolesandper.json`, `RolesandPermissions.json` - Role translations
- `Settings.json` - Settings translations
- `Sidebar.json` - Sidebar translations
- `Specials.json` - Specials translations
- `Stockpanel.json` - Stock panel translations
- `Transaction.json` - Transaction translations
- `Usermanagement.json` - User management translations
- `Warehouse-cat.json`, `Warehouse-prod.json` - Warehouse translations
- `WebCont.json` - Web content translations

#### Spanish (`locales/es/`)
**Files:** Same structure as English, with Spanish translations

---

### Messages Directory (`messages/`)

i18n message files.

#### `messages/en.json`
**Purpose:** English messages  
**Content:** English translation strings

#### `messages/es.json`
**Purpose:** Spanish messages  
**Content:** Spanish translation strings

---

### Public Directory (`public/`)

Static files served directly.

**Files:**
- `favicon.ico` - Site favicon
- `next.svg`, `vercel.svg` - Brand assets
- `assets/` - Additional static assets

---

### Supabase Directory (`supabase/`)

Supabase configuration and functions.

#### `supabase/config.toml`
**Purpose:** Supabase project configuration  
**Content:** Project settings, API keys, database config

#### `supabase/functions/send-email/`
**Purpose:** Supabase Edge Function for email  
**Files:**
- `index.ts` - Edge function code
- `deno.json` - Deno configuration

#### `supabase/migrations/`
**Purpose:** Database migration files  
**Files:** SQL migration scripts (5 files)

---

### Root Files

#### `middleware.ts`
**Purpose:** Next.js middleware  
**Functionality:**
- Authentication checks
- Internationalization routing
- Session management
- Uses Supabase auth

#### `navigation.js`
**Purpose:** Navigation configuration  
**Functionality:** Defines navigation structure

#### `i18n.js`
**Purpose:** i18n configuration  
**Functionality:** Internationalization setup

#### `i18config.js`
**Purpose:** i18n router configuration  
**Functionality:** Next.js i18n router config

#### `data.ts`
**Purpose:** Static data definitions  
**Content:** Application constants and static data

#### `us-states.ts`
**Purpose:** US states data  
**Content:** State codes and names

#### `test-email-service.js`
**Purpose:** Email service testing script  
**Functionality:** Tests email service connectivity

---

## Order Email System Fix

### Problem Summary

**Original Error:**
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
POST /api/orders 500 in 5127ms
```

**Root Causes:**
1. JSON parsing error when email service returned HTML
2. Hardcoded email service URL (Heroku app that no longer exists)
3. Blocking email sending causing order failures

### Files Modified

#### 1. `app/api/orders/route.ts`
**Changes:**
- Made email sending non-blocking (removed `await`)
- Added error logging for email failures
- Orders now complete even if email fails

**Before:**
```typescript
await sendOrderEmail(...); // Blocks order completion
```

**After:**
```typescript
sendOrderEmail(...).catch((error) => {
  console.error(`Failed to send email:`, error.message);
}); // Non-blocking, order completes immediately
```

#### 2. `utils/emailServices/sendOrderEmail.ts`
**Changes:**
- Added response validation before JSON parsing
- Replaced hardcoded URL with `NEXT_PUBLIC_EMAIL_SENDER_URL`
- Added placeholder detection
- Improved error handling

**Key Improvements:**
```typescript
// Check response status and content-type
const contentType = response.headers.get('content-type') || '';
const isJson = contentType.includes('application/json');

if (!response.ok) {
  const errorText = await response.text(); // Read as text first
  // Handle based on content-type
}

// Only parse JSON if content-type indicates JSON
if (isJson) {
  result = await response.json();
} else {
  throw new Error('Non-JSON response received');
}
```

#### 3. `utils/emailServices/sendFulfillmentRequestEmail.ts`
**Changes:**
- Replaced hardcoded URL with environment variable
- Added placeholder detection

#### 4. `utils/emailServices/sendFulfillmentConfirmationEmail.ts`
**Changes:**
- Replaced hardcoded URL with environment variable
- Added placeholder detection

### Environment Configuration

**Required Variable:**
```env
NEXT_PUBLIC_EMAIL_SENDER_URL=https://dcmuw7ynmodbsa6ndhrlnwwhrq0klfun.lambda-url.us-east-2.on.aws/
```

**Note:** URL should end with `/` for proper endpoint construction.

### Testing

**Test Scenarios:**
1. ✅ Successful email sending
2. ✅ Email service down (order still completes)
3. ✅ Invalid email service URL (clear error message)
4. ✅ Placeholder value detected (helpful error)

---

## Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 14.2.35 (App Router)
- React 18.3.1
- TypeScript 5
- Tailwind CSS 3.3.0
- Material-UI 5.15.19
- shadcn/ui components

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth)
- AWS Lambda (Email service)
- AWS SNS (SMS service)

**State Management:**
- React Context API
- React Hooks
- Server Components

**Internationalization:**
- next-intl 3.26.5
- i18next 24.2.2
- next-i18n-router 5.5.1

**Styling:**
- Tailwind CSS
- CSS Modules
- Styled Components
- Material-UI

### Data Flow

```
User Action (Frontend)
    ↓
API Route (Next.js)
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
Response
    ↓
Frontend Update
```

### Authentication Flow

```
User Login
    ↓
Supabase Auth
    ↓
JWT Token
    ↓
Middleware Validation
    ↓
Protected Routes
```

---

## Configuration Files

### Environment Variables

**Required Variables (from `env.example`):**

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_URL` - Server-side Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` - Public service key (if needed)

#### Email
- `SENDER_BROADCAST_EMAIL` - Sender email address
- `REPLY_TO_EMAIL` - Reply-to email address
- `EMAIL_SENDER_URL` - Email service URL (server-side)
- `NEXT_PUBLIC_EMAIL_SENDER_URL` - Email service URL (client-side) ⭐

#### AWS (SMS)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

#### Security
- `INTERNAL_API_KEY` - Internal API key for secure endpoints

#### AI
- `OPENAI_API_KEY` - OpenAI API key

#### Website
- `NEXT_PUBLIC_USER_WEBSITE` - Public website URL

---

## Dependencies & Technologies

### Core Dependencies

**Framework:**
- `next@14.2.35` - React framework
- `react@18.3.1` - UI library
- `react-dom@18.3.1` - React DOM renderer

**Database & Auth:**
- `@supabase/supabase-js@2.47.6` - Supabase client
- `@supabase/ssr@0.1.0` - Supabase SSR
- `@supabase/auth-helpers-nextjs@0.10.0` - Auth helpers

**UI Libraries:**
- `@mui/material@5.15.19` - Material-UI
- `@radix-ui/*` - Headless UI components
- `tailwindcss@3.3.0` - Utility-first CSS
- `lucide-react@0.544.0` - Icons

**Forms & Validation:**
- `react-hook-form@7.52.2` - Form management
- `zod@3.24.4` - Schema validation

**Date Handling:**
- `moment@2.30.1` - Date manipulation
- `moment-timezone@0.5.46` - Timezone support
- `date-fns@3.6.0` - Date utilities
- `react-datepicker@7.3.0` - Date picker

**HTTP & API:**
- `axios@1.7.2` - HTTP client
- `@aws-sdk/client-sns@3.772.0` - AWS SNS client

**Email:**
- `@react-email/components@0.0.22` - Email templates
- `nodemailer@6.9.14` - Email sending

**Internationalization:**
- `next-intl@3.26.5` - Next.js i18n
- `i18next@24.2.2` - i18n framework
- `react-i18next@15.4.1` - React i18n

**PDF Generation:**
- `jspdf@2.5.2` - PDF creation
- `jspdf-autotable@3.8.4` - PDF tables

**Charts:**
- `recharts@2.15.4` - Chart library

**Rich Text:**
- `@tiptap/react@2.12.0` - Rich text editor
- `react-quill@2.0.0` - Quill editor
- `@tinymce/tinymce-react@6.1.0` - TinyMCE editor

**Notifications:**
- `react-toastify@10.0.5` - Toast notifications
- `sonner@2.0.1` - Toast library

**Utilities:**
- `lodash@4.17.21` - Utility functions
- `clsx@2.1.1` - Class name utility
- `class-variance-authority@0.7.1` - Component variants

---

## API Endpoints Summary

### Order Management
- `POST /api/orders` - Create order ⭐
- `DELETE /api/orders` - Delete order
- `PATCH /api/orders/update-payment` - Update payment

### Email Services
- `POST /api/sendEmail` - Send generic email
- `POST /api/sendappointemntemail` - Send appointment email
- `POST /api/email-reply/webhook` - Email reply webhook

### SMS Services
- `POST /api/send-sms` - Send SMS

### User Management
- `GET|POST /api/user` - User operations
- `DELETE /api/user/delete` - Delete user
- `GET|POST /api/admin/users` - Admin user operations
- `PATCH /api/admin/users/actions/edit` - Edit user
- `DELETE /api/admin/users/actions/delete` - Delete user
- `POST /api/admin/users/change-password` - Change password

### Inventory
- `POST /api/inventory/transfer` - Transfer inventory
- `POST /api/inventory/assign` - Assign inventory

### Pharmacy
- `GET|POST /api/tools/pharmacy` - Pharmacy operations
- `GET|PUT|DELETE /api/tools/pharmacy/[id]` - Single pharmacy

### Specials
- `GET|POST|PUT|DELETE /api/tools/specials/[id]` - Specials management
- `POST /api/upload-special` - Upload special image

### Profile
- `POST /api/update-profile` - Update profile
- `POST /api/upload-profile` - Upload profile image

### Fulfillment
- `GET|POST /api/fulfillment/requests` - Fulfillment requests
- `POST /api/fulfillment/fulfill` - Fulfill order
- `GET /api/fulfillment/search` - Search fulfillment

### Bonus System
- `POST /api/bonuses/save` - Save bonus config
- `POST /api/bonuses/update-paid` - Update bonus payment
- `GET /api/bonuses/config-query` - Query bonus configs
- `GET /api/bonuses/active-configs` - Get active configs

### Sales Team
- `GET|POST /api/sales-team` - Sales team operations
- `POST /api/sales-team/reset` - Reset sales team

### Other
- `POST /api/controls/staff/create` - Create staff
- `POST /api/promocode/validate` - Validate promo code
- `GET|POST /api/products/category` - Product categories
- `GET /api/previous-order-history` - Order history
- `GET /api/reminder` - Appointment reminders
- `GET /api/cron/send-reports` - Scheduled reports
- `GET /api/stockpanel-AI` - AI stock panel
- `GET /api/get-jwt` - Get JWT token

---

## Development Workflow

### Setup

1. **Install Dependencies:**
   ```bash
   yarn install
   ```

2. **Configure Environment:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with actual values
   ```

3. **Start Development Server:**
   ```bash
   yarn dev
   ```

4. **Build for Production:**
   ```bash
   yarn build
   ```

5. **Start Production Server:**
   ```bash
   yarn start
   ```

### Code Structure Guidelines

- **Components:** Use TypeScript, functional components with hooks
- **API Routes:** Use Next.js App Router API routes
- **Styling:** Prefer Tailwind CSS, use CSS modules when needed
- **State:** Use Context API for global state, hooks for local state
- **Data Fetching:** Use custom hooks or server components
- **Types:** Define in `types/` directory
- **Utils:** Place in `utils/` directory

### Best Practices

1. **Environment Variables:**
   - Use `NEXT_PUBLIC_` prefix for client-accessible variables
   - Never commit `.env.local`
   - Use `env.example` as template

2. **Error Handling:**
   - Always handle errors in API routes
   - Provide meaningful error messages
   - Log errors for debugging

3. **Type Safety:**
   - Use TypeScript strictly
   - Define interfaces for all data structures
   - Avoid `any` type when possible

4. **Internationalization:**
   - Use translation keys from `locales/`
   - Support both English and Spanish
   - Test both languages

5. **Performance:**
   - Use server components when possible
   - Implement proper loading states
   - Optimize images and assets

---

## Database Schema (Inferred)

Based on code usage, key tables include:

- `orders` - Order records
- `sales_history` - Sales transactions
- `allpatients` - Patient records
- `Appoinments` - Appointment records
- `inventory` - Inventory items
- `Locations` - Clinic locations
- `credit_audit` - Credit balance tracking
- `transaction_history` - Transaction records
- `discounts` - Discount records
- `sales_team` - Sales team assignments
- `pharmacy` - Pharmacy records
- `special_picture` - Special offers
- `user_locations` - User location assignments
- `fulfillment_requests` - Fulfillment orders

---

## Security Considerations

1. **Environment Variables:**
   - Never expose service role keys to client
   - Use `NEXT_PUBLIC_` only for safe public variables
   - Keep secrets in `.env.local` (gitignored)

2. **API Security:**
   - Validate all inputs
   - Use authentication middleware
   - Implement rate limiting where needed
   - Use `INTERNAL_API_KEY` for sensitive endpoints

3. **Database:**
   - Use Row Level Security (RLS) in Supabase
   - Validate user permissions
   - Sanitize all queries

---

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading:**
   - Restart dev server
   - Clear `.next` cache
   - Verify `.env.local` exists
   - Check variable names (case-sensitive)

2. **Email Not Sending:**
   - Verify `NEXT_PUBLIC_EMAIL_SENDER_URL` is set
   - Check email service is accessible
   - Review error logs
   - Test email service endpoint directly

3. **Build Errors:**
   - Clear `.next` folder
   - Delete `node_modules` and reinstall
   - Check TypeScript errors
   - Verify all dependencies installed

4. **Authentication Issues:**
   - Verify Supabase credentials
   - Check session cookies
   - Review middleware configuration
   - Test Supabase connection

---

## Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Material-UI:** https://mui.com/
- **shadcn/ui:** https://ui.shadcn.com/

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team  
**Status:** ✅ Complete

---

## Quick Reference

### Key Files for Order Email System

1. **Order Creation:** `app/api/orders/route.ts`
2. **Email Sending:** `utils/emailServices/sendOrderEmail.ts`
3. **Environment Config:** `.env.local` (create from `env.example`)
4. **Frontend Order:** `app/[locale]/(root)/(childroot)/pos/(root)/sales/(root)/page.tsx`

### Critical Environment Variables

- `NEXT_PUBLIC_EMAIL_SENDER_URL` - Email service endpoint
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Important Notes

- Email sending is **non-blocking** - orders complete even if email fails
- All email functions use environment variables (no hardcoded URLs)
- Placeholder values are detected and reported
- Response validation prevents JSON parsing errors

---

**End of Documentation**





###