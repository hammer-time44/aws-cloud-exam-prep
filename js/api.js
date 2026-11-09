// Loads the JSON data files that sit next to the frontend. Every function returns parsed JSON or throws.
async function get(file) {
  const res = await fetch("/data/" + file);
  if (!res.ok) throw new Error("Request failed: " + file + " (" + res.status + ")");
  return res.json();
}

export const Api = {
  modules: () => get("modules.json"),
  papers: () => get("papers.json")
};
