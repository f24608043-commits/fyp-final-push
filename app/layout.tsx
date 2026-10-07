import type { Metadata, Viewport } from "next";
import { Rubik, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import dynamic from "next/dynamic";

// Lazy load ChatWidget to avoid impacting initial bundle size
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  loading: () => null,
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LEGO - Learn And Go",
  description: "AI-powered, gamified learning with video lessons, quizzes, and live tutoring.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#58CC02",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${nunitoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&icon_names=add,admin_panel_settings,arrow_back,arrow_forward,assignment,block,bolt,calendar_month,campaign,cancel,chat,check,check_circle,close,cloud_upload,code_blocks,dashboard,diversity_3,data_object,delete,description,edit,emoji_events,event,event_available,event_busy,folder,forum,groups,history,home,info,leaderboard,local_fire_department,lock,login,menu,menu_book,mic,military_tech,note,notes,notifications,pending,people,person,person_add,play_circle,privacy_tip,quiz,radio_button_checked,refresh,rocket_launch,save,schedule,school,search,send,settings,short_text,shield,smart_display,speaker_notes_off,star,stars,support_agent,supervised_user_circle,terminal,timer,tips_and_updates,toggle_on,trending_up,videocam,videocam_off,volume_up&display=swap" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LEGO Learning" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    if (registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    }
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary font-body-md w-full overflow-x-hidden">
        <Shell>{children}</Shell>
        <ChatWidget />
      </body>
    </html>
  );
}
