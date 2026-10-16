
export default async function handler(req, res) {
  const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRaZXpB6uEaylgtugQfxqTFSgLMypAxopCvLfUrwn_pnmZ-NukGvpJyABqed6-4GA/pub?output=csv";

  try {
    const response = await fetch(url);
    const csv = await response.text();

    if (!response.ok || !csv.includes(",")) {
      throw new Error("Google Sheets did not return CSV data");
    }

    const lines = csv.trim().split(/\r?\n/);
    const headers = lines.shift().split(",");

    res.status(200).json({
      updatedAt: new Date().toISOString(),
      headers,
      rows: lines.map(line => line.split(","))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
