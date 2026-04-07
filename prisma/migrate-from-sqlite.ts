import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

function ts(ms: number): Date {
  return new Date(ms);
}

async function main() {
  console.log("Migrating SQLite data to PostgreSQL...");

  // ── UserRoles ─────────────────────────────────────────────────────────────
  await prisma.userRole.createMany({
    data: [
      {
        id: "cmngctc020000s8kc12jb9smn",
        name: "admin",
        label: "Administrator",
        permissions: JSON.stringify(["users.view","users.manage","products.view","products.manage","sites.view","sites.manage","setup.view","setup.manage","activity.view"]),
        createdAt: ts(1775066586620),
        updatedAt: ts(1775066586620),
      },
      {
        id: "cmngctc0i0001s8kc5z1x812r",
        name: "manager",
        label: "Manager",
        permissions: JSON.stringify(["products.view","products.manage","sites.view","sites.manage","activity.view"]),
        createdAt: ts(1775066586642),
        updatedAt: ts(1775066586642),
      },
      {
        id: "cmngctc0k0002s8kcayyt3rkm",
        name: "user",
        label: "User",
        permissions: JSON.stringify(["products.view"]),
        createdAt: ts(1775066586644),
        updatedAt: ts(1775066586644),
      },
      {
        id: "cmnge24xk0000s8xk7ajzfkml",
        name: "developer",
        label: "Developer",
        permissions: JSON.stringify(["users.view","products.manage","setup.view","setup.manage","sites.view","users.manage","products.view","sites.manage","activity.view"]),
        createdAt: ts(1775068676984),
        updatedAt: ts(1775068676984),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ UserRoles");

  // ── Users ─────────────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      {
        id: "cmngctcaw0004s8kc4gq2edq6",
        email: "admin@webshop.com",
        password: "$2a$12$RKLwmiz0wKi9C5CCsWR23uOiSqBSLGyAOBnAaVQIa6DSsR9yZj.oe",
        name: "Administrator",
        role: "admin",
        roleId: "cmngctc020000s8kc12jb9smn",
        createdAt: ts(1775066587016),
        updatedAt: ts(1775066587016),
      },
      {
        id: "cmnn6yhpp0000s8m01fo36sz0",
        email: "kim@sal-tech.com",
        password: "$2a$12$0IUzavkJXvgnnxbo.lvMtuIQRcKtJWqg4XNXjgOVmDii4Y6EhteOG",
        name: "Chris Marie Accento Ybanez",
        role: "developer",
        roleId: "cmnge24xk0000s8xk7ajzfkml",
        createdAt: ts(1775480012844),
        updatedAt: ts(1775480012844),
        address: "Upper Son-Oc Nivel Hills Lahug",
        country: "170",
        dateStarted: "2017-05-14T00:00:00.000Z",
        employeeStatus: "1",
        mobile: "+ 639 28 268 2018",
        motto: "ADELANTE Move Forward.",
        notes: "<div>Bank: Account 100678025890 SWIFT: UBPHPHMM</div>\r\n\r\n<div>&nbsp;</div>\r\n\r\n<div>Out for a short break as she was sick. Back 15 November 2017 GUS</div>\r\n\r\n<div>&nbsp;</div>\r\n\r\n<div>Height:</div>\r\n\r\n<div>Birthday: September 2, 1991</div>",
        position: "Web Developer",
        positionNote: "Web Developer",
        username: "KIM",
        zip: "2986907",
      },
      {
        id: "cmnn75wht0003s8m0rlpfkxbv",
        email: "gus@sal-tech.com",
        password: "$2a$12$EE7HlHLcneM2WVcIcZSOhui62WOtwUkA0Ak3UdqBRPWruQ9BL.pQC",
        name: "Gunnar Bjørn Salbæk",
        role: "admin",
        roleId: "cmngctc020000s8kc12jb9smn",
        createdAt: ts(1775480358593),
        updatedAt: ts(1775480358593),
        address: "Calle Jilguero 5",
        country: "65",
        dateStarted: "1995-04-07T00:00:00.000Z",
        employeeStatus: "1",
        mobile: "+4522603940",
        motto: "Keep it simple\r\nD.E.A.L.\r\nWe are not afraid to take a stand (version of Eminem)\r\nThere goes gravity (Eminem)\r\nBE HARD BUT FAIR\r\nKill to thrill, Thrill to kill\r\nJeg tror din død bliver en kæmpe succes (Fra Erik Clausen film 2017)\r\nLive life wild on the edge",
        notes: "<div>Ejer, owner, Cloth sizes: T-shirts XL to XXL, shirt 44 normal, pants Levis code 36-32, suits/coats European size 56, shoes 44½ extra wide or 45 normal never slim. Hats and helmets XXL (very big head) Gloves 10½ to 11.</div>\r\n\r\n<div>&nbsp;</div>\r\n\r\n<div>Mobile ESP was(killed): +34-638 138 782</div>\r\n\r\n<div>Skype: gunnar.salbaek</div>\r\n\r\n<div>gunnar.salbaek@gmail.com</div>\r\n\r\n<div>&nbsp;</div>\r\n\r\n<div>Private HK was: </div>\r\n\r\n<div>11/F , Flat D, 242-248 Lockhart Road , Wan Chai Hong Kong</div>",
        position: "Owner",
        telephone: "+4536452232",
        username: "GUS",
        zip: "2996205",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Users");

  // ── AppConfig ─────────────────────────────────────────────────────────────
  await prisma.appConfig.createMany({
    data: [
      { id: "cmngctcb20005s8kcd2djl5j3", key: "libreTranslateUrl", value: "https://libretranslate.com", updatedAt: ts(1775066587022) },
      { id: "cmngctcb50006s8kc72b3hrpb", key: "libreTranslateApiKey", value: "", updatedAt: ts(1775066587026) },
      { id: "cmngctcb70007s8kctxtilprd", key: "autoTranslate", value: "false", updatedAt: ts(1775066587028) },
      { id: "cmngctcb90008s8kcju2ld5nj", key: "defaultSourceLanguage", value: "en", updatedAt: ts(1775066587030) },
      {
        id: "cmnn0soo10009s8thtjegu6nq",
        key: "currencyRates",
        value: JSON.stringify([
          {"from":"EUR","to":"USD","rate":"1.152500","fetchedAt":"2026-04-06T10:06:20.115Z"},
          {"from":"DKK","to":"USD","rate":"0.154240","fetchedAt":"2026-04-06T10:06:30.197Z"},
          {"from":"DKK","to":"AUD","rate":"0.224450","fetchedAt":"2026-04-06T10:08:02.537Z"},
          {"from":"DKK","to":"GBP","rate":"0.116770","fetchedAt":"2026-04-06T10:08:17.851Z"},
        ]),
        updatedAt: ts(1775470099231),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ AppConfig");

  // ── Sites ─────────────────────────────────────────────────────────────────
  await prisma.site.createMany({
    data: [
      {
        id: "cmngesrls0001s8xkuk8jfgzn",
        name: "Sal-Tech DK",
        url: "https://sal-tech.dk",
        consumerKey: "ck_2254f690a0abff2142425edfebac188cbe722e1c",
        consumerSecret: "cs_224555e1e3c0f1bce9fb28845ec7b23bf06a7927",
        defaultLanguage: "da",
        currency: "DKK",
        status: "active",
        createdAt: ts(1775069919424),
        updatedAt: ts(1775110322952),
      },
      {
        id: "cmnh0hz340000s8qcfi95yzpu",
        name: "Sal-Tech ES",
        url: "https://woo.sal-tech.es/",
        consumerKey: "ck_7b56ba1a576dadae5def8220d54e9071a0dc5136",
        consumerSecret: "cs_ecf7cdda122866ac1fdec4ba3f5357bf7c7e1412",
        defaultLanguage: "es",
        currency: "EUR",
        status: "active",
        createdAt: ts(1775106367456),
        updatedAt: ts(1775110312120),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Sites");

  // ── MssqlConnection ───────────────────────────────────────────────────────
  await prisma.mssqlConnection.createMany({
    data: [
      {
        id: "cmnhiy89t0000s8f2wxo6rokq",
        host: "mssql14.unoeuro.com",
        port: 1433,
        database: "sal_tech_com_db_010621",
        username: "sal_tech_com",
        password: "MgAmeaRWRlaA",
        encrypt: true,
        trustCert: true,
        createdAt: ts(1775137358946),
        updatedAt: ts(1775137358946),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ MssqlConnection");

  // ── MssqlTableMapping ─────────────────────────────────────────────────────
  await prisma.mssqlTableMapping.createMany({
    data: [
      {
        id: "cmnhj3tjl0001s8f2fetcwgux",
        page: "products",
        tableName: "Product",
        searchColumn: "Item Name",
        displayColumns: JSON.stringify(["Item Name", "Item Number"]),
        fieldMappings: JSON.stringify({"title":"Item Name","shortDescription":"Description","description":"Description","price":"Price Euro","sku":"Item Number","stockQuantity":"Stock Count"}),
        createdAt: ts(1775137619793),
        updatedAt: ts(1775464600865),
      },
      {
        id: "cmnhj4a2z0002s8f2bti58s05",
        page: "users",
        tableName: "Employee",
        searchColumn: "Username",
        displayColumns: JSON.stringify(["Username", "Complete Name"]),
        fieldMappings: JSON.stringify({"name":"Complete Name","email":"Email","username":"Username","address":"Address","country":"Country ID","zip":"Zip ID","telephone":"Telephone","mobile":"Mobile","position":"Position","positionNote":"Position Note","teamLeader":"Team Leader","dateStarted":"Date Started","employeeStatus":"Status","motto":"Motto","notes":"Note"}),
        createdAt: ts(1775137641227),
        updatedAt: ts(1775475973261),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ MssqlTableMapping");

  // ── Products ──────────────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      {
        id: "cmngf0yaj0002s8xkuxauwvus",
        title: "Vacuum Sealer Smooth Bags my100 – box of 100 pieces (TEST)",
        description: "Vacuum Smooth Bags/Pouches (Pre-Cut Bags)\n\nFeatures:\n\n- Vacuum bags of various sizes\n- Resistance to freezing, can withstand the temperature change\n- keeps the freshness and the smell\n- safe to use\n\nTechnical Specifications\nMaterial\tFlexible Cast PA/HV/PE Film\nTotal Thickness\t90±10%\nYield\t11.45±10%\nTensile stress at max. load\t45\nTensile stress at break\t250-400\nSeal strength\t≥20\nOxygen Permeability\t≤3.5\nNitrogen Permeability\t<60\nCarbon Dioxide Permeability\t<190\nFood Law Compliance\tBFR, EEC, and FDA Compliant\nItem No.\t6530NNNN\n*Items are sold per 100 pcs.",
        shortDescription: "Vacuum Sealer Pouches/Bags for Sealing Machines, these are used for vacuum packaging; these are smooth professional vacuum bags that are pre-cut according to sizes. Suitable for all vacuum sealing chamber machines whether at home and abroad these bags are perfect.",
        productType: "simple",
        price: "175",
        sku: "65301525 - TEST",
        manageStock: false,
        images: JSON.stringify(["/uploads/eddf01d5-afe6-41fa-b605-a8b963e7275a.png"]),
        categories: "[]",
        tags: "[]",
        variations: JSON.stringify({"attributes":[],"items":[]}),
        status: "published",
        createdAt: ts(1775070301339),
        updatedAt: ts(1775070939181),
      },
      {
        id: "cmngfjk3g000hs8xk2v06512c",
        title: "Bag Vacuum PET/MET 82my 110my - TEST",
        description: "Food stays fresh for longer in these practical, opaque vacuum bags.\n\n• No contact with air\n• Light-sensitive products\n• Extremely versatile\n• Vacuum machine and sealer\n\n\nAvailable in thickness below:\n\n82my\n110my\nin sizes (cm):\n\n- 20 x 30\n- 25 x 35\n- 27 x 40\n- 35 x 50\n\nPacked and sold per 100pcs.",
        shortDescription: "Food grade flat alu/foil bags that are made with PET and MET - best suitable for packaging food, to secure freshness.",
        productType: "simple",
        price: "425",
        sku: "66922535 - TEST",
        manageStock: false,
        images: JSON.stringify(["/uploads/d5a1a390-4cad-41e4-9d1e-5f0b749e6274.png"]),
        categories: "[]",
        tags: "[]",
        variations: JSON.stringify({"attributes":[],"items":[]}),
        status: "published",
        createdAt: ts(1775071169405),
        updatedAt: ts(1775110424443),
      },
      {
        id: "cmnmzi2400004s8thx4nf6t5e",
        title: "HA-50 Used Machine",
        description: "HA-200 Semi Automatic stapping machine USED",
        shortDescription: "HA-200 Semi Automatic stapping machine USED",
        productType: "simple",
        price: "0",
        sku: "41000081 JC 112131",
        manageStock: false,
        images: "[]",
        categories: "[]",
        tags: "[]",
        variations: JSON.stringify({"attributes":[],"items":[]}),
        status: "published",
        createdAt: ts(1775467488816),
        updatedAt: ts(1775467488816),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Products");

  // ── ProductSync ───────────────────────────────────────────────────────────
  await prisma.productSync.createMany({
    data: [
      {
        id: "cmngf10xm0006s8xkcr53s8ea",
        productId: "cmngf0yaj0002s8xkuxauwvus",
        siteId: "cmngesrls0001s8xkuk8jfgzn",
        wooProductId: null,
        status: "failed",
        lastSyncedAt: null,
        errorMessage: "The product with SKU (65301525 - TEST) you are trying to insert is already present in the lookup table",
        createdAt: ts(1775070304762),
        updatedAt: ts(1775071590244),
      },
      {
        id: "cmngfjlb3000ls8xkrmp0is6y",
        productId: "cmngfjk3g000hs8xk2v06512c",
        siteId: "cmngesrls0001s8xkuk8jfgzn",
        wooProductId: 12791,
        status: "synced",
        lastSyncedAt: ts(1775110425979),
        createdAt: ts(1775071170975),
        updatedAt: ts(1775110425981),
      },
      {
        id: "cmnh102ec0002s8qc8p96pr2m",
        productId: "cmngf0yaj0002s8xkuxauwvus",
        siteId: "cmnh0hz340000s8qcfi95yzpu",
        wooProductId: 12281,
        status: "synced",
        lastSyncedAt: ts(1775107211552),
        createdAt: ts(1775107211554),
        updatedAt: ts(1775107211554),
      },
      {
        id: "cmnh10cdn0004s8qcocki8obp",
        productId: "cmngfjk3g000hs8xk2v06512c",
        siteId: "cmnh0hz340000s8qcfi95yzpu",
        wooProductId: 12282,
        status: "synced",
        lastSyncedAt: ts(1775110425849),
        createdAt: ts(1775107224491),
        updatedAt: ts(1775110425850),
      },
      {
        id: "cmnmzi50g0008s8thhvpq7nnl",
        productId: "cmnmzi2400004s8thx4nf6t5e",
        siteId: "cmngesrls0001s8xkuk8jfgzn",
        wooProductId: 12793,
        status: "synced",
        lastSyncedAt: ts(1775467492575),
        createdAt: ts(1775467492577),
        updatedAt: ts(1775467492577),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ ProductSync");

  console.log("\n✅ Migration complete! All data imported.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
