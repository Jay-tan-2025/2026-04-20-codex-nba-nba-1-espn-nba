const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const ESPN_SUMMARY_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary";
const ESPN_ATHLETE_URL =
  "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes";
const ESPN_ATHLETE_CATALOG_URL =
  "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes";

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`ESPN 请求失败: ${response.status}`);
  }

  return response.json();
}

function toSafeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function average(list) {
  if (!list.length) return 0;
  return list.reduce((sum, item) => sum + item, 0) / list.length;
}

function mapScoreboardEvent(event) {
  const competition = event.competitions?.[0];
  const home = competition?.competitors?.find((team) => team.homeAway === "home");
  const away = competition?.competitors?.find((team) => team.homeAway === "away");

  return {
    id: event.id,
    name: event.name,
    status: event.status?.type?.description || "未知状态",
    shortStatus: event.status?.type?.shortDetail || event.status?.type?.detail || "未知",
    startTime: event.date,
    homeTeam: {
      id: home?.team?.id,
      name: home?.team?.displayName,
      shortName: home?.team?.shortDisplayName,
      abbreviation: home?.team?.abbreviation,
      logo: home?.team?.logo,
      score: home?.score || "0"
    },
    awayTeam: {
      id: away?.team?.id,
      name: away?.team?.displayName,
      shortName: away?.team?.shortDisplayName,
      abbreviation: away?.team?.abbreviation,
      logo: away?.team?.logo,
      score: away?.score || "0"
    }
  };
}

async function getTodayScoreboard() {
  const data = await fetchJson(ESPN_SCOREBOARD_URL);
  return {
    generatedAt: new Date().toISOString(),
    leagues: data.leagues || [],
    games: (data.events || []).map(mapScoreboardEvent)
  };
}

function extractPlayerRow(summary, playerId) {
  const groups = summary.boxscore?.players || [];

  for (const teamGroup of groups) {
    for (const statGroup of teamGroup.statistics || []) {
      for (const athleteEntry of statGroup.athletes || []) {
        if (athleteEntry.athlete?.id === String(playerId)) {
          return {
            athlete: athleteEntry.athlete,
            stats: athleteEntry.stats || [],
            labels: statGroup.labels || []
          };
        }
      }
    }
  }

  return null;
}

function buildRecentGames(gameLog) {
  const names = gameLog.names || [];
  const eventIds = Object.keys(gameLog.events || {});

  const rows = eventIds
    .map((eventId) => {
      const event = gameLog.events[eventId];
      const stats = event.stats || [];
      const mapped = {};

      names.forEach((name, index) => {
        mapped[name] = stats[index];
      });

      return {
        eventId,
        gameDate: event.gameDate,
        opponent: event.opponent?.displayName || "未知对手",
        result: event.gameResult || "",
        score: event.score || "",
        minutes: toSafeNumber(mapped.minutes),
        rebounds: toSafeNumber(mapped.totalRebounds),
        assists: toSafeNumber(mapped.assists),
        points: toSafeNumber(mapped.points),
        steals: toSafeNumber(mapped.steals),
        blocks: toSafeNumber(mapped.blocks),
        turnovers: toSafeNumber(mapped.turnovers)
      };
    })
    .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

  return rows;
}

function buildSeasonStats(overviewStats) {
  const labels = overviewStats.labels || [];
  const names = overviewStats.names || [];
  const regularSeason =
    (overviewStats.splits || []).find((item) => item.displayName === "Regular Season") ||
    overviewStats.splits?.[0] ||
    { stats: [] };

  const mapped = {};
  names.forEach((name, index) => {
    mapped[name] = regularSeason.stats?.[index] || "0";
  });

  return {
    labelList: labels,
    gamesPlayed: toSafeNumber(mapped.gamesPlayed),
    avgMinutes: toSafeNumber(mapped.avgMinutes),
    avgRebounds: toSafeNumber(mapped.avgRebounds),
    avgAssists: toSafeNumber(mapped.avgAssists),
    avgPoints: toSafeNumber(mapped.avgPoints),
    fieldGoalPct: toSafeNumber(mapped.fieldGoalPct),
    threePointPct: toSafeNumber(mapped.threePointPct),
    freeThrowPct: toSafeNumber(mapped.freeThrowPct)
  };
}

function buildBiasWarning(seasonStats, recentGames) {
  const recentFive = recentGames.slice(0, 5);
  if (!recentFive.length) {
    return {
      isWarning: false,
      message: "最近 5 场样本不足，暂不生成偏见提醒。"
    };
  }

  const recentPoints = average(recentFive.map((item) => item.points));
  const recentRebounds = average(recentFive.map((item) => item.rebounds));
  const recentAssists = average(recentFive.map((item) => item.assists));

  const pointGap = recentPoints - seasonStats.avgPoints;
  const reboundGap = recentRebounds - seasonStats.avgRebounds;
  const assistGap = recentAssists - seasonStats.avgAssists;
  const maxGap = Math.max(Math.abs(pointGap), Math.abs(reboundGap), Math.abs(assistGap));
  const isWarning = maxGap >= 3;

  return {
    isWarning,
    message: isWarning
      ? `警告：最近 5 场与赛季平均差异较大。得分 ${pointGap.toFixed(1)}，篮板 ${reboundGap.toFixed(1)}，助攻 ${assistGap.toFixed(1)}。请避免只凭近期表现下判断。`
      : "最近 5 场与赛季平均接近，暂未发现明显的近期偏见风险。",
    recentAverages: {
      points: Number(recentPoints.toFixed(1)),
      rebounds: Number(recentRebounds.toFixed(1)),
      assists: Number(recentAssists.toFixed(1))
    }
  };
}

async function getPlayerDetails(playerId) {
  const [overview, gameLog] = await Promise.all([
    fetchJson(`${ESPN_ATHLETE_URL}/${playerId}/overview`),
    fetchJson(`${ESPN_ATHLETE_URL}/${playerId}/gamelog`)
  ]);

  const seasonStats = buildSeasonStats(overview.statistics || {});
  const recentGames = buildRecentGames(gameLog);

  return {
    generatedAt: new Date().toISOString(),
    playerId: String(playerId),
    seasonStats,
    recentGames: recentGames.slice(0, 5),
    biasWarning: buildBiasWarning(seasonStats, recentGames)
  };
}

async function searchPlayers(keyword) {
  const firstPage = await fetchJson(`${ESPN_ATHLETE_CATALOG_URL}?limit=25&page=1`);
  const pageCount = Math.min(firstPage.pageCount || 1, 8);
  const refs = [...(firstPage.items || [])];

  for (let page = 2; page <= pageCount; page += 1) {
    const nextPage = await fetchJson(`${ESPN_ATHLETE_CATALOG_URL}?limit=25&page=${page}`);
    refs.push(...(nextPage.items || []));
  }

  const athleteIds = refs
    .map((item) => item["$ref"])
    .filter(Boolean)
    .map((ref) => ref.match(/athletes\/(\d+)/)?.[1])
    .filter(Boolean);

  const uniqueIds = [...new Set(athleteIds)].slice(0, 120);
  const result = [];

  for (const athleteId of uniqueIds) {
    try {
      const data = await fetchJson(`${ESPN_ATHLETE_URL}/${athleteId}`);
      const name = data.displayName || "";
      if (name.toLowerCase().includes(keyword.toLowerCase())) {
        result.push({
          id: data.id,
          displayName: data.displayName,
          shortName: data.shortName,
          team: data.team?.displayName || "自由球员/未知",
          position: data.position?.displayName || "未知",
          headshot: data.headshot?.href || ""
        });
      }

      if (result.length >= 10) break;
    } catch (error) {
      continue;
    }
  }

  return result;
}

async function getGamePlayerStat(eventId, playerId) {
  const summary = await fetchJson(`${ESPN_SUMMARY_URL}?event=${eventId}`);
  const playerRow = extractPlayerRow(summary, playerId);

  if (!playerRow) return null;

  const map = {};
  (playerRow.labels || []).forEach((label, index) => {
    map[label] = playerRow.stats[index];
  });

  return {
    eventId: String(eventId),
    playerId: String(playerId),
    playerName: playerRow.athlete?.displayName || "未知球员",
    team: playerRow.athlete?.team?.displayName || "",
    stats: {
      points: toSafeNumber(map.PTS),
      rebounds: toSafeNumber(map.REB),
      assists: toSafeNumber(map.AST)
    }
  };
}

module.exports = {
  getTodayScoreboard,
  getPlayerDetails,
  searchPlayers,
  getGamePlayerStat
};
