# SwiftBill | Smart Invoice & Billing SaaS

SwiftBill is a premium, high-performance Invoice and Billing management platform designed for freelancers, agencies, and small businesses. It provides a seamless experience for generating professional invoices, tracking payments, and managing client relationships.

## 🚀 Key Features

- **Intuitive Dashboard**: Real-time stats on total revenue, pending payments, and growth charts.
- **Smart Invoice Generation**: Professional PDF generation with multiple templates (Modern, Minimal, Classic, Custom).
- **Branding Control**: Fully customizable business profiles with logo uploads and custom primary/accent colors.
- **Automated Calculations**: Server-verified totals with built-in GST/Tax support.
- **Payment Lifecycle**: Track invoices from "Unpaid" to "Paid" with manual settle controls.
- **Smart Reminders**: Send automated tracking pings to your client list.
- **Instant Sharing**: Direct sharing via WhatsApp and Email with pre-filled professional templates.
- **Secure Architecture**: Built on Supabase with row-level security ensuring your data stays yours.

## 🛠 Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS (v4)
- **Backend & Auth**: Supabase (PostgreSQL)
- **State/Routing**: React Context, React Router v7
- **UI & Motion**: Framer Motion, Lucide Icons, Chart.js
- **PDF Engine**: html2pdf.js

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js installed
- A Supabase project (Free or Pro)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

## 🗄 Supabase Database Setup

### Table: `profiles`
The `profiles` table stores business-specific branding information.
- Enable RLS: `FOR ALL` operations restricted to `auth.uid() = id`.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (Primary Key) | Link to `auth.users` |
| `business_name` | Text | Display name of the business |
| `business_logo` | Text | URL to logo image |
| `address` | Text | Full business address |
| `primary_color` | Text | Hex color code for branding |
| `gst_number` | Text | Optional Tax ID |

### Table: `invoices`
The `invoices` table stores all generated billing records.
- Enable RLS: `FOR ALL` operations restricted to `auth.uid() = user_id`.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (Primary Key) | Unique Invoice identifier |
| `user_id` | UUID | Reference to `profiles.id` |
| `invoice_no` | Text | Sequential ID (e.g. INV-001) |
| `client_name` | Text | Recipient name |
| `total_amount` | Numeric | Grand total after tax |
| `items` | JSONB | Array of objects `{ name, quantity, price }` |
| `status` | Text | 'paid' or 'unpaid' |

## 📐 Professional Usage

1. **Dashboard**: Monitor your "Priority Actions" section for invoices due within 7 days.
2. **Settings**: First, navigate to Settings to upload your logo and set your business address. This data appears automatically on every invoice.
3. **Drafting**: Use the "Create Invoice" screen to add line items. Switch between templates ("Minimal" for clean looks, "Modern" for color) and click "Save".
4. **Action**: From the History screen, use the **Bell** icon to send a reminder or the **Receipt** icon to download the high-res PDF.

## 🔮 Future Roadmap

- **SaaS Multi-Currency**: Global currency support.
- **Payment Integration**: Stripe/PayPal links directly embedded in PDFs.
- **Client Portal**: Allow clients to view all their historic invoices via a secure link.
- **AI Receipts**: Automatically extract invoice items from uploaded receipt photos.

---
*SwiftBill - Professional Invoicing, simplified.*
