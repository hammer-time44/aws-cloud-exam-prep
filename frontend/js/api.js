// Talks to the backend. Every function returns parsed JSON or throws.
async function get(path) {
  const res = await fetch("/api" + path);
  if (!res.ok) throw new Error("Request failed: " + path + " (" + res.status + ")");
  return res.json();
}

export const Api = {
  modules: () => get("/modules"),
  papers: () => get("/papers")
};
