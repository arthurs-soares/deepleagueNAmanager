/**
 * Calcula ranking com base em vitórias/derrotas
 * Aceita (wins, losses) ou objeto { wins, losses }
 */
function calcRatio(winsOrObj, losses) {
  const w = typeof winsOrObj === 'object' && winsOrObj !== null ? (winsOrObj.wins || 0) : (winsOrObj || 0);
  const l = typeof winsOrObj === 'object' && winsOrObj !== null ? (winsOrObj.losses || 0) : (losses || 0);
  const total = w + l;
  if (total === 0) return 0;
  return w / total;
}

function sortByRanking(guilds) {
  return [...(guilds || [])].sort((a, b) => {
    const ra = calcRatio(a);
    const rb = calcRatio(b);
    if (rb !== ra) return rb - ra;
    // desempate por número de vitórias, depois por nome
    if ((b.wins||0) !== (a.wins||0)) return (b.wins||0) - (a.wins||0);
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

module.exports = { calcRatio, sortByRanking };

