import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

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

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "#f3f2f1", borderBottom: "1px solid #edebe9" }}>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f2f1" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-sm align-top" style={{ color: j === 0 ? "#323130" : "#605e5c" }}>
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
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Documentation" subtitle="Complete reference for the WebShop Manager project" />
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
          </aside>

          {/* Content */}
          <main className="flex-1 p-8 max-w-4xl space-y-10 overflow-y-auto">

            {/* OVERVIEW */}
            <Section id="overview" title="Overview">
              <Card>
                <CardContent className="py-4 space-y-3">
                  <p className="text-sm" style={{ color: "#323130" }}>
                    <strong>WebShop Manager</strong> is a centralized multi-site WooCommerce product management tool.
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
                      ["Database", "SQLite", "—", "Local file-based relational database"],
                      ["Auth", "NextAuth.js", "v4", "Session management, credentials login"],
                      ["Passwords", "bcryptjs", "—", "Password hashing"],
                      ["Validation", "Zod", "v3", "Schema validation on API inputs"],
                      ["WooCommerce", "REST API v3", "—", "Product push/pull to remote stores"],
                      ["Translation", "LibreTranslate", "—", "Open-source machine translation API"],
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
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Database seed script
│   └── dev.db                 # SQLite database file (gitignored)
├── public/
│   └── uploads/               # Uploaded product images (gitignored)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/page.tsx # Login page
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/[...nextauth]/route.ts
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
│   │   │   ├── setup/route.ts            # GET config, POST save
│   │   │   └── upload/route.ts           # POST image upload
│   │   ├── dashboard/page.tsx # Dashboard with stats + activity
│   │   ├── docs/page.tsx      # This documentation page
│   │   ├── products/
│   │   │   ├── page.tsx       # Product list table
│   │   │   ├── new/page.tsx   # Create product form
│   │   │   └── [id]/page.tsx  # Edit product (tabs)
│   │   ├── sites/
│   │   │   ├── page.tsx       # Site list table
│   │   │   ├── new/page.tsx   # Create site form
│   │   │   └── [id]/page.tsx  # Edit site form
│   │   ├── setup/page.tsx     # App configuration
│   │   ├── globals.css        # Global styles + Tailwind import
│   │   ├── layout.tsx         # Root layout with SessionProvider
│   │   └── providers.tsx      # NextAuth SessionProvider wrapper
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx    # Left nav with active state
│   │   │   └── Header.tsx     # Top bar with user + sign out
│   │   └── ui/
│   │       ├── Badge.tsx      # Status badges + SyncStatusBadge
│   │       ├── Button.tsx     # Button variants
│   │       ├── Card.tsx       # Card, CardHeader, CardContent, CardTitle
│   │       ├── ImageUploader.tsx # Drag-and-drop image upload
│   │       └── Input.tsx      # Input, Textarea, Select
│   ├── generated/
│   │   └── prisma/            # Prisma generated client (gitignored)
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
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
                SQLite database managed by Prisma 6. File located at <Code>prisma/dev.db</Code>.
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
                    Known keys: <Code>libreTranslateUrl</Code>, <Code>libreTranslateApiKey</Code>, <Code>defaultSourceLanguage</Code>, <Code>autoTranslate</Code>
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
                  <p className="text-xs" style={{ color: "#605e5c" }}>The central product record. Images, categories, and tags are stored as JSON strings (arrays) since SQLite has no native array type.</p>
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
                <CardHeader><CardTitle>Entity Relationship</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <CodeBlock>{`Product  ──< ProductSync >──  Site
Product  ──< ProductTranslation

Cascade deletes:
  Delete Product  →  removes all ProductSync + ProductTranslation rows
  Delete Site     →  removes all ProductSync rows for that site`}
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
                  group: "Upload",
                  routes: [
                    { method: "POST", path: "/api/upload", desc: "Upload a product image. Accepts multipart/form-data with file field. Validates type (JPEG/PNG/WebP/GIF) and size (≤5MB). Saves to public/uploads/ with UUID filename. Returns { url: '/uploads/filename.ext' }." },
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
                      [<Code key="/products">/products</Code>, <Badge key="c4" color="blue">Client</Badge>, "Searchable/filterable product table with sync status and live site links."],
                      [<Code key="/products/new">/products/new</Code>, <Badge key="c5" color="blue">Client</Badge>, "Create product form. Includes image uploader and website selection for immediate sync."],
                      [<Code key="/products/id">/products/[id]</Code>, <Badge key="c6" color="blue">Client</Badge>, "Tabbed product editor: Details (edit fields), Translations (auto-translate), Sync (push to sites)."],
                      [<Code key="/setup">/setup</Code>, <Badge key="c7" color="blue">Client</Badge>, "Configure LibreTranslate URL, API key, source language, and auto-translate toggle."],
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
                  name: "ImageUploader",
                  path: "components/ui/ImageUploader.tsx",
                  desc: "Drag-and-drop + click-to-upload zone. Uploads files one at a time to POST /api/upload. Shows upload spinner. Preview grid of uploaded images with hover ×-button to remove. Controlled: receives images[] + onChange().",
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
                  <CodeBlock>{`# Database — must be absolute path for Prisma + SQLite
DATABASE_URL="file:/absolute/path/to/stepv5-webshop/prisma/dev.db"

# NextAuth — any long random string
NEXTAUTH_SECRET="your-secret-key-here"

# NextAuth URL — your local dev URL
NEXTAUTH_URL="http://localhost:3000"`}
                  </CodeBlock>
                  <SubSection title="First-time setup commands">
                    <CodeBlock>{`# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

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

          </main>
        </div>
      </div>
    </div>
  );
}
