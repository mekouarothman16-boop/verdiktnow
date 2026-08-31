import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { hero } = getDictionary(lang).landing;
  const tagline = `${hero.titleLine} ${hero.titleHighlight}.`;

  const bg = await readFile(join(process.cwd(), "public/generated/og-bg.png"));
  const bgSrc = `data:image/png;base64,${bg.toString("base64")}`;

  const outfitBold = await readFile(join(process.cwd(), "src/assets/fonts/Outfit-Bold.ttf"));

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
          position: "relative",
          backgroundColor: "#091315",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgSrc} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 90px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#091315",
              border: "1px solid rgba(215,255,83,0.35)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: "5px solid #d7ff53",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                transform: "rotate(45deg)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Outfit",
              fontWeight: 700,
              fontSize: 68,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 22,
            }}
          >
            Verdikt<span style={{ color: "#d7ff53" }}>Now</span>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Outfit",
              fontWeight: 500,
              fontSize: 30,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 760,
              lineHeight: 1.35,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Outfit", data: outfitBold, weight: 700, style: "normal" }],
    },
  );
}
