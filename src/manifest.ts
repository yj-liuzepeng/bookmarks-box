/*
 * @Author: lzp
 * @Date: 2022-10-21 18:17:08
 * @Description: file content
 */
import packageJson from "../package.json";
import { ManifestType } from './manifest-type'
const manifest: ManifestType = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  // options_page: "src/pages/options/index.html",
  background: { service_worker: "src/pages/background/index.js" },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: {
      "16": "icon16.png",
      "32": "icon32.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  icons: {
    "16": "icon16.png",
    "32": "icon32.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  web_accessible_resources: [
    {
      resources: [
        "assets/js/*.js",
        "assets/css/*.css",
      ],
      matches: ["*://*/*"],
    },
  ],
  permissions: [
    "storage",
    "activeTab",
    "scripting",
    "contextMenus",
    "notifications",
    "bookmarks",
    "tabs"
  ],
};

export default manifest;
