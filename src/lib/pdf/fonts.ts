import path from "node:path";
import { Font } from "@react-pdf/renderer";

const DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
const file = (filename: string) => path.join(DIR, filename);

let registered = false;

export function registerReportFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: file("Inter-Regular.ttf"), fontWeight: 400 },
      { src: file("Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: file("Inter-Bold.ttf"), fontWeight: 700 },
      { src: file("Inter-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });

  Font.register({
    family: "JetBrains Mono",
    fonts: [
      { src: file("JetBrainsMono-Regular.ttf"), fontWeight: 400 },
      { src: file("JetBrainsMono-SemiBold.ttf"), fontWeight: 600 },
      { src: file("JetBrainsMono-Bold.ttf"), fontWeight: 700 },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}
