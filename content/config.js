// Portal runtime config. apiBase = where the generation APIs live ("" = same origin).
// rgapi.myroostcrm.com = named Cloudflare tunnel to the LAN engines (3090 + Ollama Cloud relay).
window.PORTAL_CONFIG = { apiBase: (location.hostname.indexOf("vercel.app") > -1 || location.hostname.indexOf("myroostcrm") === -1 && location.hostname !== "localhost") ? "https://rgapi.myroostcrm.com" : "" };
