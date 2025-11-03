export async function getPlayerNames(matchId) {
  const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;

  const response = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_API_KEY
    }
  });

  if (!response.ok) {
    console.error(`Failed to fetch match data: ${response.status}`);
    return [];
  }

  const data = await response.json();
  const names = [];

  // Extract player names from home and away teams
  const homePlayers = data.homeTeam?.squad || [];
  const awayPlayers = data.awayTeam?.squad || [];

  for (const player of [...homePlayers, ...awayPlayers]) {
    if (player.name) names.push(player.name.toLowerCase());
  }

  return names;
}