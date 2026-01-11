export function calculateScore(s) {
  let score = 0;

  // Combined: Catches/Sacks/XP/DFP
  // For now treating as combined value at 1 point each
  score += (s.catches_sacks || 0) * 1;

  // Passing Yards (25 yards = 1 pt)
  score += (s.pass_yards || 0) / 25;

  // Combined: Rush/Rec/FG Yards (10 yards = 1 pt)
  score += (s.rush_rec_fg_yards || 0) / 10;

  // Touchdowns (6 pts each)
  score += (s.tds || 0) * 6;

  // Turnovers: INT + Fumbles Lost (-2 pts each)
  score -= (s.turnovers || 0) * 2;

  // 2-Point Conversions (2 pts each)
  score += (s.two_pt || 0) * 2;

  // Combined: Def TO + Safety + Misc TD (2 pts each)
  // Note: This combines different scoring events
  score += (s.def_turnovers_misc || 0) * 2;

  // Return Yards (20 yards = 1 pt)
  score += (s.return_yards || 0) / 20;

  return Math.round(Math.max(0, score) * 100) / 100;
}
