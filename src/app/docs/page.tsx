import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DocsDownloadButton } from "@/components/ui/DocsDownloadButton";
import { ArchitecturePreview } from "@/components/ui/ArchitecturePreview";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-base font-bold mb-3 pb-2" style={{ color: "#0078d4", borderBottom: "2px solid #0078d4" }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2" style={{ color: "#323130" }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

const COL_WIDTHS: Record<number, Record<number, string>> = {
  3: { 0: "22%", 1: "18%", 2: "60%" },
  4: { 0: "18%", 1: "14%", 2: "14%", 3: "54%" },
  2: { 0: "30%", 1: "70%" },
};

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  const widths = COL_WIDTHS[headers.length] ?? {};
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <colgroup>
          {headers.map((_, i) => (
            <col key={i} style={{ width: widths[i] ?? "auto" }} />
          ))}
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "#f3f2f1", borderBottom: "2px solid #edebe9" }}>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c", whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f2f1", backgroundColor: i % 2 === 1 ? "#faf9f8" : "#fff" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-sm align-top" style={{ color: j === 0 ? "#323130" : "#605e5c", wordBreak: "break-word" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 text-xs font-mono" style={{ backgroundColor: "#f3f2f1", color: "#a4262c", border: "1px solid #edebe9" }}>
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed" style={{ backgroundColor: "#1b1b1b", color: "#d4d4d4" }}>
      {children}
    </pre>
  );
}

function Badge({ children, color }: { children: string; color: "blue" | "green" | "yellow" | "red" | "gray" }) {
  const styles = {
    blue: { backgroundColor: "#deecf9", color: "#0078d4" },
    green: { backgroundColor: "#dff6dd", color: "#107c10" },
    yellow: { backgroundColor: "#fff4ce", color: "#8a6914" },
    red: { backgroundColor: "#fde7e9", color: "#a4262c" },
    gray: { backgroundColor: "#f3f2f1", color: "#605e5c" },
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={styles[color]}>
      {children}
    </span>
  );
}

export default async function DocsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const toc = [
    { id: "overview", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "stack", label: "Tech Stack" },
    { id: "file-structure", label: "File Structure" },
    { id: "database", label: "Database Schema" },
    { id: "api", label: "API Reference" },
    { id: "pages", label: "Pages" },
    { id: "components", label: "Components" },
    { id: "lib", label: "Library Modules" },
    { id: "auth", label: "Authentication" },
    { id: "workflows", label: "Workflows" },
    { id: "env", label: "Environment Setup" },
    { id: "devguide", label: "Developer Guide" },
    { id: "changelog", label: "Changelog" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Documentation" subtitle="Complete reference for the STEPv5 WC project" />
        <div className="flex flex-1">

          {/* TOC */}
          <aside className="w-52 shrink-0 p-4 border-r sticky top-0 h-screen overflow-y-auto" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#605e5c" }}>Contents</p>
            <nav className="space-y-0.5">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-2 py-1.5 text-sm transition-colors hover:bg-white"
                  style={{ color: "#605e5c" }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #edebe9" }}>
              <DocsDownloadButton />
            </div>

          </aside>

          {/* Content */}
          <main className="flex-1 p-8 max-w-4xl space-y-10 overflow-y-auto" id="docs-content">

            {/* OVERVIEW */}
            <Section id="overview" title="Overview">
              <Card>
                <CardContent className="py-4 space-y-3">
                  <p className="text-sm" style={{ color: "#323130" }}>
                    <strong>STEPv5 WC</strong> is a centralized multi-site WooCommerce product management tool.
                    It lets you create and manage products in one place, translate them into multiple languages,
                    then sync them out to multiple WooCommerce-powered WordPress sites via the WooCommerce REST API.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { label: "Manage", desc: "Create and edit products centrally" },
                      { label: "Translate", desc: "Auto-translate via LibreTranslate" },
                      { label: "Sync", desc: "Push to multiple WooCommerce stores" },
                    ].map((f) => (
                      <div key={f.label} className="p-3" style={{ border: "1px solid #edebe9", backgroundColor: "#faf9f8" }}>
                        <p className="text-sm font-semibold" style={{ color: "#0078d4" }}>{f.label}</p>
                        <p className="text-xs mt-1" style={{ color: "#605e5c" }}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* ARCHITECTURE */}
            <Section id="architecture" title="Architecture">
              <Card>
                <CardContent className="py-4 space-y-3">
                  <p className="text-sm" style={{ color: "#605e5c" }}>
                    End-to-end integration overview — from the legacy MSSQL database (STEPv4) through the STEPv5 management app to the live WooCommerce storefronts.
                  </p>
                  <ArchitecturePreview />
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { color: "#d13438", label: "MSSQL (STEPv4)", desc: "Live search for employees and products via configurable table mappings" },
                      { color: "#0078d4", label: "STEPv5 App", desc: "Next.js management layer — products, users, sites, sync, settings" },
                      { color: "#7719aa", label: "WooCommerce Sites", desc: "Multiple storefronts synced via WC REST API with per-site credentials" },
                    ].map((f) => (
                      <div key={f.label} className="p-3" style={{ border: `1px solid ${f.color}22`, backgroundColor: `${f.color}08` }}>
                        <p className="text-sm font-semibold" style={{ color: f.color }}>{f.label}</p>
                        <p className="text-xs mt-1" style={{ color: "#605e5c" }}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* TECH STACK */}
            <Section id="stack" title="Tech Stack">
              <Card>
                <CardContent className="py-4">
                  <Table
                    headers={["Category", "Technology", "Version", "Purpose"]}
                    rows={[
                      ["Framework", "Next.js", "15", "App Router, server + client components, API routes"],
                      ["Language", "TypeScript", "5", "Static typing across all files"],
                      ["Styling", "Tailwind CSS", "v4", "Utility-first CSS framework"],
                      ["Icons", "Lucide React", "0.462", "Icon components"],
                      ["ORM", "Prisma", "6", "Database access, schema management, migrations"],
                      ["Database", "PostgreSQL", "16+", "Relational database — local (Postgres.app) or remote (Simply.com)"],
                      ["Auth", "NextAuth.js", "v4", "Session management, credentials login"],
                      ["Passwords", "bcryptjs", "—", "Password hashing"],
                      ["Validation", "Zod", "v3", "Schema validation on API inputs"],
                      ["WooCommerce", "REST API v3", "—", "Product push/pull to remote stores"],
                      ["Translation", "LibreTranslate / MyMemory", "—", "Open-source machine translation API (configurable)"],
                      ["MSSQL", "mssql (node-mssql)", "—", "External Microsoft SQL Server connection for product import"],
                      ["Exchange Rates", "Frankfurter (ECB)", "—", "Free live currency rate API, proxied server-side"],
                      ["Build", "Turbopack", "—", "Fast dev bundler (Next.js built-in)"],
                      ["Scripts", "tsx", "—", "Run TypeScript seed scripts directly"],
                    ]}
                  />
                </CardContent>
              </Card>
            </Section>

            {/* FILE STRUCTURE */}
            <Section id="file-structure" title="File Structure">
              <Card>
                <CardHeader><CardTitle>Project Root</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <CodeBlock>{`stepv5-webshop/
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL provider)
│   ├── seed.ts                # Database seed script
│   └── migrate-from-sqlite.ts # One-time data migration helper
├── public/
│   ├── architecture.svg       # System architecture diagram
│   └── uploads/               # Uploaded images (gitignored)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/page.tsx # Login page
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── images/
│   │   │   │   ├── route.ts              # GET list, POST create image record
│   │   │   │   ├── [id]/route.ts         # GET, PUT, DELETE image
│   │   │   │   └── categories/
│   │   │   │       ├── route.ts          # GET list, POST create category
│   │   │   │       └── [id]/route.ts     # PUT, DELETE category
│   │   │   ├── products/
│   │   │   │   ├── route.ts              # GET list, POST create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts          # GET, PUT, DELETE
│   │   │   │       ├── sync/route.ts     # POST sync to sites
│   │   │   │       └── translate/route.ts # POST translate
│   │   │   ├── sites/
│   │   │   │   ├── route.ts              # GET list, POST create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts          # GET, PUT, DELETE
│   │   │   │       └── test/route.ts     # POST test connection
│   │   │   ├── settings/
│   │   │   │   ├── currency/
│   │   │   │   │   ├── route.ts          # GET/POST saved currency rates
│   │   │   │   │   └── live/route.ts     # GET live rate via Frankfurter proxy
│   │   │   │   └── mssql/
│   │   │   │       ├── route.ts          # GET/POST MSSQL connection config
│   │   │   │       ├── test/route.ts     # POST test MSSQL connection
│   │   │   │       ├── tables/route.ts   # GET list of MSSQL tables
│   │   │   │       ├── columns/route.ts  # GET columns for a table
│   │   │   │       ├── search/route.ts   # GET search rows in a table
│   │   │   │       └── mappings/route.ts # GET/POST column→field mappings
│   │   │   ├── setup/route.ts            # GET config, POST save
│   │   │   └── upload/route.ts           # POST image upload
│   │   ├── dashboard/page.tsx # Dashboard with stats + activity
│   │   ├── docs/page.tsx      # This documentation page
│   │   ├── images/
│   │   │   └── page.tsx       # Image library (gallery + categories)
│   │   ├── products/
│   │   │   ├── page.tsx       # Product list table
│   │   │   ├── new/page.tsx   # Create product form + MSSQL import panel
│   │   │   └── [id]/page.tsx  # Edit product (tabs)
│   │   ├── sites/
│   │   │   ├── page.tsx       # Site list table
│   │   │   ├── new/page.tsx   # Create site form
│   │   │   └── [id]/page.tsx  # Edit site form
│   │   ├── settings/
│   │   │   ├── layout.tsx     # Settings shell with sub-navigation
│   │   │   ├── page.tsx       # Settings index (redirects to /settings/database)
│   │   │   ├── database/page.tsx    # MSSQL connection + column mapping
│   │   │   ├── currency/page.tsx    # Currency exchange rates (manual + live fetch)
│   │   │   ├── translation/page.tsx # LibreTranslate / translation config
│   │   │   └── SettingsSubNav.tsx   # Tab navigation between settings pages
│   │   ├── setup/page.tsx     # App configuration (legacy)
│   │   ├── globals.css        # Global styles + Tailwind import
│   │   ├── layout.tsx         # Root layout with SessionProvider
│   │   └── providers.tsx      # NextAuth SessionProvider wrapper
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx    # Left nav with active state
│   │   │   └── Header.tsx     # Top bar with user + sign out
│   │   └── ui/
│   │       ├── ArchitecturePreview.tsx # Lightbox for architecture SVG
│   │       ├── Badge.tsx      # Status badges + SyncStatusBadge
│   │       ├── Button.tsx     # Button variants
│   │       ├── Card.tsx       # Card, CardHeader, CardContent, CardTitle
│   │       ├── ImagePicker.tsx # Image library modal (Library + Upload tabs)
│   │       ├── ImageUploader.tsx # Simple drag-and-drop upload (legacy)
│   │       ├── Input.tsx      # Input, Textarea, Select
│   │       └── VariationsEditor.tsx # Variable product variations UI
│   ├── generated/
│   │   └── prisma/            # Prisma generated client (gitignored)
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
│       ├── mssql.ts           # MSSQL singleton pool + query helpers
│       ├── prisma.ts          # Prisma client singleton
│       ├── translation.ts     # LibreTranslate integration
│       └── woocommerce.ts     # WooCommerce REST API helpers
├── .env.local                 # Environment variables (gitignored)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json`}
                  </CodeBlock>
                </CardContent>
              </Card>
            </Section>

            {/* DATABASE SCHEMA */}
            <Section id="database" title="Database Schema">
              <p className="text-sm" style={{ color: "#605e5c" }}>
                PostgreSQL database managed by Prisma 6. Local database: <Code>stepv5_webshop</Code> via Postgres.app.
                Live database: <Code>sal_tech_com_db_stepv5_mwa</Code> on <Code>pgsql1.simply.com</Code>.
                All IDs are CUID strings generated by Prisma.
              </p>

              <Card>
                <CardHeader><CardTitle>User</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Stores admin accounts. Currently only used for session authentication — no multi-user role system.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="email">email</Code>, "String", "Unique — used as login identifier"],
                      [<Code key="password">password</Code>, "String", "bcrypt hashed"],
                      [<Code key="name">name</Code>, "String", "Display name shown in header"],
                      [<Code key="role">role</Code>, "String", 'Default: "admin"'],
                      [<Code key="createdAt">createdAt</Code>, "DateTime", "Auto-set on create"],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>AppConfig</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Key-value store for application settings. Avoids schema migrations when adding new config options.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="key">key</Code>, "String", "Unique config key"],
                      [<Code key="value">value</Code>, "String", "Config value (always string)"],
                      [<Code key="updatedAt">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                  <p className="text-xs pt-1" style={{ color: "#605e5c" }}>
                    Known keys: <Code>libreTranslateUrl</Code>, <Code>libreTranslateApiKey</Code>, <Code>defaultSourceLanguage</Code>, <Code>autoTranslate</Code>, <Code>currencyRates</Code> (JSON array of rate objects)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Site</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Represents a remote WooCommerce WordPress installation. Products are pushed to sites via their REST API credentials.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="name">name</Code>, "String", "Display name (e.g. 'Main Store EN')"],
                      [<Code key="url">url</Code>, "String", "WordPress site base URL"],
                      [<Code key="consumerKey">consumerKey</Code>, "String", "WooCommerce API key (ck_…)"],
                      [<Code key="consumerSecret">consumerSecret</Code>, "String", "WooCommerce API secret (cs_…)"],
                      [<Code key="defaultLanguage">defaultLanguage</Code>, "String", 'Language code (e.g. "en", "fr"). Used to pick translation when syncing'],
                      [<Code key="status">status</Code>, "String", '"active" or "inactive". Only active sites shown in sync UI'],
                      [<Code key="createdAt">createdAt</Code>, "DateTime", "Auto-set on create"],
                      [<Code key="updatedAt2">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Product</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>The central product record. Images, categories, and tags are stored as JSON strings (arrays) for portability across database providers.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="title">title</Code>, "String", "Product name"],
                      [<Code key="description">description</Code>, "String?", "Optional long description"],
                      [<Code key="price">price</Code>, "String", 'Regular price. String to preserve decimals (default "0")'],
                      [<Code key="salePrice">salePrice</Code>, "String?", "Optional sale price"],
                      [<Code key="sku">sku</Code>, "String?", "Optional stock keeping unit"],
                      [<Code key="images">images</Code>, "String", 'JSON array of URLs. e.g. \'["/uploads/abc.jpg"]\'. Default: "[]"'],
                      [<Code key="categories">categories</Code>, "String", 'JSON array of category name strings. Default: "[]"'],
                      [<Code key="tags">tags</Code>, "String", 'JSON array of tag name strings. Default: "[]"'],
                      [<Code key="status">status</Code>, "String", '"draft" or "published". Maps to WooCommerce "draft"/"publish"'],
                      [<Code key="createdAt2">createdAt</Code>, "DateTime", "Auto-set on create"],
                      [<Code key="updatedAt3">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>ProductTranslation</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Stores translated versions of a product's title and description. Unique per product + language pair. When syncing, the translation matching the site's <Code>defaultLanguage</Code> is used.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="productId">productId</Code>, "String", "FK → Product (cascade delete)"],
                      [<Code key="language">language</Code>, "String", 'Language code e.g. "es", "fr"'],
                      [<Code key="title2">title</Code>, "String", "Translated product title"],
                      [<Code key="description2">description</Code>, "String?", "Translated description"],
                      [<Code key="createdAt3">createdAt</Code>, "DateTime", "Auto-set on create"],
                      [<Code key="updatedAt4">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                  <p className="text-xs pt-1" style={{ color: "#605e5c" }}>Unique constraint: <Code>[productId, language]</Code> — upserted on re-translate.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>ProductSync</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Join table tracking the sync state between each product and each site. Records the remote WooCommerce product ID so future syncs perform an update (PUT) instead of a create (POST).</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="productId2">productId</Code>, "String", "FK → Product (cascade delete)"],
                      [<Code key="siteId">siteId</Code>, "String", "FK → Site (cascade delete)"],
                      [<Code key="wooProductId">wooProductId</Code>, "Int?", "Product ID on the remote WooCommerce site"],
                      [<Code key="status2">status</Code>, "String", '"pending", "synced", or "failed"'],
                      [<Code key="lastSyncedAt">lastSyncedAt</Code>, "DateTime?", "Timestamp of last successful sync"],
                      [<Code key="errorMessage">errorMessage</Code>, "String?", "Error message from last failed sync"],
                      [<Code key="createdAt4">createdAt</Code>, "DateTime", "Auto-set on create"],
                      [<Code key="updatedAt5">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                  <p className="text-xs pt-1" style={{ color: "#605e5c" }}>Unique constraint: <Code>[productId, siteId]</Code> — upserted on every sync attempt.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>MssqlConnection</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Stores a single MSSQL server connection configuration. Only one row is expected (findFirst pattern). Password stored as plaintext — keep the database file secure.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="host">host</Code>, "String", 'MSSQL server hostname or IP. Default: ""'],
                      [<Code key="port">port</Code>, "Int", "TCP port. Default: 1433"],
                      [<Code key="database">database</Code>, "String", "Database name"],
                      [<Code key="username">username</Code>, "String", "SQL login username"],
                      [<Code key="password">password</Code>, "String", "SQL login password (plaintext)"],
                      [<Code key="encrypt">encrypt</Code>, "Boolean", "Whether to encrypt the connection. Default: true"],
                      [<Code key="trustCert">trustCert</Code>, "Boolean", "Trust self-signed certificates. Default: true"],
                      [<Code key="createdAt">createdAt</Code>, "DateTime", "Auto-set on create"],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>MssqlTableMapping</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Stores the column→field mapping configuration per page. One row per page (e.g. <Code>products/new</Code>). Allows users to define which MSSQL column maps to which product field.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="page">page</Code>, "String", "Unique page identifier e.g. products/new"],
                      [<Code key="tableName">tableName</Code>, "String", "MSSQL table name to query"],
                      [<Code key="searchColumn">searchColumn</Code>, "String", "Column to search/filter on"],
                      [<Code key="displayColumns">displayColumns</Code>, "String", "JSON array of column names to show in results"],
                      [<Code key="fieldMappings">fieldMappings</Code>, "String", 'JSON object mapping MSSQL columns to product fields e.g. {"Item Name":"title"}'],
                      [<Code key="createdAt">createdAt</Code>, "DateTime", "Auto-set on create"],
                    ]}
                  />
                  <p className="text-xs pt-1" style={{ color: "#605e5c" }}>Unique constraint: <Code>page</Code> — upserted when saving mapping configuration.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>ImageCategory</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Organizes images into named groups. Images can be filtered by category in both the library page and the ImagePicker modal.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="name">name</Code>, "String", "Unique category name"],
                      [<Code key="slug">slug</Code>, "String", "Unique URL-safe slug derived from name"],
                      [<Code key="description">description</Code>, "String?", "Optional description"],
                      [<Code key="createdAt">createdAt</Code>, "DateTime", "Auto-set on create"],
                      [<Code key="updatedAt">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Image</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs" style={{ color: "#605e5c" }}>Tracks every uploaded image file. Created automatically when a file is uploaded via <Code>/api/upload</Code>. Images are stored in <Code>public/uploads/</Code> with UUID filenames.</p>
                  <Table
                    headers={["Column", "Type", "Notes"]}
                    rows={[
                      [<Code key="id">id</Code>, "String (CUID)", "Primary key"],
                      [<Code key="filename">filename</Code>, "String", "Original filename from the upload"],
                      [<Code key="url">url</Code>, "String", 'Public URL path e.g. "/uploads/abc.jpg"'],
                      [<Code key="alt">alt</Code>, "String?", "Alt text for accessibility / SEO"],
                      [<Code key="size">size</Code>, "Int?", "File size in bytes"],
                      [<Code key="mimeType">mimeType</Code>, "String?", 'MIME type e.g. "image/jpeg"'],
                      [<Code key="width">width</Code>, "Int?", "Image width in pixels (if detected)"],
                      [<Code key="height">height</Code>, "Int?", "Image height in pixels (if detected)"],
                      [<Code key="categoryId">categoryId</Code>, "String?", "FK → ImageCategory (SetNull on delete)"],
                      [<Code key="createdAt">createdAt</Code>, "DateTime", "Auto-set on create"],
                      [<Code key="updatedAt">updatedAt</Code>, "DateTime", "Auto-updated"],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Entity Relationship</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <CodeBlock>{`Product  ──< ProductSync >──  Site
Product  ──< ProductTranslation

ImageCategory  ──< Image   (SetNull on category delete)

MssqlConnection    (singleton — one row)
MssqlTableMapping  (one per page slug, stores column→field map)
AppConfig          (key-value — currencyRates, translation config)

Cascade deletes:
  Delete Product       →  removes all ProductSync + ProductTranslation rows
  Delete Site          →  removes all ProductSync rows for that site
  Delete ImageCategory →  sets Image.categoryId = NULL (images kept)`}
                  </CodeBlock>
                </CardContent>
              </Card>
            </Section>

            {/* API REFERENCE */}
            <Section id="api" title="API Reference">
              <p className="text-sm mb-2" style={{ color: "#605e5c" }}>All routes require an active NextAuth session. Unauthenticated requests return <Code>401 Unauthorized</Code>.</p>

              {[
                {
                  group: "Products",
                  routes: [
                    { method: "GET", path: "/api/products", desc: "List all products. Supports ?search= (title contains) and ?status= filters. Includes syncs (with site id, name, url) and translations." },
                    { method: "POST", path: "/api/products", desc: "Create a product. Body: title (required), description, price, salePrice, sku, images (JSON string), categories (JSON string), tags (JSON string), status." },
                    { method: "GET", path: "/api/products/[id]", desc: "Get single product with full syncs (including site details) and translations." },
                    { method: "PUT", path: "/api/products/[id]", desc: "Update product fields. All fields optional. Accepts salePrice/sku as null to clear them." },
                    { method: "DELETE", path: "/api/products/[id]", desc: "Delete product. Cascades to ProductSync and ProductTranslation." },
                    { method: "POST", path: "/api/products/[id]/sync", desc: "Sync product to one or more sites. Body: { siteIds: string[] }. For each site, finds the matching translation, calls WooCommerce REST API (POST if new, PUT if existing), and upserts ProductSync record." },
                    { method: "POST", path: "/api/products/[id]/translate", desc: "Translate product via LibreTranslate. Body: { targetLanguage: string }. Reads config from AppConfig. Upserts ProductTranslation." },
                  ],
                },
                {
                  group: "Sites",
                  routes: [
                    { method: "GET", path: "/api/sites", desc: "List all sites with sync count." },
                    { method: "POST", path: "/api/sites", desc: "Create a site. Body: name, url, consumerKey, consumerSecret, defaultLanguage, status." },
                    { method: "GET", path: "/api/sites/[id]", desc: "Get single site record." },
                    { method: "PUT", path: "/api/sites/[id]", desc: "Update site fields. All fields optional." },
                    { method: "DELETE", path: "/api/sites/[id]", desc: "Delete site. Cascades ProductSync records." },
                    { method: "POST", path: "/api/sites/[id]/test", desc: "Test WooCommerce API connection. Calls GET /wp-json/wc/v3/products?per_page=1 with Basic Auth. Returns { success, message }." },
                  ],
                },
                {
                  group: "Setup",
                  routes: [
                    { method: "GET", path: "/api/setup", desc: "Read AppConfig rows and return as structured object: libreTranslateUrl, libreTranslateApiKey, autoTranslate, defaultSourceLanguage." },
                    { method: "POST", path: "/api/setup", desc: "Save config values to AppConfig table using upsert per key." },
                  ],
                },
                {
                  group: "Settings — Currency",
                  routes: [
                    { method: "GET", path: "/api/settings/currency", desc: "Read saved currency rates from AppConfig (key: currencyRates). Returns { rates: [{from, to, rate, fetchedAt?}] }." },
                    { method: "POST", path: "/api/settings/currency", desc: "Save currency rate array to AppConfig. Body: { rates: Rate[] }." },
                    { method: "GET", path: "/api/settings/currency/live", desc: "Proxy to Frankfurter (ECB) API. Params: ?from=EUR&to=USD. Returns { from, to, rate }. Server-side cached for 1 hour. Currency codes must be valid 3-letter ISO codes." },
                  ],
                },
                {
                  group: "Settings — MSSQL",
                  routes: [
                    { method: "GET", path: "/api/settings/mssql", desc: "Read saved MSSQL connection config from MssqlConnection table (findFirst). Returns connection fields or empty defaults if not configured." },
                    { method: "POST", path: "/api/settings/mssql", desc: "Save MSSQL connection config (upsert). Calls invalidatePool() to force pool recreation on next use. Body: { host, port, database, username, password, encrypt, trustCert }." },
                    { method: "POST", path: "/api/settings/mssql/test", desc: "Test MSSQL credentials by opening a one-off connection (does not use the singleton pool). Returns { success, message }." },
                    { method: "GET", path: "/api/settings/mssql/tables", desc: "List all BASE TABLE names in the connected MSSQL database via INFORMATION_SCHEMA.TABLES." },
                    { method: "GET", path: "/api/settings/mssql/columns", desc: "List column names for a given table. Params: ?table=TableName. Uses INFORMATION_SCHEMA.COLUMNS ordered by ORDINAL_POSITION." },
                    { method: "GET", path: "/api/settings/mssql/search", desc: "Search rows in a table. Params: ?table=&column=&q=&limit=. Uses LIKE %q% on the column. Column/table names are bracket-quoted to support spaces. Returns rows as JSON array." },
                    { method: "GET", path: "/api/settings/mssql/mappings", desc: "Read MssqlTableMapping for a given page. Params: ?page=products/new. Returns { tableName, searchColumn, displayColumns, fieldMappings } or null." },
                    { method: "POST", path: "/api/settings/mssql/mappings", desc: "Save MssqlTableMapping for a page (upsert by page). Body: { page, tableName, searchColumn, displayColumns, fieldMappings }." },
                  ],
                },
                {
                  group: "Images",
                  routes: [
                    { method: "GET", path: "/api/images", desc: "List all images. Supports ?search= (filename or alt contains) and ?categoryId= filter. Pass categoryId=uncategorized to get images with no category. Includes category relation." },
                    { method: "POST", path: "/api/images", desc: "Create an image record manually. Body: { filename, url, alt?, size?, mimeType?, categoryId? }. Usually called indirectly via /api/upload." },
                    { method: "GET", path: "/api/images/[id]", desc: "Get a single image record with category." },
                    { method: "PUT", path: "/api/images/[id]", desc: "Update image metadata. Body: { alt?, categoryId? }. Used from the Images library detail panel." },
                    { method: "DELETE", path: "/api/images/[id]", desc: "Delete image record and remove the file from public/uploads/ (if URL starts with /uploads/)." },
                    { method: "GET", path: "/api/images/categories", desc: "List all image categories ordered by name. Includes _count.images for each category." },
                    { method: "POST", path: "/api/images/categories", desc: "Create a category. Body: { name, description? }. Auto-generates slug from name. Returns 409 if name/slug already exists." },
                    { method: "PUT", path: "/api/images/categories/[id]", desc: "Update a category name or description. Regenerates slug from new name." },
                    { method: "DELETE", path: "/api/images/categories/[id]", desc: "Delete a category. Images in that category have their categoryId set to NULL (SetNull behaviour)." },
                  ],
                },
                {
                  group: "Upload",
                  routes: [
                    { method: "POST", path: "/api/upload", desc: "Upload an image file. Accepts multipart/form-data: file (required), categoryId (optional), alt (optional), saveToLibrary (pass 'false' to skip DB record). Validates type (JPEG/PNG/WebP/GIF) and size (≤5MB). Saves to public/uploads/ with UUID filename. Creates an Image record by default. Returns { url, image? }." },
                  ],
                },
              ].map((group) => (
                <Card key={group.group}>
                  <CardHeader><CardTitle>{group.group}</CardTitle></CardHeader>
                  <CardContent className="py-4">
                    <Table
                      headers={["Method", "Path", "Description"]}
                      rows={group.routes.map((r) => [
                        <Badge key={r.method} color={r.method === "GET" ? "blue" : r.method === "POST" ? "green" : r.method === "PUT" ? "yellow" : "red"}>
                          {r.method}
                        </Badge>,
                        <Code key={r.path}>{r.path}</Code>,
                        r.desc,
                      ])}
                    />
                  </CardContent>
                </Card>
              ))}
            </Section>

            {/* PAGES */}
            <Section id="pages" title="Pages">
              <Card>
                <CardContent className="py-4">
                  <Table
                    headers={["Route", "Type", "Description"]}
                    rows={[
                      [<Code key="/login">/login</Code>, <Badge key="c1" color="blue">Client</Badge>, "Login form with email/password. Calls NextAuth signIn(). Redirects to /dashboard on success."],
                      [<Code key="/dashboard">/dashboard</Code>, <Badge key="s1" color="green">Server</Badge>, "Stats cards (sites, products, synced, pending counts) + recent sync activity table."],
                      [<Code key="/sites">/sites</Code>, <Badge key="s2" color="green">Server</Badge>, "Table of all WooCommerce sites with status, sync count, and external link."],
                      [<Code key="/sites/new">/sites/new</Code>, <Badge key="c2" color="blue">Client</Badge>, "Form to create a new site. Fields: name, URL, consumer key/secret, language, status."],
                      [<Code key="/sites/id">/sites/[id]</Code>, <Badge key="c3" color="blue">Client</Badge>, "Edit site form. Includes Test Connection button that pings the WooCommerce REST API."],
                      [<Code key="/images">/images</Code>, <Badge key="c-img" color="blue">Client</Badge>, "Image library. Category sidebar (create/rename/delete), search bar, upload zone (drag-and-drop or click), image grid. Select image to edit alt text, category, copy URL, or delete."],
                      [<Code key="/products">/products</Code>, <Badge key="c4" color="blue">Client</Badge>, "Searchable/filterable product table with sync status and live site links."],
                      [<Code key="/products/new">/products/new</Code>, <Badge key="c5" color="blue">Client</Badge>, "Create product form. Includes ImagePicker (browse library or upload) and website selection for immediate sync. Right panel: MSSQL import search with unmapped columns auto-fill."],
                      [<Code key="/products/id">/products/[id]</Code>, <Badge key="c6" color="blue">Client</Badge>, "Tabbed product editor: Details (edit fields, manage images via ImagePicker), Translations (auto-translate), Sync (push to sites)."],
                      [<Code key="/settings/database">/settings/database</Code>, <Badge key="c8" color="blue">Client</Badge>, "Configure MSSQL connection (host, port, database, credentials, encrypt). Test connection. Define column→field mapping per page including search column and display columns."],
                      [<Code key="/settings/currency">/settings/currency</Code>, <Badge key="c9" color="blue">Client</Badge>, "Manage currency exchange rates. Add/remove from→to pairs. Fetch live rates per-row or all at once from Frankfurter (ECB). Rates are saved to AppConfig."],
                      [<Code key="/settings/translation">/settings/translation</Code>, <Badge key="c10" color="blue">Client</Badge>, "Configure LibreTranslate URL, API key, source language, and auto-translate toggle."],
                      [<Code key="/setup">/setup</Code>, <Badge key="c7" color="blue">Client</Badge>, "Legacy app configuration page (same as /settings/translation)."],
                      [<Code key="/docs">/docs</Code>, <Badge key="s3" color="green">Server</Badge>, "This documentation page."],
                    ]}
                  />
                </CardContent>
              </Card>
            </Section>

            {/* COMPONENTS */}
            <Section id="components" title="Components">
              {[
                {
                  name: "Sidebar",
                  path: "components/layout/Sidebar.tsx",
                  desc: "Left navigation. Reads current pathname via usePathname() to highlight active item. Uses onMouseEnter/Leave for hover states. Active item has a left blue border.",
                },
                {
                  name: "Header",
                  path: "components/layout/Header.tsx",
                  desc: "Top bar. Displays page title/subtitle, current user name from NextAuth session, and a Sign out button calling signOut().",
                },
                {
                  name: "Card / CardHeader / CardContent / CardTitle",
                  path: "components/ui/Card.tsx",
                  desc: "Flat white container with #edebe9 border. CardHeader has a #faf9f8 background. All accept a className prop for overrides.",
                },
                {
                  name: "Button",
                  path: "components/ui/Button.tsx",
                  desc: "Variants: primary (azure blue), secondary (gray), danger (red), ghost (transparent), outline (bordered). Sizes: sm, md, lg. Shows spinner when loading=true. Uses useState for hover color swap since inline style hover isn't natively supported.",
                },
                {
                  name: "Input / Textarea / Select",
                  path: "components/ui/Input.tsx",
                  desc: "Form controls with label, hint, and error states. Error state changes border to red and background to light red. All share the same style: flat border #8a8886, azure focus ring.",
                },
                {
                  name: "Badge / SyncStatusBadge",
                  path: "components/ui/Badge.tsx",
                  desc: "Badge renders a colored label pill. Variants: success (green), warning (yellow), danger (red), info (blue), default (gray). SyncStatusBadge maps 'synced'→success, 'pending'→warning, 'failed'→danger.",
                },
                {
                  name: "ImagePicker",
                  path: "components/ui/ImagePicker.tsx",
                  desc: "Modal image selector with two tabs — Library (browse and multi-select from the image library with category filter + search) and Upload New (drag-and-drop or file picker, assigns category + alt, saves to library). Apply Selection inserts chosen URLs into the product's images array. Used in products/new and products/[id]. Controlled: receives images[] + onChange().",
                },
                {
                  name: "ArchitecturePreview",
                  path: "components/ui/ArchitecturePreview.tsx",
                  desc: "Client component that renders the architecture SVG with a hover zoom hint and opens a fullscreen lightbox on click. Used in the docs page Architecture section. Backdrop click closes the lightbox.",
                },
                {
                  name: "ImageUploader (legacy)",
                  path: "components/ui/ImageUploader.tsx",
                  desc: "Simple drag-and-drop + click-to-upload zone. Uploads directly to POST /api/upload without library integration. Superseded by ImagePicker in product pages.",
                },
              ].map((c) => (
                <Card key={c.name}>
                  <CardContent className="py-3">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-sm font-semibold" style={{ color: "#323130" }}>{c.name}</span>
                      <Code>{c.path}</Code>
                    </div>
                    <p className="text-sm" style={{ color: "#605e5c" }}>{c.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </Section>

            {/* LIB */}
            <Section id="lib" title="Library Modules">
              {[
                {
                  file: "lib/auth.ts",
                  title: "NextAuth Configuration",
                  desc: "Configures NextAuth with the Credentials provider. On sign-in, looks up User by email, compares password with bcrypt. Session strategy is JWT. Exposes authOptions for use in API routes via getServerSession().",
                },
                {
                  file: "lib/mssql.ts",
                  title: "MSSQL Singleton Pool",
                  desc: [
                    "getPool(cfg) — returns a reusable mssql.ConnectionPool stored on globalThis. Reuses the existing pool if the config key (host:port/database/username) matches and the pool is connected. Closes and recreates the pool if config changes. Pool settings: max 10 connections, 60s idle timeout.",
                    "invalidatePool() — closes the current pool and clears it from globalThis. Called automatically after saving new MSSQL credentials so the next query uses fresh config.",
                    "createMssqlPool(cfg) — opens a one-off connection for credential testing only. Not suitable for repeated queries.",
                    "listTables(cfg) — queries INFORMATION_SCHEMA.TABLES for all BASE TABLE names.",
                    "listColumns(cfg, tableName) — queries INFORMATION_SCHEMA.COLUMNS for a table, ordered by ORDINAL_POSITION.",
                    "searchTable(cfg, tableName, searchColumn, query, limit) — LIKE search using parameterized inputs. Column and table names are sanitized (allow letters, digits, underscore, spaces) and bracket-quoted in SQL to safely support column names with spaces (e.g. [Item Name]).",
                    "getRowByValue(cfg, tableName, searchColumn, value) — returns the first row where the column exactly equals the value.",
                  ],
                },
                {
                  file: "lib/prisma.ts",
                  title: "Prisma Client Singleton",
                  desc: "Exports a single PrismaClient instance. Uses global variable in development to prevent multiple instances during hot-reload (Next.js dev server creates new module instances on each reload).",
                },
                {
                  file: "lib/woocommerce.ts",
                  title: "WooCommerce REST API Helpers",
                  desc: [
                    "syncProductToSite(product, site, wooProductId?, translation?) — builds a WooProduct payload from the product (using translation title/description if provided), then POSTs (new) or PUTs (existing) to {site.url}/wp-json/wc/v3/products using Basic Auth. Returns { success, wooProductId } or { success: false, error }.",
                    "deleteProductFromSite(wooProductId, site) — DELETEs a product from WooCommerce using ?force=true (permanent delete).",
                    "testSiteConnection(site) — GETs /wp-json/wc/v3/products?per_page=1 to verify credentials are valid.",
                    "buildWooPayload() — maps internal Product fields to WooCommerce API format: status 'published'→'publish', images as [{src}], categories/tags as [{name}].",
                    "getAuthHeader() — Base64 encodes consumerKey:consumerSecret for HTTP Basic Auth.",
                  ],
                },
                {
                  file: "lib/translation.ts",
                  title: "LibreTranslate Integration",
                  desc: "translateProduct(product, targetLanguage, sourceLanguage, config) — calls the LibreTranslate /translate endpoint twice (once for title, once for description). Returns { success, title, description } or { success: false, error }. Reads URL and API key from AppConfig at runtime.",
                },
              ].map((m) => (
                <Card key={m.file}>
                  <CardHeader>
                    <div className="flex items-baseline gap-3">
                      <CardTitle>{m.title}</CardTitle>
                      <Code>{m.file}</Code>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3">
                    {Array.isArray(m.desc) ? (
                      <ul className="space-y-1.5">
                        {m.desc.map((d, i) => (
                          <li key={i} className="text-sm flex gap-2" style={{ color: "#605e5c" }}>
                            <span style={{ color: "#0078d4" }}>·</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm" style={{ color: "#605e5c" }}>{m.desc}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Section>

            {/* AUTH */}
            <Section id="auth" title="Authentication">
              <Card>
                <CardContent className="py-4 space-y-3">
                  <SubSection title="How it works">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      NextAuth.js v4 with the Credentials provider. On login, the user submits email + password.
                      NextAuth calls the <Code>authorize()</Code> function in <Code>lib/auth.ts</Code>,
                      which queries the <Code>User</Code> table and verifies the password with bcrypt.
                      On success, a JWT session is created and stored in a cookie.
                    </p>
                  </SubSection>
                  <SubSection title="Protecting routes">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      Server components use <Code>getServerSession(authOptions)</Code> then <Code>redirect('/login')</Code>.
                      API routes use <Code>getServerSession(authOptions)</Code> and return <Code>401</Code> if no session.
                      Client pages redirect implicitly when API calls return 401.
                    </p>
                  </SubSection>
                  <SubSection title="Default credentials (seed)">
                    <Table
                      headers={["Email", "Password", "Role"]}
                      rows={[
                        ["admin@webshop.com", "Admin@123", "admin"],
                      ]}
                    />
                    <p className="text-xs mt-2" style={{ color: "#a19f9d" }}>Re-seed: run <Code>npx tsx prisma/seed.ts</Code> from the project root.</p>
                  </SubSection>
                </CardContent>
              </Card>
            </Section>

            {/* WORKFLOWS */}
            <Section id="workflows" title="Workflows">
              <Card>
                <CardHeader><CardTitle>Adding a product and syncing it</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <ol className="space-y-2 text-sm" style={{ color: "#605e5c" }}>
                    {[
                      "Go to Products → Add Product",
                      "Fill in title, description, price, SKU, upload images, add categories/tags, set status",
                      'Under "Publish to Websites", check the sites to sync to immediately',
                      "Click Create Product — product is created, then POST /api/products/[id]/sync is called for selected sites",
                      "Redirect to the edit page where you can see sync results in the Sync tab",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0078d4" }}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Translating a product</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <ol className="space-y-2 text-sm" style={{ color: "#605e5c" }}>
                    {[
                      "Ensure LibreTranslate URL is configured in Setup",
                      "Open a product → go to the Translations tab",
                      "Select target language from the dropdown",
                      "Click Translate — calls POST /api/products/[id]/translate",
                      "The API calls LibreTranslate for title and description, then upserts a ProductTranslation row",
                      "When this product is synced to a site whose defaultLanguage matches, the translation is used",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0078d4" }}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Importing a product from MSSQL</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <ol className="space-y-2 text-sm" style={{ color: "#605e5c" }}>
                    {[
                      "Go to Settings → Database and enter your MSSQL server credentials, then click Test Connection",
                      "Select the table and search column to use for product lookup, configure any column→field mappings, then save",
                      "Go to Products → Add Product — the Import from Database search bar appears at the top",
                      "Type a search term — results are fetched via GET /api/settings/mssql/search with debounce",
                      "Select a result row — auto-mapped fields (title, price, sku, etc.) fill in automatically based on saved fieldMappings",
                      "The right-side Unmapped DB Columns panel shows all remaining columns from the selected row",
                      "Use the per-row dropdown to manually apply any unmapped column value to a product field",
                      "Complete remaining fields and click Create Product",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0078d4" }}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Setting up live currency rates</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <ol className="space-y-2 text-sm" style={{ color: "#605e5c" }}>
                    {[
                      "Go to Settings → Currency",
                      "Click Common Pairs to load EUR/USD, EUR/GBP, USD/EUR, GBP/EUR defaults — or click Add Rate to define custom pairs",
                      "Click Fetch Live Rates to auto-fill all rows with live ECB rates from Frankfurter API (proxied server-side)",
                      "Alternatively, click the per-row refresh icon (↺) to update a single pair",
                      "Rows with live rates show a green 'live' badge next to the rate field and a last-synced timestamp in the header",
                      "Click Save Rates — rates are stored as JSON in AppConfig under the key currencyRates",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0078d4" }}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Uploading and using images</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <ol className="space-y-2 text-sm" style={{ color: "#605e5c" }}>
                    {[
                      "Go to Images in the sidebar to open the image library",
                      "Create categories first (e.g. 'Products', 'Banners') using the + button in the category sidebar",
                      "Select a category then drag-and-drop files onto the page or click Upload — images are saved to public/uploads/ and registered in the Image table",
                      "Click any image to open the detail panel — edit alt text, change category, copy the URL, or delete the file",
                      "When editing a product, click the 'Add images from library or upload' button to open the ImagePicker modal",
                      "In the Library tab: filter by category, search, and click images to select/deselect them. Click Apply Selection to attach them to the product",
                      "In the Upload New tab: drag files or pick from disk, assign a category and alt text, then click Upload — files are saved to the library and immediately added to the product",
                      "Images uploaded from a product page appear in the Images library and can be reused across other products",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0078d4" }}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Sync flow (internal)</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <CodeBlock>{`POST /api/products/[id]/sync  { siteIds: ["abc", "def"] }

For each siteId:
  1. Fetch Site record (url, consumerKey, consumerSecret, defaultLanguage)
  2. Fetch existing ProductSync record (to get wooProductId if previously synced)
  3. Find ProductTranslation where language = site.defaultLanguage
  4. Call syncProductToSite(product, site, wooProductId, translation)
     ├── Build WooCommerce payload (uses translation title/desc if available)
     ├── If wooProductId exists → PUT /wp-json/wc/v3/products/{wooProductId}
     └── Else → POST /wp-json/wc/v3/products
  5. Upsert ProductSync:
     ├── Success → status="synced", wooProductId=response.id, lastSyncedAt=now
     └── Failure → status="failed", errorMessage=error`}
                  </CodeBlock>
                </CardContent>
              </Card>
            </Section>

            {/* ENV SETUP */}
            <Section id="env" title="Environment Setup">
              <Card>
                <CardHeader><CardTitle>Required environment variables</CardTitle></CardHeader>
                <CardContent className="py-4 space-y-4">
                  <p className="text-sm" style={{ color: "#605e5c" }}>Create a <Code>.env.local</Code> file in the project root:</p>
                  <CodeBlock>{`# Database — PostgreSQL connection string
# Local (Postgres.app on macOS):
DATABASE_URL="postgresql://<your-mac-username>@localhost:5432/stepv5_webshop"

# Live (Simply.com):
# DATABASE_URL="postgresql://sal_tech_com:<password>@pgsql1.simply.com:5432/sal_tech_com_db_stepv5_mwa"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"

# NextAuth URL — your local dev URL or production URL
NEXTAUTH_URL="http://localhost:3000"`}
                  </CodeBlock>
                  <SubSection title="First-time setup commands">
                    <CodeBlock>{`# Install dependencies
npm install

# Create the PostgreSQL database (local — run in psql or Postgres.app)
# CREATE DATABASE stepv5_webshop;

# Generate Prisma client + push schema to DB
DATABASE_URL="postgresql://..." npx prisma db push

# Seed the database (creates admin user)
npx tsx prisma/seed.ts

# Start development server
npm run dev`}
                    </CodeBlock>
                  </SubSection>
                  <SubSection title="WooCommerce API keys">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      To get API keys from a WordPress site: go to <strong>WooCommerce → Settings → Advanced → REST API → Add key</strong>.
                      Set permissions to <strong>Read/Write</strong>. Copy the consumer key and secret into the Add Site form.
                    </p>
                  </SubSection>
                </CardContent>
              </Card>
            </Section>

            {/* DEVELOPER GUIDE */}
            <Section id="devguide" title="Developer Guide">

              {/* Adding a page */}
              <SubSection title="Adding a new page">
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      All pages live under <Code>src/app/</Code>. Every page exports a default React component from a <Code>page.tsx</Code> file.
                      Pages that need data on load use server components; interactive pages use <Code>&quot;use client&quot;</Code>.
                    </p>

                    <SubSection title="1. Create the file">
                      <CodeBlock>{`// src/app/reports/page.tsx
"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Reports" subtitle="View analytics and reports" />
        <main className="flex-1 p-6">
          {/* page content */}
        </main>
      </div>
    </div>
  );
}`}
                      </CodeBlock>
                    </SubSection>

                    <SubSection title="2. Add to the sidebar nav">
                      <p className="text-sm mb-2" style={{ color: "#605e5c" }}>
                        Open <Code>src/components/layout/Sidebar.tsx</Code> and add an entry to the <Code>navItems</Code> array:
                      </p>
                      <CodeBlock>{`// src/components/layout/Sidebar.tsx
import { BarChart2 } from "lucide-react";  // import an icon

const navItems = [
  // ... existing items
  { href: "/reports", label: "Reports", icon: BarChart2 },
];`}
                      </CodeBlock>
                      <p className="text-xs mt-2" style={{ color: "#a19f9d" }}>
                        Active state is detected automatically: any path that starts with the item&apos;s <Code>href</Code> gets the blue left border highlight.
                      </p>
                    </SubSection>

                    <SubSection title="Server component page (no interactivity)">
                      <p className="text-sm mb-2" style={{ color: "#605e5c" }}>
                        If the page only displays data and needs no client-side state, skip <Code>&quot;use client&quot;</Code> and fetch data directly:
                      </p>
                      <CodeBlock>{`// src/app/reports/page.tsx  (no "use client")
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const products = await prisma.product.findMany();

  return (
    <div className="flex min-h-screen">
      {/* ... layout ... */}
      <main>{products.map(p => <div key={p.id}>{p.title}</div>)}</main>
    </div>
  );
}`}
                      </CodeBlock>
                    </SubSection>
                  </CardContent>
                </Card>
              </SubSection>

              {/* Form management */}
              <SubSection title="Managing forms">
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      All forms follow the same pattern: one state object for all fields, a single <Code>update(key, value)</Code> helper, a <Code>saving</Code> boolean, and an <Code>error</Code> string.
                    </p>
                    <CodeBlock>{`"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function MyFormPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Single updater — keeps the form object flat and predictable
  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/my-resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/my-resource");       // redirect on success
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
      />

      {error && (
        <div className="p-3 text-sm" style={{ backgroundColor: "#fde7e9", color: "#a4262c", border: "1px solid #a4262c" }}>
          {error}
        </div>
      )}

      <Button type="submit" loading={saving}>Save</Button>
    </form>
  );
}`}
                    </CodeBlock>
                    <p className="text-xs" style={{ color: "#a19f9d" }}>
                      The <Code>Button</Code> component accepts a <Code>loading</Code> prop — it shows a spinner and disables the button automatically when true.
                    </p>
                  </CardContent>
                </Card>
              </SubSection>

              {/* Adding an API route */}
              <SubSection title="Adding an API route">
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      API routes live under <Code>src/app/api/</Code>. Each folder has a <Code>route.ts</Code> that exports named functions: <Code>GET</Code>, <Code>POST</Code>, <Code>PUT</Code>, <Code>DELETE</Code>.
                      Every route must check the session first.
                    </p>
                    <CodeBlock>{`// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema — validates and types the request body in one step
const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type:  z.enum(["sales", "inventory"]),
});

// GET — list resources
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(reports);
}

// POST — create a resource
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = createSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const report = await prisma.report.create({ data: result.data });
  return NextResponse.json(report, { status: 201 });
}`}
                    </CodeBlock>

                    <SubSection title="Dynamic routes [id]">
                      <CodeBlock>{`// src/app/api/reports/[id]/route.ts
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(report);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ success: true });
}`}
                      </CodeBlock>
                    </SubSection>
                  </CardContent>
                </Card>
              </SubSection>

              {/* Database operations */}
              <SubSection title="Database operations (Prisma)">
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      Import the Prisma singleton from <Code>@/lib/prisma</Code>. Never instantiate <Code>PrismaClient</Code> directly in a route — that causes connection pool exhaustion during hot-reload.
                    </p>
                    <CodeBlock>{`import { prisma } from "@/lib/prisma";

// CREATE
const product = await prisma.product.create({
  data: { title: "My Product", price: "9.99", status: "draft" },
});

// READ — single record
const product = await prisma.product.findUnique({ where: { id } });

// READ — list with filters
const products = await prisma.product.findMany({
  where: {
    AND: [
      search ? { title: { contains: search } } : {},
      status ? { status } : {},
    ],
  },
  orderBy: { createdAt: "desc" },
  include: { syncs: true },          // join related records
});

// UPDATE
await prisma.product.update({
  where: { id },
  data: { title: "Updated Title" },
});

// UPSERT — create if not exists, update if exists
await prisma.appConfig.upsert({
  where:  { key: "myKey" },
  update: { value: "new value" },
  create: { key: "myKey", value: "new value" },
});

// DELETE
await prisma.product.delete({ where: { id } });`}
                    </CodeBlock>

                    <SubSection title="Adding a new model">
                      <p className="text-sm mb-2" style={{ color: "#605e5c" }}>
                        Edit <Code>prisma/schema.prisma</Code>, then run two commands to apply and regenerate the client:
                      </p>
                      <CodeBlock>{`// 1. Add to prisma/schema.prisma
model Report {
  id        String   @id @default(cuid())
  title     String
  type      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 2. Apply to the database (creates the table)
npx prisma db push

// 3. Regenerate the TypeScript client
npx prisma generate`}
                      </CodeBlock>
                      <p className="text-xs mt-1" style={{ color: "#a19f9d" }}>
                        Use <Code>npx prisma studio</Code> to browse and edit data in a GUI during development.
                      </p>
                    </SubSection>
                  </CardContent>
                </Card>
              </SubSection>

              {/* Adding a settings sub-page */}
              <SubSection title="Adding a settings sub-page">
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      The <Code>/settings</Code> section has its own layout with a tab sub-nav. To add a new tab:
                    </p>
                    <SubSection title="1. Add the tab to SettingsSubNav">
                      <CodeBlock>{`// src/app/settings/SettingsSubNav.tsx
const TABS = [
  { href: "/settings/database",    label: "Database" },
  { href: "/settings/currency",    label: "Currency" },
  { href: "/settings/translation", label: "Translation" },
  { href: "/settings/myfeature",   label: "My Feature" },  // ← add here
];`}
                      </CodeBlock>
                    </SubSection>
                    <SubSection title="2. Create the page file">
                      <CodeBlock>{`// src/app/settings/myfeature/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function MyFeaturePage() {
  return (
    <form className="max-w-xl space-y-4">
      <Card>
        <CardHeader><CardTitle>My Feature</CardTitle></CardHeader>
        <CardContent className="py-4">
          {/* settings form */}
        </CardContent>
      </Card>
    </form>
  );
}`}
                      </CodeBlock>
                      <p className="text-xs mt-1" style={{ color: "#a19f9d" }}>
                        The settings layout (<Code>src/app/settings/layout.tsx</Code>) wraps all pages with the Sidebar, Header, and SettingsSubNav automatically. Your page only needs to return the inner content.
                      </p>
                    </SubSection>
                  </CardContent>
                </Card>
              </SubSection>

              {/* UI patterns */}
              <SubSection title="UI & styling patterns">
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      All styling uses Tailwind utility classes plus inline <Code>style</Code> props for brand colours. Hover states on interactive elements use <Code>onMouseEnter</Code> / <Code>onMouseLeave</Code> with inline style mutation (Tailwind hover variants don&apos;t work with dynamic inline colours).
                    </p>

                    <SubSection title="Hover states">
                      <CodeBlock>{`<button
  style={{ color: "#605e5c" }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLElement).style.color = "#a4262c";
    (e.currentTarget as HTMLElement).style.backgroundColor = "#fde7e9";
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLElement).style.color = "#605e5c";
    (e.currentTarget as HTMLElement).style.backgroundColor = "";
  }}
>
  Delete
</button>`}
                      </CodeBlock>
                    </SubSection>

                    <SubSection title="Colour palette">
                      <Table
                        headers={["Token", "Hex", "Usage"]}
                        rows={[
                          ["Primary blue", "#0078d4", "Links, active states, primary buttons"],
                          ["Dark text", "#323130", "Headings, primary labels"],
                          ["Body text", "#605e5c", "Paragraphs, table cells"],
                          ["Muted text", "#a19f9d", "Hints, placeholders, timestamps"],
                          ["Border", "#edebe9", "Card borders, dividers"],
                          ["Surface", "#f3f2f1", "Table headers, code backgrounds"],
                          ["Sidebar bg", "#1b1b1b", "Left navigation background"],
                          ["Success green", "#107c10", "Success badges, live indicators"],
                          ["Error red", "#a4262c", "Error text, danger buttons"],
                          ["Warning yellow", "#8a6914", "Warning badges"],
                        ]}
                      />
                    </SubSection>

                    <SubSection title="Loading / error / saved states">
                      <CodeBlock>{`const [loading, setLoading] = useState(true);
const [saving, setSaving]  = useState(false);
const [saved,  setSaved]   = useState(false);
const [error,  setError]   = useState("");

// Show spinner while loading initial data
if (loading) return <div className="text-xs" style={{ color: "#605e5c" }}>Loading...</div>;

// Error banner
{error && (
  <div className="p-2.5 text-xs" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
    {error}
  </div>
)}

// Success banner (auto-dismisses after 3s)
{saved && (
  <div className="p-2.5 text-xs" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
    Saved successfully!
  </div>
)}
// After save: setSaved(true); setTimeout(() => setSaved(false), 3000);`}
                      </CodeBlock>
                    </SubSection>

                    <SubSection title="Card layout">
                      <CodeBlock>{`import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <CardContent className="py-4 space-y-4">
    {/* content */}
  </CardContent>
</Card>`}
                      </CodeBlock>
                    </SubSection>
                  </CardContent>
                </Card>
              </SubSection>

              {/* Adding a feature end-to-end */}
              <SubSection title="Adding a feature end-to-end (checklist)">
                <Card>
                  <CardContent className="py-4">
                    <ol className="space-y-2 text-sm" style={{ color: "#605e5c" }}>
                      {[
                        "Define the data shape — add a model to prisma/schema.prisma if you need a new table, then run npx prisma db push && npx prisma generate.",
                        "Create the API route(s) under src/app/api/your-feature/route.ts. Add GET for reading, POST for creating, PUT/DELETE for updates. Always check session first. Validate body with Zod.",
                        "Create the page under src/app/your-feature/page.tsx. Use 'use client' if the page has state or form interactions. Use the Sidebar + Header layout shell.",
                        "Add a nav item to Sidebar.tsx navItems array with an appropriate Lucide icon and href.",
                        "If it's a settings sub-page, add the tab to SettingsSubNav.tsx instead and place the file under src/app/settings/your-feature/page.tsx.",
                        "Fetch data on load with useEffect → fetch('/api/your-feature'). Store in useState. Show loading state while fetching.",
                        "Build the form using the Input / Select / Button UI components. Use the single-object form state pattern with an update() helper.",
                        "Handle API errors by checking res.ok and reading data.error from the JSON response. Display in an error banner.",
                        "After a successful save, either redirect with router.push() or show a timed 'Saved!' banner (setSaved(true); setTimeout(..., 3000)).",
                        "Update the documentation page (src/app/docs/page.tsx) — add the new route to the API Reference table, the page to the Pages table, and the lib module if applicable. Add a changelog entry.",
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0078d4" }}>{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </SubSection>

            </Section>

            {/* CHANGELOG */}
            <Section id="changelog" title="Changelog">
              {[
                {
                  version: "Image Management & PostgreSQL Migration",
                  date: "Apr 7, 2026",
                  changes: [
                    "Migrated database from SQLite to PostgreSQL. Local: Postgres.app (stepv5_webshop). Live: Simply.com (sal_tech_com_db_stepv5_mwa on pgsql1.simply.com). Prisma schema updated to provider='postgresql'.",
                    "Added ImageCategory model — id, name (unique), slug (unique), description, timestamps. Supports create/rename/delete via /api/images/categories routes.",
                    "Added Image model — id, filename, url, alt, size, mimeType, width, height, categoryId (FK → ImageCategory, SetNull on delete), timestamps.",
                    "Added /images gallery page — category sidebar with counts, search bar, drag-and-drop upload zone, image grid. Right detail panel shows alt text editor, category selector, copy URL, and delete buttons.",
                    "Added /api/images/* routes — full CRUD for images (GET list with search/category filter, POST create, PUT update metadata, DELETE removes DB record + disk file).",
                    "Added /api/images/categories/* routes — GET list with image counts, POST create, PUT update, DELETE (images set to uncategorized).",
                    "Updated /api/upload — now creates an Image record in DB on every upload by default. Accepts optional alt, categoryId, saveToLibrary form fields. Added mkdir recursive + try/catch for reliable error reporting.",
                    "Created ImagePicker component — modal with Library tab (browse, filter by category, multi-select) and Upload New tab (drag/drop, category assignment, alt text). Replaces ImageUploader in products/new and products/[id].",
                    "Created ArchitecturePreview component — client component wrapping the architecture SVG with hover zoom hint and click-to-expand fullscreen lightbox.",
                    "Added Images nav item to Sidebar between Products and Users.",
                    "build script in package.json updated to 'prisma generate && next build' so Vercel regenerates the Prisma client before building.",
                  ],
                },
                {
                  version: "MSSQL Product Import",
                  date: "Apr 6, 2026",
                  changes: [
                    "Added lib/mssql.ts — singleton connection pool using globalThis (mirrors Prisma pattern). Prevents connection churn on debounced search.",
                    "New MssqlConnection Prisma model stores server credentials (host, port, database, username, password, encrypt, trustCert).",
                    "New MssqlTableMapping Prisma model stores per-page column→field mappings and search configuration.",
                    "Added /settings/database page — configure MSSQL connection, test it, and define column-to-field mapping with search column selection.",
                    "Added /api/settings/mssql/* routes — GET/POST config, test connection, list tables, list columns, search rows, get/save mappings.",
                    "Products → Add Product now features a full-width Import from Database search bar with debounced live search.",
                    "Selecting a search result auto-fills mapped product fields. A sticky 40%-width right panel shows all unmapped columns with per-row dropdowns to manually apply values.",
                    "Fixed column name sanitization: regex updated to allow spaces (/[^a-zA-Z0-9_\\s]/g). Column names bracket-quoted in SQL ([Item Name]) to support MSSQL columns with spaces.",
                    "Fixed empty search results: guard requires both tableName and searchColumn to be non-empty before firing search.",
                    "invalidatePool() called automatically after saving MSSQL credentials so next query uses fresh config.",
                  ],
                },
                {
                  version: "Currency Exchange Rates",
                  date: "Apr 6, 2026",
                  changes: [
                    "Added /settings/currency page — manage from→to exchange rate pairs.",
                    "Fetch Live Rates button calls all rows in parallel via server-side proxy to Frankfurter (ECB) API — no API key required.",
                    "Per-row refresh button (↺) updates a single pair without affecting others.",
                    "Common Pairs shortcut loads EUR/USD, EUR/GBP, USD/EUR, GBP/EUR as starting pairs.",
                    "Live-fetched rows show a green 'live' badge inline (not absolutely positioned) to avoid overlap with adjacent rows.",
                    "Last synced timestamp displayed in card header after bulk fetch.",
                    "Rates persisted as JSON in AppConfig under key currencyRates.",
                    "Added /api/settings/currency/live — server-side proxy to Frankfurter API with 1-hour revalidate cache. Validates currency codes as 3-letter ISO. Avoids client-side CORS issues.",
                  ],
                },
                {
                  version: "Settings Sub-Navigation",
                  date: "Apr 6, 2026",
                  changes: [
                    "Added /settings layout with SettingsSubNav.tsx tab bar (Database, Currency, Translation).",
                    "Translation config moved from /setup to /settings/translation for consistency.",
                    "/setup retained as legacy entry point.",
                  ],
                },
              ].map((entry) => (
                <Card key={entry.version}>
                  <CardHeader>
                    <div className="flex items-baseline gap-3">
                      <CardTitle>{entry.version}</CardTitle>
                      <span className="text-xs" style={{ color: "#a19f9d" }}>{entry.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3">
                    <ul className="space-y-1.5">
                      {entry.changes.map((c, i) => (
                        <li key={i} className="text-sm flex gap-2" style={{ color: "#605e5c" }}>
                          <span style={{ color: "#107c10" }}>+</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </Section>

          </main>
        </div>
      </div>
    </div>
  );
}
