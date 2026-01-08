export function calculateScore(s) {
  let score = 0;

  // Offense
  score += (s.catches || 0) * 1;
  score += (s.pass_yards || 0) / 25;
  score += (s.rush_rec_yards || 0) / 10;
  score += (s.tds || 0) * 6;
  score -= (s.turnovers || 0) * 2;
  score += (s.two_pt || 0) * 2;
  score += (s.misc_td || 0) * 6; // Assuming Misc TD is a TD (6pts)

  // Kicking
  score += (s.fg_yards || 0) / 10;

  // Defense / Special Teams
  score += (s.return_yards || 0) / 20;
  score += (s.sacks || 0) * 1;
  score += (s.def_turnovers || 0) * 2;
  score += (s.safety || 0) * 2;

  // Points Allowed (only if not null/undefined)
  if (s.points_allowed !== null && s.points_allowed !== undefined) {
    const pa = s.points_allowed;
    if (pa === 0) score += 15;
    else if (pa <= 6) score += 10;
    else if (pa <= 13) score += 7;
    else if (pa <= 25) score += 3;
    else if (pa <= 35) score -= 1;
    // 36+ is 0
  }

  return Math.max(0, score);
}
