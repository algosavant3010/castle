import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Castle - Secure autonomy for the agent economy on Monad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080A",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.15,
            backgroundImage:
              "linear-gradient(rgba(131,110,249,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(131,110,249,0.3) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(131,110,249,0.12) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />

        {/* Castle icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3 1V4L4.66667 5.66667L4.2 8H2V6H0V15H6V12C6 10.8954 6.89543 10 8 10C9.10457 10 10 10.8954 10 12V15H16V6H14V8H11.8L11.3333 5.66667L13 4V1H11V3H9V1H7V3H5V1H3Z"
              fill="#836EF9"
            />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: 600,
            color: "#F4F4F5",
            letterSpacing: "-0.03em",
            marginBottom: "16px",
          }}
        >
          Castle
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            fontWeight: 400,
            color: "#8A8A93",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Secure autonomy for the agent economy on Monad
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #836EF9, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
