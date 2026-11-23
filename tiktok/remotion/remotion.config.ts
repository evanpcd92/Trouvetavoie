import fs from "fs";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Dans les sessions cloud, le téléchargement de Chrome est bloqué : on utilise le Chromium préinstallé.
const LOCAL_CHROME = "/opt/pw-browsers/chromium_headless_shell";
if (fs.existsSync(LOCAL_CHROME)) Config.setBrowserExecutable(LOCAL_CHROME);
