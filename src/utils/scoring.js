
export function calculateScore(s){
  return (s.catches||0)+(s.pass_yards||0)/25+(s.rush_rec_yards||0)/10+(s.tds||0)*6-(s.turnovers||0)*2+(s.two_pt||0)*2+(s.misc_td||0)*2+(s.return_yards||0)/20
}
