import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#0F172A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F8FAFC",
          fontFamily: "serif",
          fontWeight: 700,
          borderRadius: "6px",
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline" }}>
          K<span style={{ color: "#D97706", marginLeft: "1px" }}>.</span>
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
