import { ImageResponse } from "next/og";
import {
  LuLayoutDashboard,
  LuCoins,
  LuFolderKanban,
  LuMail,
  LuBrainCircuit,
  LuUsers,
  LuFileText,
  LuBarChart3,
  LuSettings,
  LuSearch,
  LuBell,
  LuPlus,
  LuTrendingUp,
  LuCheckCircle,
  LuMapPin,
  LuBuilding2
} from "react-icons/lu";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = new URL(request.url).origin;

    // Fetch font
    const interBold = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff").then(
      (res) => res.arrayBuffer()
    );

    const titleParam = searchParams.get("title")?.slice(0, 100);
    const description = searchParams.get("description")?.slice(0, 200) || "The AI-Native CRM for Modern Sales Teams";
    const badge = searchParams.get("badge");
    const type = searchParams.get("type") || "default";

    const isDefaultTitle = !titleParam || titleParam === "Ledger1CRM";
    const displayTitle = isDefaultTitle ? null : titleParam;

    // Function to render widgets based on type
    const renderWidgets = () => {
      switch (type) {
        case "competitor":
          return (
            <>
              {/* Comparison Widget */}
              <div
                style={{
                  width: "340px",
                  height: "200px",
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Feature Comparison</div>
                  <LuTrendingUp size={18} color="#22d3ee" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <LuCheckCircle size={16} color="#10b981" />
                    <div style={{ display: "flex", fontSize: 13, color: "white" }}>AI Automation</div>
                    <div style={{ display: "flex", marginLeft: "auto", fontSize: 13, color: "#22d3ee", fontWeight: 700 }}>2x Faster</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <LuCheckCircle size={16} color="#10b981" />
                    <div style={{ display: "flex", fontSize: 13, color: "white" }}>Cost Efficiency</div>
                    <div style={{ display: "flex", marginLeft: "auto", fontSize: 13, color: "#22d3ee", fontWeight: 700 }}>60% Less</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <LuCheckCircle size={16} color="#10b981" />
                    <div style={{ display: "flex", fontSize: 13, color: "white" }}>Setup Time</div>
                    <div style={{ display: "flex", marginLeft: "auto", fontSize: 13, color: "#22d3ee", fontWeight: 700 }}>5 Minutes</div>
                  </div>
                </div>
              </div>

              {/* ROI Widget */}
              <div
                style={{
                  width: "340px",
                  height: "160px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(34, 211, 238, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  transform: "translateX(-30px)",
                }}
              >
                <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Switch & Save</div>
                <div style={{ display: "flex", fontSize: 36, color: "#22d3ee", fontWeight: 800 }}>$24K/yr</div>
                <div style={{ display: "flex", fontSize: 12, color: "#64748b" }}>Average savings for teams of 10</div>
              </div>
            </>
          );

        case "industry":
          return (
            <>
              {/* Industry Stats Widget */}
              <div
                style={{
                  width: "340px",
                  height: "200px",
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <LuBuilding2 size={18} color="#a78bfa" />
                  <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Industry Impact</div>
                </div>
                <div style={{ display: "flex", fontSize: 32, color: "white", fontWeight: 700, marginBottom: "10px" }}>89%</div>
                <div style={{ display: "flex", fontSize: 13, color: "#94a3b8", marginBottom: "auto" }}>Productivity increase reported</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[85, 72, 94, 68, 90].map((h, i) => (
                    <div key={i} style={{ display: "flex", flex: 1, height: `${h}%`, background: i === 2 ? "#a78bfa" : "#334155", borderRadius: "4px" }} />
                  ))}
                </div>
              </div>

              {/* Use Cases Widget */}
              <div
                style={{
                  width: "340px",
                  height: "160px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(167, 139, 250, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  transform: "translateX(-30px)",
                }}
              >
                <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600, marginBottom: "5px" }}>Top Use Cases</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
                  <div style={{ display: "flex", fontSize: 13, color: "white" }}>Lead Management</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
                  <div style={{ display: "flex", fontSize: 13, color: "white" }}>Customer Support</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
                  <div style={{ display: "flex", fontSize: 13, color: "white" }}>Sales Automation</div>
                </div>
              </div>
            </>
          );

        case "location":
          return (
            <>
              {/* Location Stats Widget */}
              <div
                style={{
                  width: "340px",
                  height: "200px",
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <LuMapPin size={18} color="#34d399" />
                  <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Local Growth</div>
                </div>
                <div style={{ display: "flex", fontSize: 32, color: "white", fontWeight: 700, marginBottom: "8px" }}>1,247</div>
                <div style={{ display: "flex", fontSize: 13, color: "#94a3b8", marginBottom: "auto" }}>Active businesses in your area</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ display: "flex", fontSize: 12, color: "#34d399", fontWeight: 600 }}>+24%</div>
                  <div style={{ display: "flex", fontSize: 12, color: "#64748b" }}>growth this quarter</div>
                </div>
              </div>

              {/* Local Support Widget */}
              <div
                style={{
                  width: "340px",
                  height: "160px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  transform: "translateX(-30px)",
                }}
              >
                <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Local Support</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>24/7</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: 14, color: "white", fontWeight: 600 }}>24/7 Local Hours</div>
                    <div style={{ display: "flex", fontSize: 12, color: "#64748b" }}>Your timezone, your language</div>
                  </div>
                </div>
              </div>
            </>
          );

        default:
          // Default dashboard widgets
          return (
            <>
              {/* Widget 1: Revenue Chart */}
              <div
                style={{
                  width: "340px",
                  height: "200px",
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Total Revenue</div>
                  <div style={{ display: "flex", fontSize: 14, color: "#22d3ee", fontWeight: 600 }}>+12.5%</div>
                </div>
                <div style={{ display: "flex", fontSize: 32, color: "white", fontWeight: 700, marginBottom: "auto" }}>$124,500</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px" }}>
                  {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} style={{ display: "flex", flex: 1, height: `${h}%`, background: i === 5 ? "#22d3ee" : "#334155", borderRadius: "4px" }} />
                  ))}
                </div>
              </div>

              {/* Widget 2: Recent Activity */}
              <div
                style={{
                  width: "340px",
                  height: "160px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  transform: "translateX(-30px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>JD</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: 14, color: "white", fontWeight: 600 }}>New Deal Closed</div>
                    <div style={{ display: "flex", fontSize: 12, color: "#64748b" }}>Just now</div>
                  </div>
                </div>
                <div style={{ display: "flex", width: "100%", height: "1px", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>AI</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: 14, color: "white", fontWeight: 600 }}>Meeting Scheduled</div>
                    <div style={{ display: "flex", fontSize: 12, color: "#64748b" }}>2 mins ago</div>
                  </div>
                </div>
              </div>
            </>
          );
      }
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#02040a",
            fontFamily: "Inter",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* --- BACKGROUND LAYERS --- */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 100%, #111827 0%, #000000 100%)",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "-20%",
              left: "-10%",
              width: "800px",
              height: "800px",
              background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: "-10%",
              right: "-5%",
              width: "700px",
              height: "700px",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(circle at center, black 40%, transparent 80%)",
            }}
          />

          {/* --- MOCK SIDEBAR --- */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "80px",
              height: "100%",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              backgroundColor: "rgba(0,0,0,0.3)",
              alignItems: "center",
              paddingTop: "30px",
              gap: "30px",
              zIndex: 20,
            }}
          >
            {/* Sidebar Icons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "25px", alignItems: "center" }}>
              <div style={{ display: "flex", width: "40px", height: "40px", borderRadius: "8px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                {/* Logo Placeholder */}
                <div style={{ display: "flex", width: "20px", height: "20px", background: "white", borderRadius: "4px" }} />
              </div>

              <LuLayoutDashboard size={24} color="#94a3b8" />
              <LuCoins size={24} color="#22d3ee" style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.5))" }} />
              <LuFolderKanban size={24} color="#94a3b8" />
              <LuMail size={24} color="#94a3b8" />
              <LuBrainCircuit size={24} color="#94a3b8" />
              <LuUsers size={24} color="#94a3b8" />
              <LuFileText size={24} color="#94a3b8" />
              <LuBarChart3 size={24} color="#94a3b8" />
            </div>

            <div style={{ display: "flex", marginTop: "auto", marginBottom: "30px" }}>
              <LuSettings size={24} color="#475569" />
            </div>
          </div>

          {/* --- MAIN CONTENT AREA --- */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 10 }}>

            {/* --- MOCK HEADER --- */}
            <div
              style={{
                display: "flex",
                height: "70px",
                width: "100%",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              {/* Search Bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "8px", width: "300px" }}>
                <LuSearch size={18} color="#64748b" />
                <div style={{ display: "flex", height: "8px", width: "100px", background: "#334155", borderRadius: "4px" }} />
              </div>

              {/* Right Header Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#22d3ee", padding: "6px 12px", borderRadius: "6px" }}>
                  <LuPlus size={16} color="black" />
                  <div style={{ display: "flex", fontSize: 12, fontWeight: 700, color: "black" }}>NEW</div>
                </div>
                <LuBell size={20} color="#94a3b8" />
                <div style={{ display: "flex", width: "32px", height: "32px", borderRadius: "50%", background: "#334155", border: "2px solid #1e293b" }} />
              </div>
            </div>

            {/* --- DASHBOARD CONTENT --- */}
            <div style={{ display: "flex", flex: 1, padding: "50px 60px", alignItems: "center", justifyContent: "space-between" }}>

              {/* LEFT: Typography */}
              <div style={{ display: "flex", flexDirection: "column", maxWidth: "55%", gap: "20px" }}>
                {badge && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 16px",
                      background: "rgba(34, 211, 238, 0.1)",
                      border: "1px solid rgba(34, 211, 238, 0.3)",
                      borderRadius: "100px",
                      color: "#22d3ee",
                      fontSize: 16,
                      fontWeight: 700,

                      marginBottom: "10px",
                    }}
                  >
                    {badge}
                  </div>
                )}

                {/* Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${origin}/logo.png`}
                  width="320"
                  height="85"
                  alt="Ledger1CRM"
                  style={{ objectFit: "contain", filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}
                />

                {displayTitle && (
                  <h2
                    style={{
                      display: "flex",
                      fontSize: 48,
                      fontWeight: 800,
                      margin: 0,
                      lineHeight: 1.1,
                      background: "linear-gradient(to right, #fff, #94a3b8)",
                      backgroundClip: "text",
                      color: "transparent",
                    } as any}
                  >
                    {displayTitle}
                  </h2>
                )}

                <p style={{ display: "flex", fontSize: 24, color: "#94a3b8", lineHeight: 1.5, margin: 0, maxWidth: "90%" }}>
                  {description}
                </p>
              </div>

              {/* RIGHT: Dynamic Widgets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", transform: "rotate(-2deg) translateX(20px)" }}>
                {renderWidgets()}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: interBold,
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (error: unknown) {
    console.error(error);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
