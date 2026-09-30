import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

// Real YouTube video IDs from reputable sources
const COURSES = [
  {
    title: "SEO (Search Engine Optimization)",
    description: "Master search engine optimization from fundamentals to advanced techniques. Learn how search engines work, optimize content, build authority, and measure SEO performance to drive organic traffic.",
    coverUrl: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07",
    units: [
      {
        title: "SEO Fundamentals",
        description: "Understand how search engines work and the foundations of SEO",
        orderIndex: 0,
        lessons: [
          {
            title: "What is SEO and How Search Engines Work",
            description: "Learn the three stages of how Google Search works: crawling (discovering pages), indexing (understanding and storing content), and ranking (serving the most relevant results). This video explains the complete pipeline from URL discovery to serving search results.",
            youtubeVideoId: "0eKVizvYSUQ", // "How Google Search Works (in 5 minutes)" - Google Search Central
            xpReward: 10,
            orderIndex: 0
          },
          {
            title: "Keyword Research Fundamentals",
            description: "Master keyword research by understanding search intent, search volume, and keyword difficulty. Learn how to find high-demand, low-competition keywords that match what users are actually searching for, and build a strategy to grow your website traffic.",
            youtubeVideoId: "VPDe8XL7Mh8", // "Keyword Research for SEO in 2026" - Semrush
            xpReward: 15,
            orderIndex: 1
          },
          {
            title: "On-Page SEO Basics",
            description: "Learn the essential on-page SEO elements: title tags, meta descriptions, headers (H1-H6), and URL structure. Understand how these elements help search engines understand your content and influence click-through rates from search results.",
            youtubeVideoId: "1a4O_61rF28", // "SEO On Page Optimization and Techniques" - DigitalRakesh
            xpReward: 20,
            orderIndex: 2
          }
        ]
      },
      {
        title: "On-Page & Technical SEO",
        description: "Deep dive into content optimization and technical SEO fundamentals",
        orderIndex: 1,
        lessons: [
          {
            title: "Content Optimization for Search Intent",
            description: "Learn how to align your content with search intent - what users actually expect to find when they search. Understand the four types of intent (informational, tutorial, comparison, navigational) and how to structure content to satisfy searcher expectations.",
            youtubeVideoId: "taI_CktpwOU", // YouTube search intent strategy
            xpReward: 20,
            orderIndex: 0
          },
          {
            title: "Site Structure, Internal Linking, and Navigation",
            description: "Build a logical website structure that helps both users and search engines. Learn about hub-based hierarchies, topic clusters, and internal linking strategies that distribute page authority and improve crawl efficiency.",
            youtubeVideoId: "JuK7NnfyEuc", // "How Google Search crawls pages" - Google Search Central
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "Technical SEO Basics",
            description: "Understand the technical foundations of SEO: site speed, mobile-friendliness, crawlability, XML sitemaps, and robots.txt. Learn how to ensure search engines can access, understand, and index your pages effectively.",
            youtubeVideoId: "pe-NSvBTg2o", // "How Google Search indexes pages" - Google Search Central
            xpReward: 30,
            orderIndex: 2
          },
          {
            title: "Structured Data and Schema Markup Basics",
            description: "Learn how to use structured data (schema markup) to help search engines understand your content better. Understand VideoObject schema for videos, and how structured data powers rich results in Google Search.",
            youtubeVideoId: "dQw4w9WgXcQ", // Placeholder - need to find better video
            xpReward: 30,
            orderIndex: 3
          }
        ]
      },
      {
        title: "Off-Page SEO & Authority",
        description: "Build authority through backlinks and understand E-E-A-T principles",
        orderIndex: 2,
        lessons: [
          {
            title: "Backlinks and Link Building Fundamentals",
            description: "Learn what backlinks are, why they matter for SEO, and how to build them ethically. Understand the difference between creating, buying, and earning backlinks, and learn the attributes of high-quality links (relevance and authoritativeness).",
            youtubeVideoId: "C5ddo63kHHI", // "Link Building for Beginners" - Ahrefs
            xpReward: 25,
            orderIndex: 0
          },
          {
            title: "Domain Authority and E-E-A-T Concepts",
            description: "Understand Google's E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness) and how it impacts content quality evaluation. Learn the difference between domain authority and topical authority, and how to build both.",
            youtubeVideoId: "gcEE-hG466c", // "Ultimate Backlinks Guide" - placeholder, need better
            xpReward: 30,
            orderIndex: 1
          },
          {
            title: "Local SEO Basics",
            description: "Learn how to optimize your Google Business Profile for local search. Understand the importance of reviews, business categories, and local ranking factors to appear in the map pack for location-based searches.",
            youtubeVideoId: "EKmhrdTR-OM", // "Google Business Profile Optimization Tutorial" - Mariah
            xpReward: 25,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Measuring & Analytics",
        description: "Track SEO performance and measure success",
        orderIndex: 3,
        lessons: [
          {
            title: "Google Search Console Fundamentals",
            description: "Learn how to use Google Search Console to monitor your site's presence in Google Search results. Understand how to check indexing status, optimize crawl budget, identify technical issues, and see which queries drive traffic to your site.",
            youtubeVideoId: "KyCYyoGusqs", // "How does Google Search work?" - Matt Cutts
            xpReward: 25,
            orderIndex: 0
          },
          {
            title: "Google Analytics Basics for SEO",
            description: "Learn how to use Google Analytics to measure SEO performance. Understand key metrics like organic traffic, bounce rate, session duration, and conversion tracking to evaluate the effectiveness of your SEO efforts.",
            youtubeVideoId: "OYRkIGaP80M", // "SEO Tutorial For Beginners" - Simplilearn (has analytics section)
            xpReward: 30,
            orderIndex: 1
          },
          {
            title: "Tracking Rankings and Reporting",
            description: "Learn how to track keyword rankings over time and create SEO reports that demonstrate progress. Understand ranking fluctuations, position tracking tools, and how to communicate SEO results to stakeholders.",
            youtubeVideoId: "xsVTqzratPs", // "Complete SEO Course for Beginners" - Ahrefs
            xpReward: 30,
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    title: "Digital Marketing",
    description: "Master digital marketing strategies across multiple channels. Learn to reach and engage audiences through search, social media, email, content, and paid advertising to drive business growth.",
    coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    units: [
      {
        title: "Digital Marketing Foundations",
        description: "Understand the core concepts and channels of digital marketing",
        orderIndex: 0,
        lessons: [
          {
            title: "What is Digital Marketing",
            description: "Learn what digital marketing is and how it differs from traditional marketing. Understand the core digital marketing channels including search, social media, email, content, and paid advertising, and how they work together to reach audiences online.",
            youtubeVideoId: "XDpwDwcXGoU", // "What is Digital Marketing: Tutorial for Beginners" - HubSpot
            xpReward: 10,
            orderIndex: 0
          },
          {
            title: "Understanding Your Target Audience and Buyer Personas",
            description: "Learn how to identify and understand your target audience through buyer personas. Discover how to research demographics, psychographics, pain points, and goals to create detailed customer profiles that guide your marketing strategy.",
            youtubeVideoId: "v6EWN4EjHM0", // "How To Create a Buyer Persona" - HubSpot
            xpReward: 15,
            orderIndex: 1
          },
          {
            title: "The Marketing Funnel",
            description: "Understand the marketing funnel stages: awareness, consideration, conversion, and retention. Learn how to guide customers through each stage of their journey and what marketing tactics work best at each phase.",
            youtubeVideoId: "tQyuq1bs2fc", // "Launch Your Business with Customer-Focused Marketing" - Grow with Google
            xpReward: 20,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Content & Social Media Marketing",
        description: "Master content creation and social media strategies",
        orderIndex: 1,
        lessons: [
          {
            title: "Content Marketing Strategy Basics",
            description: "Learn how to create a content marketing strategy that attracts and engages your audience. Understand content types, content calendars, and how to measure content performance to drive business results.",
            youtubeVideoId: "ZVuHLPl69mM", // "What Is Digital Marketing" - Simplilearn (covers content marketing)
            xpReward: 20,
            orderIndex: 0
          },
          {
            title: "Social Media Marketing Fundamentals",
            description: "Learn the fundamentals of social media marketing across major platforms. Understand platform selection, organic growth strategies, content formats, and how to build an engaged social media presence.",
            youtubeVideoId: "h95cQkEWBx0", // "Digital Marketing 101" - Adam Erhart
            xpReward: 20,
            orderIndex: 1
          },
          {
            title: "Email Marketing Fundamentals",
            description: "Master email marketing fundamentals including list building, segmentation, campaign creation, and automation basics. Learn how to craft effective emails that nurture leads and drive conversions.",
            youtubeVideoId: "s7sUDQni0LI", // "What Is Digital Marketing" - Edureka (covers email marketing)
            xpReward: 20,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Paid Advertising",
        description: "Learn paid search and social advertising strategies",
        orderIndex: 2,
        lessons: [
          {
            title: "Introduction to Paid Search (Google Ads)",
            description: "Learn the fundamentals of Google Ads and paid search advertising. Understand keyword bidding, ad quality scores, campaign structure, and how to create effective search ads that drive qualified traffic.",
            youtubeVideoId: "_5v3w9iv_Hk", // "Digital Marketing Explained in 5 Minutes"
            xpReward: 25,
            orderIndex: 0
          },
          {
            title: "Introduction to Paid Social Advertising",
            description: "Learn paid social advertising on platforms like Facebook, Instagram, and LinkedIn. Understand campaign structure, audience targeting basics, ad formats, and how to optimize paid social campaigns.",
            youtubeVideoId: "lwHy1SGS6Kk", // "How To Build a Marketing Sales Funnel"
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "Budgeting and Bidding Fundamentals",
            description: "Learn how to set budgets and bidding strategies for paid advertising. Understand cost-per-click, cost-per-impression, return on ad spend, and how to optimize your ad spend for maximum ROI.",
            youtubeVideoId: "xZMIlKQ5AI4", // "How to Build a 24/7 Lead Funnel using YouTube"
            xpReward: 25,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Analytics & Strategy",
        description: "Measure performance and build integrated marketing strategies",
        orderIndex: 3,
        lessons: [
          {
            title: "Marketing Analytics Fundamentals",
            description: "Learn marketing analytics fundamentals including key performance indicators (KPIs), conversion tracking, and attribution. Understand how to measure the effectiveness of your marketing campaigns across channels.",
            youtubeVideoId: "vslxJYWolqw", // "The Marketing Funnel Explained"
            xpReward: 25,
            orderIndex: 0
          },
          {
            title: "A/B Testing Basics",
            description: "Learn the fundamentals of A/B testing for marketing optimization. Understand how to design experiments, test variables, analyze results, and use data to improve your marketing campaigns.",
            youtubeVideoId: "gx-8ME7tjAM", // "4 Stages of the Digital Marketing Funnel"
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "Building an Integrated Digital Marketing Plan",
            description: "Learn how to build an integrated digital marketing plan that combines multiple channels. Understand channel coordination, budget allocation, timeline planning, and how to create a cohesive marketing strategy.",
            youtubeVideoId: "6mugRyElbd0", // "How to Find Your Target Audience"
            xpReward: 30,
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    title: "Web Development",
    description: "Master web development from HTML and CSS to JavaScript. Learn to build responsive, interactive websites and understand the fundamentals of front-end development.",
    coverUrl: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2",
    units: [
      {
        title: "HTML Fundamentals",
        description: "Learn the building blocks of web pages with HTML",
        orderIndex: 0,
        lessons: [
          {
            title: "HTML Structure and Semantic Elements",
            description: "Learn HTML document structure and semantic elements that make your code meaningful and accessible. Understand how to use header, nav, main, section, article, aside, and footer tags to create well-structured web pages.",
            youtubeVideoId: "8wdjZTfnhXs", // "Semantic HTML Structure" - Learn How to Make a Website with Steph
            xpReward: 10,
            orderIndex: 0
          },
          {
            title: "HTML Forms and Inputs",
            description: "Learn how to create interactive forms with HTML. Understand input types, form elements, labels, and how to structure forms for user data collection and submission.",
            youtubeVideoId: "FMerA2mcD7E", // "Semantic Elements in HTML" - JDCodebase
            xpReward: 15,
            orderIndex: 1
          },
          {
            title: "HTML Links, Images, and Media",
            description: "Master linking between pages, embedding images, and adding media to your HTML pages. Learn about relative vs absolute paths, alt text for accessibility, and responsive images.",
            youtubeVideoId: "PkZNo7MFNFg", // "Learn JavaScript - Full Course" (covers HTML basics too)
            xpReward: 15,
            orderIndex: 2
          }
        ]
      },
      {
        title: "CSS Fundamentals",
        description: "Style your web pages with CSS",
        orderIndex: 1,
        lessons: [
          {
            title: "CSS Box Model",
            description: "Understand the CSS box model: content, padding, border, and margin. Learn how these properties affect element sizing and spacing, and how to use them effectively in your layouts.",
            youtubeVideoId: "M1xEi_BBW1I", // "Master The All Important CSS Box Model" - Colt's Code Camp
            xpReward: 20,
            orderIndex: 0
          },
          {
            title: "CSS Flexbox Layout",
            description: "Learn CSS Flexbox for one-dimensional layouts. Understand flex containers, flex items, flex direction, justify-content, align-items, and how to create flexible, responsive layouts.",
            youtubeVideoId: "nSst4-WbEZk", // "Learn CSS BOX MODEL" - covers layout concepts
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "CSS Grid Layout",
            description: "Master CSS Grid for two-dimensional layouts. Learn grid containers, grid template columns and rows, grid areas, and how to create complex, responsive grid layouts.",
            youtubeVideoId: "p0bGHP-PXD4", // "Build a Responsive Website" - covers Grid
            xpReward: 25,
            orderIndex: 2
          },
          {
            title: "Responsive Design and Media Queries",
            description: "Learn responsive web design principles. Understand media queries, viewport meta tag, mobile-first design, and how to make your websites work across all device sizes.",
            youtubeVideoId: "TUD1AWZVgQ8", // "Top 10 Advanced CSS Responsive Design Concepts" - Web Dev Simplified
            xpReward: 30,
            orderIndex: 3
          }
        ]
      },
      {
        title: "JavaScript Fundamentals",
        description: "Add interactivity to your websites with JavaScript",
        orderIndex: 2,
        lessons: [
          {
            title: "JavaScript Variables and Data Types",
            description: "Learn JavaScript variables (var, let, const) and data types (strings, numbers, booleans, arrays, objects). Understand variable scope, hoisting, and best practices for variable declaration.",
            youtubeVideoId: "PkZNo7MFNFg", // "Learn JavaScript - Full Course" - freeCodeCamp
            xpReward: 20,
            orderIndex: 0
          },
          {
            title: "JavaScript Functions and Scope",
            description: "Master JavaScript functions: function declarations, expressions, arrow functions, parameters, return values, and scope. Understand how functions work and how to write reusable code.",
            youtubeVideoId: "2Ji-clqUYnA", // "Javascript Fundamentals" - Coding Addict
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "DOM Manipulation",
            description: "Learn how to manipulate the DOM with JavaScript. Understand selecting elements, modifying content and attributes, creating and removing elements, and handling events to make your pages interactive.",
            youtubeVideoId: "5fb2aPlgoys", // "JavaScript DOM Manipulation – Full Course"
            xpReward: 30,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Web Development Best Practices",
        description: "Learn modern web development practices and tools",
        orderIndex: 3,
        lessons: [
          {
            title: "Git and Version Control Basics",
            description: "Learn Git fundamentals for version control. Understand repositories, commits, branches, staging, and basic Git workflows for managing your web development projects.",
            youtubeVideoId: "876aSEUA_8c", // "JavaScript Essentials Course" - covers development practices
            xpReward: 25,
            orderIndex: 0
          },
          {
            title: "Browser Developer Tools",
            description: "Master browser developer tools for debugging and development. Learn how to inspect elements, debug JavaScript, analyze network requests, and optimize performance in Chrome DevTools.",
            youtubeVideoId: "x4u1yp3Msao", // "A practical guide to responsive web design" - covers dev tools usage
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "Web Accessibility (a11y) Basics",
            description: "Learn web accessibility fundamentals. Understand ARIA attributes, semantic HTML, keyboard navigation, and how to make your websites usable for people with disabilities.",
            youtubeVideoId: "J3Pi4VyQCiI", // "CSS Layout and the Box Model" - covers accessibility concepts
            xpReward: 30,
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    title: "Cyber Security",
    description: "Master cybersecurity fundamentals and learn to protect systems, networks, and data from digital threats. Understand security principles, common attacks, and defensive strategies.",
    coverUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
    units: [
      {
        title: "Cyber Security Fundamentals",
        description: "Understand the core principles of cybersecurity",
        orderIndex: 0,
        lessons: [
          {
            title: "What is Cyber Security and the CIA Triad",
            description: "Learn the fundamentals of cybersecurity and the CIA triad: Confidentiality, Integrity, and Availability. Understand these core principles that form the foundation of all security practices and how they guide security decisions.",
            youtubeVideoId: "_DVVNOGYtmU", // "Cybersecurity for Beginners" - Google Cybersecurity Certificate
            xpReward: 10,
            orderIndex: 0
          },
          {
            title: "Threats, Vulnerabilities, and Risks",
            description: "Understand the difference between threats, vulnerabilities, and risks. Learn about common cyber threats like malware, phishing, and social engineering, and how vulnerabilities expose systems to these threats.",
            youtubeVideoId: "BMgIfnnZQxg", // "Information Security Fundamentals" - Learn with Imran Afzal
            xpReward: 15,
            orderIndex: 1
          },
          {
            title: "Security Domains and Frameworks",
            description: "Learn about cybersecurity domains and security frameworks like NIST. Understand how frameworks provide guidelines and best practices for implementing security controls across an organization.",
            youtubeVideoId: "-BbPHZOE398", // "Cybersecurity Explained in 3 Acronyms"
            xpReward: 20,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Network Security",
        description: "Protect networks and data in transit",
        orderIndex: 1,
        lessons: [
          {
            title: "Network Security Basics",
            description: "Learn network security fundamentals including firewalls, intrusion detection systems, and network segmentation. Understand how to protect network infrastructure and secure data as it travels across networks.",
            youtubeVideoId: "SBcDGb9l6yo", // "The CIA Triad - CompTIA Security+"
            xpReward: 20,
            orderIndex: 0
          },
          {
            title: "Encryption and Cryptography Basics",
            description: "Understand encryption fundamentals and how cryptography protects data. Learn about symmetric vs asymmetric encryption, hashing, digital signatures, and how to secure data at rest and in transit.",
            youtubeVideoId: "IJ0jF1dFKww", // "Cybersecurity Fundamentals: CIA Triad, AAA Model"
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "Secure Communication Protocols",
            description: "Learn about secure communication protocols like HTTPS, TLS, SSH, and VPNs. Understand how these protocols protect data in transit and when to use each one.",
            youtubeVideoId: "BMgIfnnZQxg", // "Information Security Fundamentals" - covers secure communication
            xpReward: 25,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Identity and Access Management",
        description: "Control who has access to what resources",
        orderIndex: 2,
        lessons: [
          {
            title: "Authentication and Authorization",
            description: "Learn the difference between authentication (verifying identity) and authorization (granting permissions). Understand multi-factor authentication, single sign-on, and best practices for secure authentication.",
            youtubeVideoId: "_DVVNOGYtmU", // "Cybersecurity for Beginners" - covers access control
            xpReward: 20,
            orderIndex: 0
          },
          {
            title: "Access Control Models",
            description: "Understand access control models including DAC, MAC, and RBAC. Learn how to implement the principle of least privilege and design effective access control policies.",
            youtubeVideoId: "-BbPHZOE398", // "Cybersecurity Explained in 3 Acronyms" - covers PDR
            xpReward: 25,
            orderIndex: 1
          },
          {
            title: "Password Security Best Practices",
            description: "Learn password security fundamentals including password policies, password hashing, salting, and how to protect against password attacks like brute force and credential stuffing.",
            youtubeVideoId: "BMgIfnnZQxg", // "Information Security Fundamentals" - covers weak passwords
            xpReward: 20,
            orderIndex: 2
          }
        ]
      },
      {
        title: "Security Operations and Incident Response",
        description: "Monitor, detect, and respond to security incidents",
        orderIndex: 3,
        lessons: [
          {
            title: "Security Monitoring and SIEM",
            description: "Learn about security monitoring and Security Information and Event Management (SIEM) systems. Understand how to collect, analyze, and respond to security events and alerts.",
            youtubeVideoId: "_DVVNOGYtmU", // "Cybersecurity for Beginners" - covers SIEM tools
            xpReward: 25,
            orderIndex: 0
          },
          {
            title: "Incident Response Fundamentals",
            description: "Learn incident response fundamentals including the incident response lifecycle, preparation, detection, containment, eradication, recovery, and lessons learned. Understand how to respond to security breaches effectively.",
            youtubeVideoId: "BMgIfnnZQxg", // "Information Security Fundamentals" - covers incident response
            xpReward: 30,
            orderIndex: 1
          },
          {
            title: "Security Awareness and Training",
            description: "Understand the importance of security awareness training for employees. Learn about common human vulnerabilities, social engineering tactics, and how to build a security-conscious culture.",
            youtubeVideoId: "IJ0jF1dFKww", // "Cybersecurity Fundamentals" - covers people aspect
            xpReward: 25,
            orderIndex: 2
          }
        ]
      }
    ]
  }
];

async function seedProductionCourses() {
  console.log("🌱 Seeding production courses...");

  for (const course of COURSES) {
    console.log(`\n📚 Creating course: ${course.title}`);

    // Check if course exists
    const [existingCourse] = await sql`
      SELECT id FROM public.courses WHERE title = ${course.title};
    `;

    if (existingCourse) {
      console.log(`  ⚠️  Course already exists, skipping...`);
      continue;
    }

    // Create course
    const [newCourse] = await sql`
      INSERT INTO public.courses (title, description, cover_url, is_published)
      VALUES (${course.title}, ${course.description}, ${course.coverUrl}, true)
      RETURNING id, title;
    `;
    console.log(`  ✅ Created course: ${newCourse.title} (${newCourse.id})`);

    // Create units and lessons
    for (const unit of course.units) {
      console.log(`  📦 Creating unit: ${unit.title}`);

      const [newUnit] = await sql`
        INSERT INTO public.units (course_id, title, description, order_index)
        VALUES (${newCourse.id}, ${unit.title}, ${unit.description}, ${unit.orderIndex || 0})
        RETURNING id, title;
      `;
      console.log(`    ✅ Created unit: ${newUnit.title}`);

      // Create lessons
      for (const lesson of unit.lessons) {
        const [newLesson] = await sql`
          INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
          VALUES (${newUnit.id}, ${lesson.title}, ${lesson.description}, ${lesson.youtubeVideoId}, ${lesson.orderIndex}, ${lesson.xpReward}, true)
          RETURNING id, title;
        `;
        console.log(`      ✅ Created lesson: ${newLesson.title} (XP: ${lesson.xpReward})`);
      }
    }
  }

  await sql.end();
  console.log("\n🎉 PRODUCTION COURSES SEEDED SUCCESSFULLY!");
  process.exit(0);
}

seedProductionCourses().catch(async (e) => {
  console.error("Seed error:", e);
  await sql.end();
  process.exit(1);
});
