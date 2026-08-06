import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: "#0F172A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F8FAFC",
          fontFamily: "serif",
          fontWeight: 700,
          borderRadius: "36px",
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline" }}>
          K<span style={{ color: "#D97706", marginLeft: "2px" }}>.</span>
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
