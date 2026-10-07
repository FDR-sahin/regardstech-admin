# 🚀 Regards Tech - Enterprise Admin Panel & MVC Backend

Regards Tech-এর জন্য প্রস্তুতকৃত একটি শক্তিশালী, সুরক্ষিত ও প্রডাকশন-গ্রেড **Admin Panel** এবং **Node.js/Express MVC Backend REST API**। এটি আপনার বর্তমান ওয়েবসাইট (**https://regardstech.com/**)-এর সাথে সরাসরি ইন্টিগ্রেশনের জন্য তৈরি।

---

## 🛠️ VS Code-এ ইনস্টল ও রান করার নিয়ম (Installation & Run Guide)

### ১. PowerShell / Terminal-এ `npm install` সমাধান:
যদি আপনি `npm install` দেওয়ার সময় `ERESOLVE could not resolve esbuild/vite` ইরোর পেয়ে থাকেন, তবে চিন্তা করবেন না! প্রজেক্টে ইতিমধ্যে `.npmrc` কনফিগার করা আছে। আপনি নিচের যেকোনো একটি কমান্ড দিয়ে ইনস্টল করতে পারেন:

```bash
# অপশন ১ (রেকমেন্ডেড):
npm install --legacy-peer-deps

# অথবা অপশন ২:
npm install
```

### ২. সার্ভার চালু করুন (Start Server):
ডিপেনডেন্সি ইনস্টল সম্পন্ন হলে টার্মিনালে রান করুন:

```bash
npm run dev
```

সার্ভার সফলভাবে চালু হলে টার্মিনালে দেখতে পাবেন:
```text
🚀 Regards Tech Enterprise Server running on http://localhost:3000
👉 Admin Console: http://localhost:3000
📡 REST API: http://localhost:3000/api
```

### ৩. ব্রাউজারে এডমিন প্যানেল ওপেন করুন:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 এডমিন লগইন তথ্য (Admin Credentials)

### 👑 Super Admin (আপনার প্রধান একাউন্ট):
- **Email**: `sahinfdr89@gmail.com`
- **Password**: `Admin@12345!`
- **Role**: Super Admin (সম্পূর্ণ সিস্টেম নিয়ন্ত্রণ, ড্যাশবোর্ড, প্রজেক্ট, সার্ভিস, ব্লগ, কেস স্টাডি, ভিজিটর এনালাইটিক্স, মেসেজ, অন্যান্য এডমিন পরিচালনা)

### 📧 ইমেইল ভেরিফিকেশন ও পাসওয়ার্ড রিসেট OTP সিস্টেম:
- **Email Verification**: লগইন করার সময় ইমেইল ভেরিফাইড না থাকলে স্বয়ংক্রিয়ভাবে ৬-সংখ্যার OTP কোড ডিসপ্যাচ হবে। আপনি কোড প্রবেশ করিয়ে সাথে সাথে একাউন্ট এক্টিভেট করতে পারবেন।
- **Forgot Password / Password Reset**: পাসওয়ার্ড ভুলে গেলে "Forgot Password"-এ আপনার ইমেইল (`sahinfdr89@gmail.com`) দিলে ৬-ডিজিটের ওটিপি (OTP) কোড পাঠানো হবে। ওটিপি ভেরিফাই করে নতুন পাসওয়ার্ড সেট করা যাবে।
- **Email Simulator**: ডেভেলপমেন্ট ও টেস্টিং সুবিধার জন্য এডমিন প্যানেলের বাম পাশের মেনুতে **Email Simulator** রয়েছে, যেখানে পাঠানো সমস্ত ওটিপি ও ভেরিফিকেশন কোড এক ক্লিকে দেখা যায়।

---

## 📁 আর্কিটেকচার ও ফোল্ডার স্ট্রাকচার (MVC Architecture)

আপনার চাহিদা অনুযায়ী প্রজেক্টটি দুটি মূল ভাগে সুবিন্যস্ত:

```text
├── server/                    # 🚀 MVC Backend REST API
│   ├── controllers/           # Business Logic (Auth, Project, Service, Blog, Analytics, Message, Admin)
│   ├── routes/                # Express API Route Handlers (/api/public/*, /api/auth/*, etc.)
│   ├── models/                # TypeScript Interfaces & Schemas (types.ts)
│   ├── config/                # Database Manager & JSON Persistence (db.ts)
│   ├── middleware/            # JWT Auth, Role-based Permission Guard, Rate Limiting, Audit
│   └── services/              # Email & OTP Dispatch Service (emailService.ts)
│
├── src/                       # 💻 Regards Tech Admin Panel UI
│   ├── components/            # Reusable UI, Charts, Modals, Topbar, Sidebar
│   ├── pages/                 # Admin Screens:
│   │   ├── dashboard/         # Executive Overview & Live KPI
│   │   ├── analytics/         # Website Visitor Analytics & Telemetry
│   │   ├── projects/          # Projects & Case Studies Management (CRUD)
│   │   ├── services/          # Services Management (CRUD)
│   │   ├── blogs/             # Blog & Articles CMS (Draft/Publish/SEO)
│   │   ├── testimonials/      # Client Reviews & Testimonials
│   │   ├── messages/          # Contact Form Inquiries & Booking Leads
│   │   ├── admins/            # Multi-Admin & Role-Based Access Control (RBAC)
│   │   ├── audit/             # System Audit Logs & Activity History
│   │   ├── media/             # Media & Image Asset Library
│   │   ├── profile/           # Admin Profile & Password Management
│   │   └── nextjs-hub/        # Live REST API Explorer & Code Generator
│   ├── context/               # AuthContext & ToastContext
│   └── services/              # API Client (api.ts)
│
├── data/
│   └── db.json                # Persistent JSON Database (Admins, Projects, Services, etc.)
│
├── server.ts                  # Server Entry Point (Mounts Express MVC + Vite on Port 3000)
├── .npmrc                     # Auto resolves peer dependencies for VS Code Windows
└── REGARDS_TECH_INTEGRATION_GUIDE.md  # 📖 আপনার ওয়েবসাইটে API ও ট্র্যাকিং যুক্ত করার বিস্তারিত গাইড
```

---

## 📖 আপনার ওয়েবসাইটে কীভাবে API ও Visitor Tracking যুক্ত করবেন?

আপনার **https://regardstech.com/** ওয়েবসাইটে এই ব্যাকএন্ড API এবং ভিজিটর এনালাইটিক্স যুক্ত করার সম্পূর্ণ কোড এবং বিস্তারিত নির্দেশনা রুট ফোল্ডারের **`REGARDS_TECH_INTEGRATION_GUIDE.md`** ফাইলে দেওয়া আছে। 

তাছাড়া এডমিন প্যানেলে লগইন করে বাম মেনু থেকে **"Next.js API Explorer"**-এ গেলেও আপনি লাইভ রিকোয়েস্ট টেস্ট করতে পারবেন এবং তৈরি করা কোড স্নিপেট কপি করতে পারবেন।
