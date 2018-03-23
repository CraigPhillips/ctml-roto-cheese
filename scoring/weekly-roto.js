const { categories } = require('../scoring/categories');

class WeeklyRotoScore {
  constructor(scores) {
    this.populateFromScores(scores);
  }

  populateFromScores(scores) {
    if (!scores) throw new Error('weekly scores required');
    const teamNums = [];
    if (scores.weekNumber) this.weekNumber = scores.weekNumber;

    for (let teamNum of Object.keys(scores).filter(k => k !== 'weekNumber')) {
      const team = scores[teamNum];
      const weeklyRotoScores = { rank: 1, tieCount: 1, total: 0 };

      for (let cat of categories.all()) {
        const { biggerIsBetter } = categories.detailsFor(cat);
        let thisCatScore = team[cat];
        let thisRank = 1;
        let thisScore = 1;
        let thisTieCount = 1;

        for (let compareToTeamNum of Object.keys(scores)) {
          if (teamNum !== compareToTeamNum) {
            let compareToCatScore = scores[compareToTeamNum][cat];
            if (thisCatScore > compareToCatScore) {
              thisScore += biggerIsBetter ? 1 : 0;
              thisRank += biggerIsBetter ? 0 : 1;
            } else if (thisCatScore < compareToCatScore) {
              thisScore += biggerIsBetter ? 0 : 1;
              thisRank += biggerIsBetter ? 1 : 0;
            } else {
              thisScore += .5;
              thisTieCount += 1;
            }
          }
        }

        weeklyRotoScores[cat] = {
          rank: thisRank,
          rawScore: thisCatScore,
          rotoScore: thisScore,
          thisTieCount: thisTieCount
        };
        weeklyRotoScores.total += thisScore;
      }

      this[teamNum] = weeklyRotoScores;
      teamNums.push(teamNum);
    }

    for (let teamNum of teamNums) {
      for (let compareTo of teamNums) {
        if (teamNum !== compareTo) {
          if (this[teamNum].total < this[compareTo].total) {
            this[teamNum].rank += 1;
          } else if (this[teamNum].total === this[compareTo].total) {
            this[teamNum].tieCount += 1;
          }
        }
      }
    }
  }
}

module.exports = {
  WeeklyRotoScore,
};
