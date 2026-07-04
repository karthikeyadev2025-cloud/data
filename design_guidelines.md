{
  "brand": {
    "name": "INeedLeads",
    "footer_text": "An innovation by NIKKI TECH LABS",
    "brand_attributes": [
      "enterprise-grade",
      "trustworthy",
      "fast + data-first",
      "INR-friendly for Indian SMB",
      "role clarity (tenant vs super admin)",
      "quietly innovative (subtle motion, not flashy)"
    ]
  },
  "visual_personality": {
    "style_fusion": {
      "layout_principle": "Bento grid marketing sections + dense-but-readable dashboard tables",
      "surface_style": "Premium light mode with soft glass accents (only on large surfaces) + crisp borders",
      "accent_strategy": "Ocean-teal as tenant accent (trust + freshness) + Saffron/Amber as super-admin accent (authority + caution)",
      "texture": "Subtle noise overlay on hero + section dividers (very low opacity)"
    },
    "do_not": [
      "No purple for AI/scraper UI accents",
      "No heavy gradients; keep gradients decorative and under 20% viewport",
      "No centered text layout for whole app",
      "No transition: all"
    ]
  },
  "typography": {
    "google_fonts": {
      "heading": {
        "family": "Space Grotesk",
        "weights": [500, 600, 700]
      },
      "body": {
        "family": "IBM Plex Sans",
        "weights": [400, 500, 600]
      },
      "mono": {
        "family": "IBM Plex Mono",
        "weights": [400, 500]
      }
    },
    "usage": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-xl sm:text-2xl font-semibold tracking-tight",
      "card_title": "text-sm font-semibold",
      "body": "text-sm sm:text-base leading-relaxed",
      "small": "text-xs text-muted-foreground",
      "numbers_kpi": "font-mono tabular-nums"
    },
    "letter_spacing": {
      "headings": "tracking-tight",
      "labels": "tracking-wide uppercase"
    }
  },
  "color_system": {
    "mode": "light-first (with optional dark mode later)",
    "tenant_accent": {
      "name": "Ocean Teal",
      "hex": "#0EA5A4",
      "tailwind_hint": "teal-500-ish",
      "usage": ["primary buttons", "active tabs", "focus rings", "links", "chart highlight"]
    },
    "admin_accent": {
      "name": "Saffron Amber",
      "hex": "#F59E0B",
      "tailwind_hint": "amber-500-ish",
      "usage": ["admin primary buttons", "admin active nav", "warning emphasis"]
    },
    "neutrals": {
      "bg": "#F8FAFC",
      "surface": "#FFFFFF",
      "surface_2": "#F1F5F9",
      "text": "#0B1220",
      "muted_text": "#475569",
      "border": "#E2E8F0"
    },
    "semantic": {
      "success": "#16A34A",
      "info": "#0284C7",
      "warning": "#D97706",
      "danger": "#DC2626"
    },
    "gradients": {
      "allowed": [
        {
          "name": "Hero Mist (decorative only)",
          "css": "radial-gradient(900px circle at 10% 10%, rgba(14,165,164,0.18), transparent 55%), radial-gradient(700px circle at 90% 20%, rgba(2,132,199,0.14), transparent 55%), radial-gradient(800px circle at 50% 110%, rgba(245,158,11,0.10), transparent 60%)",
          "rules": "Use only as section background overlay; never behind dense text; keep within hero top area (<20% viewport)."
        }
      ],
      "prohibited_examples": [
        "blue-500 to purple-600",
        "purple-500 to pink-500",
        "green-500 to blue-500",
        "red to pink"
      ]
    }
  },
  "design_tokens": {
    "css_custom_properties": {
      "note": "Main agent should update /app/frontend/src/index.css :root tokens to match below. Keep shadcn token structure (HSL values).",
      "tenant": {
        "--primary": "173 84% 36%",
        "--primary-foreground": "0 0% 100%",
        "--ring": "173 84% 36%",
        "--background": "210 40% 98%",
        "--foreground": "222 47% 11%",
        "--muted": "210 40% 96%",
        "--muted-foreground": "215 16% 35%",
        "--border": "214 32% 91%",
        "--card": "0 0% 100%",
        "--card-foreground": "222 47% 11%"
      },
      "admin_override": {
        "strategy": "On /admin routes, wrap layout with <div className=\"admin-scope\"> and override CSS vars for accent only.",
        "--primary": "38 92% 50%",
        "--ring": "38 92% 50%"
      },
      "radius": {
        "--radius": "0.75rem",
        "card": "rounded-xl",
        "button": "rounded-lg",
        "input": "rounded-lg"
      },
      "shadows": {
        "sm": "0 1px 2px rgba(2,6,23,0.06)",
        "md": "0 10px 30px rgba(2,6,23,0.08)",
        "glass": "0 12px 40px rgba(2,6,23,0.10)"
      }
    },
    "spacing_scale": {
      "system": "Tailwind spacing with deliberate breathing room",
      "section_padding": "py-14 sm:py-20",
      "container": "max-w-6xl mx-auto px-4 sm:px-6",
      "dashboard_gutter": "gap-4 sm:gap-6",
      "card_padding": "p-4 sm:p-6"
    }
  },
  "layout": {
    "grid": {
      "marketing": "12-col grid on desktop; bento sections use grid-cols-1 sm:grid-cols-2 lg:grid-cols-12",
      "dashboard": "Sidebar + content; content uses max-w-[1400px] with responsive padding",
      "tables": "Use horizontal scroll on mobile via <ScrollArea> or overflow-x-auto wrapper"
    },
    "navigation": {
      "tenant": {
        "pattern": "Collapsible sidebar on desktop + bottom sheet nav on mobile",
        "components": ["sheet", "navigation-menu", "breadcrumb"]
      },
      "admin": {
        "pattern": "Same IA but different accent + stronger density",
        "components": ["sheet", "breadcrumb", "tabs"]
      }
    }
  },
  "components": {
    "primary_stack": {
      "shadcn_paths": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/table.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/slider.jsx",
        "/app/frontend/src/components/ui/skeleton.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/calendar.jsx"
      ]
    },
    "component_recipes": {
      "buttons": {
        "variants": {
          "tenant_primary": "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring",
          "tenant_secondary": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          "ghost": "hover:bg-accent hover:text-accent-foreground",
          "admin_primary": "admin-scope:bg-primary admin-scope:text-primary-foreground"
        },
        "motion": "hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] transition-[background-color,box-shadow,color,opacity] duration-200"
      },
      "inputs": {
        "style": "Use Input + Label; add helper text; show error state with text-destructive",
        "focus": "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      },
      "badges": {
        "credits": "Badge variant=secondary + font-mono tabular-nums",
        "status": "Use semantic colors: success/info/warning/danger"
      },
      "tables": {
        "pattern": "Sticky header, zebra hover, row actions in rightmost column",
        "mobile": "Wrap in <ScrollArea className=\"w-full\"> or overflow-x-auto"
      },
      "tabs_scraper_selector": {
        "pattern": "TabsList as pill group; each tab has icon + label; active uses primary tint",
        "data-testid": "scraper-type-tabs"
      },
      "dialogs": {
        "buy_credits": "Dialog with plan summary + Razorpay CTA; include trust copy + GST invoice note"
      },
      "toasts": {
        "library": "sonner",
        "usage": "Success on export, error on API failure, info on credits low"
      }
    }
  },
  "motion_microinteractions": {
    "library": {
      "recommended": "framer-motion",
      "install": "npm i framer-motion",
      "usage": "Use for hero entrance, KPI card stagger, sidebar open/close easing"
    },
    "principles": [
      "Entrance: fade + slight y (6-10px) for sections",
      "Hover: buttons lift 1px; cards lift 2px with shadow-md",
      "Loading: skeletons for tables + cards; progress bar for scraping",
      "Reduce motion: respect prefers-reduced-motion"
    ],
    "durations": {
      "fast": "150-200ms",
      "standard": "220-280ms",
      "slow": "400-600ms (hero only)"
    },
    "easing": {
      "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    }
  },
  "data_visualization": {
    "charts": {
      "library": "recharts",
      "admin_pages": ["/admin", "/admin/transactions"],
      "palette": {
        "primary_series": "var(--chart-2) (teal family)",
        "secondary_series": "var(--chart-4) (amber family)",
        "neutral_series": "var(--chart-3)"
      },
      "patterns": [
        "Headline KPI row above charts",
        "Tooltips with formatted INR",
        "Empty state: show last 7 days placeholder"
      ]
    }
  },
  "page_by_page_wireframes": {
    "/": {
      "sections": [
        {
          "name": "Navbar",
          "layout": "Left: logo + product; Right: Pricing, Docs, Login, Primary CTA",
          "components": ["navigation-menu", "button"],
          "notes": "Sticky with blur (backdrop-blur) on scroll; include data-testid on CTAs"
        },
        {
          "name": "Hero",
          "layout": "Split: left copy + right interactive demo card",
          "demo": "Mini search widget (keyword + location + scraper type) that routes to /login",
          "components": ["card", "tabs", "input", "select", "button"],
          "background": "Hero Mist gradient overlay + subtle noise",
          "trust_row": "Logos/metrics: '10k+ searches', 'Excel-ready', 'INR billing'"
        },
        {
          "name": "Scrapers Bento Grid",
          "layout": "Bento grid 2x3 on desktop; each tile has icon, 2-line description, sample output chips",
          "tiles": [
            "Google Maps Scraper",
            "Google Search Results Scraper",
            "YouTube Scraper",
            "Instagram Scraper",
            "Facebook Posts Scraper",
            "E-commerce Scraping Tool"
          ],
          "components": ["card", "badge", "button"],
          "interaction": "Hover reveals 'View fields' tooltip"
        },
        {
          "name": "How it works",
          "layout": "3-step timeline with icons + short copy",
          "steps": ["Choose scraper", "Run search", "Export CSV/XLSX"],
          "components": ["card", "separator"]
        },
        {
          "name": "Pricing",
          "layout": "4 cards with highlighted Pro; INR pricing; monthly toggle optional",
          "components": ["card", "badge", "button", "switch"],
          "notes": "Include 'GST invoice' and 'Razorpay' trust line"
        },
        {
          "name": "Testimonials",
          "layout": "3 cards; include city tags (Hyderabad/Chennai/Bangalore/Kochi)",
          "components": ["card", "avatar", "badge"]
        },
        {
          "name": "Footer",
          "layout": "Columns: Product, Company, Legal; bottom line includes footer_text",
          "components": ["separator"],
          "notes": "Always show: 'An innovation by NIKKI TECH LABS'"
        }
      ]
    },
    "/login": {
      "layout": "Two-column on desktop: left brand + trust copy; right auth card. Mobile: stacked.",
      "components": ["card", "button", "input", "label", "separator"],
      "states": ["Google OAuth button", "Super admin password form (collapsed accordion)"]
    },
    "/dashboard": {
      "layout": "Sidebar + topbar. Topbar right: Credits badge + Buy Credits button + profile menu.",
      "components": ["badge", "button", "card", "dropdown-menu", "sheet"],
      "content": [
        "KPI cards row (3-4)",
        "Quick Search widget card",
        "Recent searches table (compact)"
      ]
    },
    "/search": {
      "layout": "Header with page title + credits; Tabs selector; form card; results preview card.",
      "components": ["tabs", "card", "input", "select", "slider", "button", "skeleton", "table"],
      "table_columns": ["Name", "Phone", "Email", "Website", "Instagram", "Facebook", "LinkedIn", "Address", "Rating"],
      "actions": ["Export CSV", "Export XLSX"],
      "loading": "Show skeleton rows + progress bar"
    },
    "/history": {
      "layout": "Filter row (date range via Calendar popover, scraper type select, status chips) + table",
      "components": ["calendar", "popover", "select", "table", "badge"]
    },
    "/billing": {
      "layout": "Current plan card + usage meter + pricing cards + transaction history table",
      "components": ["card", "progress", "dialog", "table", "badge", "button"],
      "notes": "All prices show ₹; include invoice download action"
    },
    "/admin": {
      "layout": "Admin scope accent (amber). KPI row + charts (Recharts) + alerts panel.",
      "components": ["card", "badge", "tabs"],
      "charts": ["Revenue (₹) line", "Search volume bar", "Credit burn area"]
    },
    "/admin/tenants": {
      "layout": "Dense table with row actions: activate/deactivate, allocate credits, change plan",
      "components": ["table", "dropdown-menu", "dialog", "input", "select"],
      "notes": "Row actions must be accessible on mobile via overflow menu"
    },
    "/admin/settings": {
      "layout": "Form sections per provider (Google, YouTube, SerpAPI, Apify, Razorpay) with masked inputs",
      "components": ["card", "input", "label", "tabs", "button"],
      "notes": "Add 'Test key' button per provider + toast result"
    },
    "/admin/plans": {
      "layout": "Plans table + edit plan dialog; include credits per ₹ and limits",
      "components": ["table", "dialog", "input", "switch", "badge"]
    },
    "/admin/transactions": {
      "layout": "Filters + transactions table + chart summary",
      "components": ["table", "select", "calendar", "card"]
    },
    "/admin/audit": {
      "layout": "Timeline-like table with actor, action, timestamp, IP",
      "components": ["table", "badge", "scroll-area"]
    },
    "/404": {
      "layout": "Simple helpful empty state with CTA back to dashboard/home",
      "components": ["card", "button"]
    }
  },
  "images": {
    "image_urls": [
      {
        "category": "landing_hero_background",
        "description": "Soft teal mesh background for hero (use as decorative overlay, low opacity)",
        "url": "https://images.unsplash.com/photo-1617957848811-9c07f14d7ba3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxsaWdodCUyMHRlYWwlMjBncmFkaWVudCUyMG1lc2glMjBiYWNrZ3JvdW5kfGVufDB8fHx0ZWFsfDE3ODMxMTM5ODF8MA&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "landing_social_proof",
        "description": "Business team photo for testimonials/about strip (use sparingly; crop to faces/upper body)",
        "url": "https://images.pexels.com/photos/7581119/pexels-photo-7581119.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "landing_secondary_background",
        "description": "Abstract data network / lights for section divider (very low opacity, blur)",
        "url": "https://images.unsplash.com/photo-1572282431238-bd1d44df8550?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhdGElMjBuZXR3b3JrJTIwbGluZXMlMjBsaWdodCUyMGJhY2tncm91bmR8ZW58MHx8fGJsdWV8MTc4MzExMzk2N3ww&ixlib=rb-4.1.0&q=85"
      }
    ]
  },
  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text/buttons",
      "Visible focus rings (ring + ring-offset)",
      "Keyboard navigable tabs, menus, dialogs",
      "Use aria-label for icon-only buttons",
      "Respect prefers-reduced-motion"
    ],
    "tables": [
      "Ensure header cells are <th>",
      "Provide empty state copy and actions",
      "Avoid color-only status; include text"
    ]
  },
  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid (kebab-case, role-based).",
    "examples": [
      "data-testid=\"navbar-login-button\"",
      "data-testid=\"hero-demo-run-search-button\"",
      "data-testid=\"dashboard-buy-credits-button\"",
      "data-testid=\"search-export-csv-button\"",
      "data-testid=\"admin-settings-save-google-key-button\"",
      "data-testid=\"credits-badge\""
    ]
  },
  "instructions_to_main_agent": {
    "component_path": {
      "shadcn": "/app/frontend/src/components/ui/",
      "note": "Project uses .jsx (not .tsx). Keep new components in .jsx and follow named export convention for components."
    },
    "implementation_notes": [
      "Remove CRA default centered App styles; do not use .App { text-align:center }.",
      "Update index.css tokens to match tenant palette; add .admin-scope CSS var overrides for admin accent.",
      "Use shadcn/ui components for all inputs, dialogs, tabs, tables, calendar.",
      "Use Sonner for toasts (already present).",
      "Add data-testid to every button/input/link/table action and key KPI values.",
      "Keep gradients decorative only (hero background overlay).",
      "Use INR formatting (₹) everywhere in billing/admin revenue charts."
    ],
    "extra_libraries": [
      {
        "name": "framer-motion",
        "why": "Micro-interactions + entrance animations for landing and dashboard",
        "install": "npm i framer-motion",
        "usage_hint": "Wrap sections with motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}"
      }
    ]
  },
  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
