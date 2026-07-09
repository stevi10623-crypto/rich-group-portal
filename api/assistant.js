// Personal-assistant command parser. Anita types or SAYS something in plain words
// ("add a to-do to call the Nguyens", "listing appointment at 3pm with Tina",
// "remind me to follow up Friday") and this turns it into a stored action.
//
// POST { command }                 -> parse via LLM, store, return { reply, type, item }
// POST { action:"complete", id }   -> mark a to-do done
// POST { action:"delete", id, list } -> remove an item
// GET                              -> { todos, appointments, notes }

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "assistant.json");

const OLLAMA_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";

const DEFAULT = { todos: [], appointments: [], notes: [] };
function load() { try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { return JSON.parse(JSON.stringify(DEFAULT)); } }
function store(o) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); }
function uid(p) { return p + "_" + Date.now() + "_" + Math.floor(Math.random() * 1e6); }

async function ollama(system, user, max) {
  let last = "empty";
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: max || 300, temperature: 0.3 }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) { last = "Ollama " + res.status; continue; }
      const t = (await res.json())?.choices?.[0]?.message?.content?.trim();
      if (t) return t;
    } catch (e) { last = String(e.message || e); }
  }
  throw new Error(last);
}

function extractJson(raw) {
  let s = String(raw || "").replace(/```(json)?/g, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < 0) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json(load());
    const b = req.body || {};

    if (b.action === "complete") {
      const cur = load();
      cur.todos = cur.todos.map((t) => (t.id === b.id ? { ...t, done: !t.done } : t));
      store(cur); return res.status(200).json({ ok: true });
    }
    if (b.action === "delete") {
      const cur = load(); const list = b.list || "todos";
      if (cur[list]) cur[list] = cur[list].filter((x) => x.id !== b.id);
      store(cur); return res.status(200).json({ ok: true });
    }

    const command = (b.command || "").trim();
    if (!command) return res.status(400).json({ error: "say or type a command" });

    const sys =
      "You are Anita's personal assistant for her real-estate business. Turn her plain-language command into ONE JSON action. " +
      "Types: 'todo' (a task/reminder to do something), 'appointment' (a meeting/showing/call at a time, often with a person), " +
      "'note' (a fact to remember), 'question' (she's asking something, not giving a task). " +
      'Return ONLY JSON: {"type":"todo|appointment|note|question","title":"short clear text","time":"e.g. 3:00 PM or empty","date":"e.g. today, Friday, Jul 12, or empty","person":"name or empty","answer":"only if type is question, a short helpful answer"}. ' +
      "Infer the type sensibly: 'listing appointment at 3pm with Tina' -> appointment. 'add a to-do to call the bank' -> todo. 'how do I claim my Google page' -> question. Keep title concise and human.";
    const raw = await ollama(sys, command, 350);
    const p = extractJson(raw) || { type: "todo", title: command };
    const type = ["todo", "appointment", "note", "question"].includes(p.type) ? p.type : "todo";
    const cur = load();
    let item = null, reply = "";

    if (type === "question") {
      reply = p.answer || "I'm not sure on that one — try the Ask AI box for a fuller answer.";
      return res.status(200).json({ ok: true, type, reply });
    }
    if (type === "appointment") {
      item = { id: uid("apt"), title: p.title || command, time: p.time || "", date: p.date || "", person: p.person || "", at: new Date().toISOString() };
      cur.appointments.unshift(item);
      reply = `Added appointment: ${item.title}${item.person ? " with " + item.person : ""}${item.time ? " at " + item.time : ""}${item.date ? " (" + item.date + ")" : ""}.`;
    } else if (type === "note") {
      item = { id: uid("note"), title: p.title || command, at: new Date().toISOString() };
      cur.notes.unshift(item);
      reply = `Noted: ${item.title}.`;
    } else {
      item = { id: uid("todo"), title: p.title || command, time: p.time || "", date: p.date || "", done: false, at: new Date().toISOString() };
      cur.todos.unshift(item);
      reply = `Added to your to-do list: ${item.title}${item.date ? " (" + item.date + (item.time ? " " + item.time : "") + ")" : ""}.`;
    }
    store(cur);
    return res.status(200).json({ ok: true, type, item, reply });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
