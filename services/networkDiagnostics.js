const express = require("express");
const https = require("https");
const router = express.Router();

// TEMPORARY diagnostic route - safe to delete once you've confirmed the
// server's outbound IP is stable over time. Reports the public IP this
// server uses for outbound connections (what MongoDB Atlas actually sees),
// which is not always the same as the SSH access IP on shared hosting.
// No auth on purpose: it reveals nothing sensitive, just the server's own
// public egress IP, and this way you can open it straight from a browser.
function getOutboundIp() {
  return new Promise((resolve, reject) => {
    https
      .get("https://api.ipify.org?format=json", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data).ip);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

router.get("/api/debug/outbound-ip", async (req, res) => {
  try {
    const ip = await getOutboundIp();
    return res.status(200).json({ outboundIp: ip, checkedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ message: "Could not determine outbound IP", error: error.message });
  }
});

module.exports = router;
