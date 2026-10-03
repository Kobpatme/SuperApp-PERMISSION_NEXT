import localFont from "next/font/local";
const manrope = localFont({ src: "./fonts/manrope.woff2", weight: "200 800", display: "swap", variable: "--font-manrope", preload: true });
const nunito = localFont({ src: "./fonts/nunito.woff2", weight: "200 900", display: "swap", variable: "--font-nunito", preload: true });
const thai = localFont({ src: "./fonts/noto-sans-thai.woff2", weight: "100 900", display: "swap", variable: "--font-thai", preload: true });
const mono = localFont({ src: "./fonts/source-code-pro.woff2", weight: "200 900", display: "swap", variable: "--font-code", preload: false });
export const appFontClassName = `${manrope.variable} ${nunito.variable} ${thai.variable} ${mono.variable}`;
