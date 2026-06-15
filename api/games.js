export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.RAWG_KEY;
  const { search } = req.query;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing RAWG_KEY in environment variables." });
  }

  if (!search || search.trim() === '') {
    return res.status(400).json({ error: "Missing search query." });
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(search.trim())}&page_size=6&ordering=-rating`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `RAWG API error: ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to fetch from RAWG" });
  }
}
