import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { calcCardScore } from "./lib/calc";
import { abilityDb } from "./data/abilityDb";
import { cards } from "./data/cards";
import { contextPresets } from "./data/contextPresets";

const CONTEXT_LABELS = {
  param_vo_total: "レッスンで獲得したVoパラメータ",
  param_da_total: "レッスンで獲得したDaパラメータ",
  param_vi_total: "レッスンで獲得したViパラメータ",

  sp_vo_count: "VoSPレッスン回数",
  sp_da_count: "DaSPレッスン回数",
  sp_vi_count: "ViSPレッスン回数",

  lesson_count: "レッスン回数",
  normal_lesson_count: "通常レッスン回数",

  enhance_count: "強化回数",
  enhance_a_count: "A札の強化回数",
  enhance_m_count: "M札の強化回数",

  delete_count: "削除回数",
  delete_a_count: "A札の削除回数",
  delete_m_count: "M札の削除回数",
  convert_count: "チェンジ回数",

  get_card_count: "カードの取得枚数",
  get_active_count: "A札の取得枚数",
  get_mental_count: "M札の取得枚数",
  get_buff_count: "好調札の取得枚数",
  get_focus_count: "集中札の取得枚数",
  get_energy_count: "元気札の取得枚数",
  get_motivation_count: "やる気札の取得枚数",
  get_impression_count: "好印象札の取得枚数",
  get_reserve_count: "温存札の取得枚数",
  get_all_out_count: "全力札の取得枚数",
  get_ssr_count: "SSR札の取得枚数",

  class_count: "授業回数",
  supply_count: "差し入れ回数",
  consult_count: "相談回数",
  outing_count: "おでかけ回数",
  rest_count: "休む回数",
  exam_end_count: "試験終了回数",
  special_training_count: "特別指導回数",

  get_drink_count: "ドリンク獲得数",
  drink_exchange_count: "相談ドリンク交換数",

  customize_count: "カスタム回数",
  get_item_count: "Pアイテム獲得数",
  param_event_count: "パラメイベの回数",
  param_event_ssr_count: "パラメイベの回数(配布SSR用)",
};


const TYPE_ORDER = ["Vo", "Da", "Vi"];
const TREND_TO_TYPES = {
  voda: ["Vo", "Da", "Vi"],
  davi: ["Da", "Vi", "Vo"],
  vovi: ["Vo", "Vi", "Da"],
};

const PATTERN_COUNTS = {
  "3/3/0": [3, 3, 0],
  "3/2/1": [3, 2, 1],
  "2/2/2": [2, 2, 2],
};
const NEW_CARD_ID = "card_108"; // あなたとふたり、電車で

function App() {

  const [mode, setMode] = useState("legend");
  const [plan, setPlan] = useState("sense");
  const [type, setType] = useState("voda");
  const [minSpCards, setMinSpCards] = useState(0);

  const [calculationTrigger, setCalculationTrigger] = useState(0);

  const [calculationSettings, setCalculationSettings] = useState({
    mode: "legend",
    plan: "sense",
    type: "voda",
    minSpCards: 0,
  });

  const calculationMode = calculationSettings.mode;
  const calculationPlan = calculationSettings.plan;
  const calculationType = calculationSettings.type;
  const calculationMinSpCards = calculationSettings.minSpCards;

  const calculationContext =
    contextPresets[calculationMode]
      .plans[calculationPlan]
      .types[calculationType]
      .context;

  const [showResult, setShowResult] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const SP_RATE_MAP = {
    SSR: 28,
    SR: 21,
  };


  const [resultViewMode, setResultViewMode] = useState("recommend");
  const [scoreListMode, setScoreListMode] = useState("owned");
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const feedbackFormUrl = "https://forms.gle/BNPXUKgdaQP4gG197";

  const xUrl = "https://x.com/wandering_sen";

  const [showChangelog, setShowChangelog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    localStorage.setItem("theme", theme);

    if (theme === "dark") {
      document.body.classList.add("darkModeBody");
      document.documentElement.classList.add("darkModeHtml");
    } else {
      document.body.classList.remove("darkModeBody");
      document.documentElement.classList.remove("darkModeHtml");
    }
  }, [theme]);

  const [ownedCards, setOwnedCards] = useState(() => {
    const saved = localStorage.getItem("ownedCards");


    if (!saved) {
      return {};
    }

    return JSON.parse(saved);
  });

  useEffect(() => {
    localStorage.setItem("ownedCards", JSON.stringify(ownedCards));
  }, [ownedCards]);

  const [calculationOwnedCards, setCalculationOwnedCards] = useState(ownedCards);

  const [ownedSearchText, setOwnedSearchText] = useState("");
  const [ownedTypeFilter, setOwnedTypeFilter] = useState("all");
  const [ownedPlanFilter, setOwnedPlanFilter] = useState("all");



  const context =
    contextPresets[mode].plans[plan].types[type].context;

  function updateOwnedCard(cardId, key, value) {
    setOwnedCards((prev) => ({
      ...prev,
      [cardId]: {
        owned: prev[cardId]?.owned ?? false,
        limitBreak: prev[cardId]?.limitBreak ?? 0,
        ...prev[cardId],
        [key]: value,
      },
    }));
  }

  function resetOwnedCards() {
    const ok = window.confirm("所持サポカ登録をすべてリセットしますか？");

    if (!ok) return;

    setOwnedCards({});
  }

  function downloadOwnedCardsCsv() {
    const rows = [["card_id", "limitBreak"]];

    Object.entries(ownedCards).forEach(([cardId, data]) => {
      if (data.owned) {
        rows.push([cardId, data.limitBreak ?? 0]);
      }
    });


    const csvText = rows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvText], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "owned_cards.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function uploadOwnedCardsCsv(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.trim().split(/\r?\n/);

      const nextOwnedCards = {};

      lines.slice(1).forEach((line) => {
        const [cardId, limitBreak] = line.split(",");

        if (!cardId) return;

        nextOwnedCards[cardId] = {
          owned: true,
          limitBreak: Number(limitBreak ?? 0),
        };
      });

      setOwnedCards(nextOwnedCards);
    };

    reader.readAsText(file);
  }

  function getSpRate(card) {
    if (!hasSpRateUp(card)) return 0;
    return SP_RATE_MAP[card.rarity] ?? 0;
    if (card.rarity === "SSR") return 28;
    if (card.rarity === "SR") return 21;

    return 0;
  }

  function hasSpRateUp(card) {
    return [
      card.ab1,
      card.ab2,
      card.ab3,
      card.ab4,
      card.ab5,
      card.ab6,
    ].includes("sp_rate_id");
  }

  function formatScore(score) {
    return Number(score ?? 0).toFixed(1);
  }

  function makeTypePattern(type, patternName) {
    const types = TREND_TO_TYPES[type];
    const counts = PATTERN_COUNTS[patternName];

    return Object.fromEntries(types.map((t, index) => [t, counts[index]]));
  }

  function combinations(array, count) {
    if (count === 0) return [[]];
    if (array.length < count) return [];

    const result = [];

    function backtrack(start, combo) {
      if (combo.length === count) {
        result.push([...combo]);
        return;
      }

      for (let i = start; i < array.length; i++) {
        combo.push(array[i]);
        backtrack(i + 1, combo);
        combo.pop();
      }
    }

    backtrack(0, []);
    return result;
  }

  function findBestOwnedCardsByPattern(ownedResults, pattern, minSpCards) {
    const groups = Object.fromEntries(
      TYPE_ORDER.map((cardType) => [
        cardType,
        ownedResults.filter((result) => result.card.param_type === cardType),
      ])
    );

    const choices = TYPE_ORDER.map((cardType) =>
      combinations(groups[cardType], pattern[cardType] ?? 0)
    );

    let bestTeam = null;
    let bestScore = -Infinity;

    for (const voGroup of choices[0]) {
      for (const daGroup of choices[1]) {
        for (const viGroup of choices[2]) {
          const team = [...voGroup, ...daGroup, ...viGroup];

          const spCount = team.filter((result) =>
            hasSpRateUp(result.card)
          ).length;

          if (spCount < minSpCards) continue;

          const score = team.reduce((sum, result) => sum + result.score, 0);

          if (score > bestScore) {
            bestScore = score;
            bestTeam = team;
          }
        }
      }
    }

    return bestTeam;
  }

  const ownedCardResults = useMemo(() => {
    return cards
      .filter((card) => calculationOwnedCards[card.card_id]?.owned)
      .filter((card) => {
        if (calculationPlan === "sense") return card.sense === 1;
        if (calculationPlan === "motivation") return card.logic === 1;
        if (calculationPlan === "impression") return card.logic === 1;
        if (calculationPlan === "anomaly") return card.anomaly === 1;
        return true;
      })
      .map((card) => {
        const limitBreak = calculationOwnedCards[card.card_id]?.limitBreak ?? 0;
        const score = calcCardScore(
          card,
          abilityDb,
          calculationContext,
          limitBreak
        );

        return {
          card,
          limitBreak,
          score,
          isRental: false,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [calculationOwnedCards, calculationPlan, calculationContext]);

  const filteredCards = cards.filter((card) => {
    if (plan === "sense") return card.sense === 1;
    if (plan === "motivation") return card.logic === 1;
    if (plan === "impression") return card.logic === 1;
    if (plan === "anomaly") return card.anomaly === 1;
    return true;
  });

  const supportCardScoreList = useMemo(() => {
    if (resultViewMode !== "scoreList") {
      return [];
    }

    const isAllFourLimitBreakMode = scoreListMode === "allFour";

    const targetCards = isAllFourLimitBreakMode
      ? filteredCards
      : filteredCards.filter((card) => calculationOwnedCards[card.card_id]);

    const results = targetCards.map((card) => {
      const ownedInfo = calculationOwnedCards[card.card_id];
      const isOwned = Boolean(ownedInfo);
      const currentLimitBreak = isOwned ? Number(ownedInfo.limitBreak ?? 0) : 0;

      const scoreByLimitBreak = [0, 1, 2, 3, 4].map((limitBreak) => {
        return calcCardScore(card, abilityDb, calculationContext, limitBreak);
      });

      const currentScore = isOwned
        ? scoreByLimitBreak[currentLimitBreak]
        : 0;

      return {
        card,
        isOwned,
        currentScore,
        score0: scoreByLimitBreak[0],
        score1: scoreByLimitBreak[1],
        score2: scoreByLimitBreak[2],
        score3: scoreByLimitBreak[3],
        score4: scoreByLimitBreak[4],
      };
    });

    results.sort((a, b) => {
      if (isAllFourLimitBreakMode) {
        return b.score4 - a.score4;
      }

      return b.currentScore - a.currentScore;
    });

    return results;
  }, [
    resultViewMode,
    scoreListMode,
    filteredCards,
    calculationOwnedCards,
    calculationContext,
  ]);

  function selectRecommendedCardsWithRentalAndPattern(
    ownedResults,
    rentalResults,
    minSpCards,
    type,
    patternName
  ) {
    const pattern = makeTypePattern(type, patternName);

    let bestTeam = [];
    let bestScore = -Infinity;

    for (const rentalCard of rentalResults) {
      const remainingPattern = { ...pattern };
      const rentalType = rentalCard.card.param_type;

      remainingPattern[rentalType] =
        (remainingPattern[rentalType] ?? 0) - 1;

      if (remainingPattern[rentalType] < 0) {
        continue;
      }

      const rentalSpCount = hasSpRateUp(rentalCard.card) ? 1 : 0;

      const ownCandidates = ownedResults.filter(
        (ownedCard) => ownedCard.card.card_id !== rentalCard.card.card_id
      );

      const ownTeam = findBestOwnedCardsByPattern(
        ownCandidates,
        remainingPattern,
        Math.max(0, minSpCards - rentalSpCount)
      );

      if (!ownTeam) continue;

      const team = [...ownTeam, rentalCard];

      const totalSpCount = team.filter((result) =>
        hasSpRateUp(result.card)
      ).length;

      if (totalSpCount < minSpCards) continue;

      const totalScore = team.reduce((sum, result) => sum + result.score, 0);

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestTeam = team;
      }
    }

    return bestTeam.sort((a, b) => b.score - a.score);
  }

  function selectRecommendedCards(results, minSpCards) {
    let selected = results.slice(0, 6);

    let spCount = selected.filter((result) => hasSpRateUp(result.card)).length;

    if (spCount >= minSpCards) {
      return selected;
    }

    const outsideSpCards = results.filter((result) => {
      const alreadySelected = selected.some(
        (selectedResult) => selectedResult.card.card_id === result.card.card_id
      );

      return !alreadySelected && hasSpRateUp(result.card);
    });

    for (const spCard of outsideSpCards) {
      if (spCount >= minSpCards) break;

      const replaceIndex = [...selected]
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => !hasSpRateUp(result.card))
        .sort((a, b) => a.result.score - b.result.score)[0]?.index;

      if (replaceIndex === undefined) break;

      selected[replaceIndex] = spCard;
      spCount += 1;
    }

    return selected.sort((a, b) => b.score - a.score);
  }

  const recommendedPatternResults = useMemo(() => {
    if (!showResult) return [];

    return Object.keys(PATTERN_COUNTS).map((patternName) => {
      const cards = selectRecommendedCardsWithRentalAndPattern(
        ownedCardResults,
        rentalCardResults,
        calculationMinSpCards,
        calculationType,
        patternName
      );

      const totalScore = cards.reduce((sum, result) => sum + result.score, 0);

      return {
        patternName,
        cards,
        totalScore,
      };
    });
  }, [
    calculationTrigger,
    showResult,
    ownedCardResults,
    rentalCardResults,
    calculationMinSpCards,
    calculationType,
  ]);

  const filteredOwnedCards = cards.filter((card) => {
    const matchesName =
      !ownedSearchText || card.name.includes(ownedSearchText);

    const matchesType =
      ownedTypeFilter === "all" || card.param_type === ownedTypeFilter;

    const matchesPlan =
      ownedPlanFilter === "all" ||
      (ownedPlanFilter === "sense" && card.sense === 1) ||
      (ownedPlanFilter === "logic" && card.logic === 1) ||
      (ownedPlanFilter === "anomaly" && card.anomaly === 1);

    return matchesName && matchesType && matchesPlan;
  });



  return (
    <main className={`app ${theme === "dark" ? "darkMode" : "lightMode"}`}>
      <div className="mainCard">

        <div className="topRightButtons">
          <button
            className="commonButton smallButton"
            onClick={() => setShowChangelog(true)}
          >
            更新履歴
          </button>
        </div>

        <section className="calculator">
          <button
            className="themeToggleButton"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
          </button>
          <header className="siteHeader">
            <img
              className="headerImage"
              src="/いつまでも続けばいいのに.png"
              alt="サポカ計算機"
            />
            <h1 className="mainTitle">サポカ計算機</h1>
            <span className="version">v1.0.0 - React Web版として公開</span>
            <p className="appDescription">
              所持サポカからおすすめ上位6枚を自動計算します。
            </p>
          </header>


          {showChangelog && (
            <div className="modalOverlay" onClick={() => setShowChangelog(false)}>
              <div className="helpModal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modalCloseButton"
                  onClick={() => setShowChangelog(false)}
                >
                  ×
                </button>

                <h2>更新履歴</h2>

                <p><strong>v1.0.0</strong></p>
                <span className="versionDate"> - 2026/04/29</span>
                <ul>
                  <li>React Web版として公開</li>
                </ul>

                {/*
<p><strong>v1.0.0</strong></p>
<span className="versionDate"> - 2026/04/28</span>
<p className="changelogNote">以下の対応を行いました：</p>
<ul>
  <li>サポカの画面入力</li>
  <li>csv保存</li>
  <li>プラン：ロジック</li>
  <li>計算条件表示</li>
</ul>
*/}
              </div>
            </div>
          )}

          <button className="helpButton" onClick={() => setShowHelp(true)}>
            使い方
          </button>

          {showHelp && (
            <div className="modalOverlay" onClick={() => setShowHelp(false)}>
              <div className="helpModal" onClick={(e) => e.stopPropagation()}>
                <button className="modalCloseButton" onClick={() => setShowHelp(false)}>
                  ×
                </button>

                <h2>使い方</h2>

                <h3>1. 条件を選ぶ ⚙️ </h3>
                <p>
                  モード・プラン・傾向・<br className="spOnly" />
                  SP率サポカの最低枚数を選択してください。
                </p>

                <h3>2. 所持サポカを登録する ✅</h3>
                <p>所持しているサポカにチェックを入れ、<br className="spOnly" />凸数を選択してください。</p>
                <p className="subText">入力したサポカの情報は、端末ごとに自動保存されます。</p>

                <h3>3. おすすめ編成を見る 👀</h3>
                <p>所持サポカ5枚＋レンタル1枚の条件で、</p>
                <p>各パターンで最も点数が高くなった編成を自動表示します。</p>

                <hr className="divider" />

                <h3>注意事項 ⚠️</h3>
                <p>この計算機は簡易計算です。実際の立ち回りによって最適編成が変わる場合があります。</p>
                <p>SRサポカは一部のみ実装しています。追加までしばらくお待ちください。</p>
              </div>
            </div>
          )}

          <button
            className="feedbackButton"
            onClick={() => window.open(feedbackFormUrl, "_blank", "noopener,noreferrer")}
          >
            要望・不具合報告
          </button>

          <button
            className="xButton"
            onClick={() => window.open(xUrl, "_blank", "noopener,noreferrer")}
          >
            X(Twitter)
          </button>

          <label>
            モード
            <select
              value={mode}
              onChange={(e) => {
                const nextMode = e.target.value;
                const nextPlan = Object.keys(contextPresets[nextMode].plans)[0];
                const nextType = Object.keys(contextPresets[nextMode].plans[nextPlan].types)[0];

                setMode(nextMode);
                setPlan(nextPlan);
                setType(nextType);
              }}
            >
              {Object.keys(contextPresets).map((m) => (
                <option key={m} value={m}>
                  {contextPresets[m].label}
                </option>
              ))}
            </select>
          </label>

          <label>
            プラン
            <select
              value={plan}
              onChange={(e) => {
                const nextPlan = e.target.value;
                const nextType = Object.keys(contextPresets[mode].plans[nextPlan].types)[0];

                setPlan(nextPlan);
                setType(nextType);
              }}
            >
              {Object.keys(contextPresets[mode].plans).map((p) => (
                <option key={p} value={p}>
                  {contextPresets[mode].plans[p].label}
                </option>
              ))}
            </select>
          </label>

          <label>
            傾向
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.keys(contextPresets[mode].plans[plan].types).map((t) => (
                <option key={t} value={t}>
                  {contextPresets[mode].plans[plan].types[t].label}
                </option>
              ))}
            </select>
          </label>

          <details className="conditionDetails">
            <summary>計算条件を見る</summary>

            <div className="tableScroll">
              <table className="conditionTable">

                <thead>
                  <tr>
                    <th>項目</th>
                    <th>値</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(context).map(([key, value]) => (
                    <tr key={key}>
                      <td>{CONTEXT_LABELS[key] ?? key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>



          <label>
            SP率サポカの最低枚数
            <select className="selectBox"
              value={minSpCards}
              onChange={(e) => setMinSpCards(Number(e.target.value))}
            >
              <option value={0}>0枚</option>
              <option value={1}>1枚以上</option>
              <option value={2}>2枚以上</option>
              <option value={3}>3枚以上</option>
            </select>
          </label>

          <button
            className="primaryButton"
            onClick={() => {
              setCalculationOwnedCards(ownedCards);
              setCalculationSettings({
                mode,
                plan,
                type,
                minSpCards,
              });
              setCalculationTrigger((prev) => prev + 1);
              setShowResult(true);
            }}
          >
            計算開始
          </button>

          <div className="resultTabs">
            <button
              className={`commonButton ${resultViewMode === "recommend" ? "activeTabButton" : ""}`}
              onClick={() => setResultViewMode("recommend")}
            >
              おすすめ編成
            </button>

            <button
              className={`commonButton ${resultViewMode === "scoreList" ? "activeTabButton" : ""}`}
              onClick={() => setResultViewMode("scoreList")}
            >
              サポカ点数一覧
            </button>
          </div>
          {showResult && (
            <div className="resultSection">
              {resultViewMode === "recommend" && (
                <>
                  <h2>おすすめ編成</h2>

                  {recommendedPatternResults.map((patternResult) => (
                    <div className="patternResult" key={patternResult.patternName}>
                      <h3>
                        {patternResult.patternName}（合計スコア{" "}
                        {patternResult.totalScore.toFixed(1)}）
                      </h3>

                      {patternResult.cards.length === 0 ? (
                        <p>条件を満たす編成が見つかりませんでした。</p>
                      ) : (
                        <div className="tableScroll">
                          <table className="resultTable">
                            <thead>
                              <tr>
                                <th>レンタル</th>
                                <th>サポカ名</th>
                                <th>点数</th>
                                <th>タイプ</th>
                                <th>SP率</th>
                              </tr>
                            </thead>

                            <tbody>
                              {patternResult.cards.map((result) => (
                                <tr key={result.card.card_id}>
                                  <td>{result.isRental ? "○" : ""}</td>
                                  <td>{result.card.name}</td>
                                  <td>{result.score.toFixed(1)}</td>
                                  <td>{result.card.param_type}</td>
                                  <td>{getSpRate(result.card)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {resultViewMode === "scoreList" && (
                <section className="scoreListSection">
                  <h2>サポカ点数一覧</h2>

                  <div className="scoreListControls">
                    <button
                      className={`commonButton ${scoreListMode === "owned" ? "activeTabButton" : ""}`}
                      onClick={() => setScoreListMode("owned")}
                    >
                      所持のみ
                    </button>

                    <button
                      className={`commonButton ${scoreListMode === "allFour" ? "activeTabButton" : ""}`}
                      onClick={() => setScoreListMode("allFour")}
                    >
                      未所持も含めて4凸比較
                    </button>
                  </div>

                  <div className="tableScroll">
                    <table className="resultTable scoreListTable">
                      <thead>
                        <tr>
                          {scoreListMode === "allFour" && <th>所持</th>}
                          <th>サポカ名</th>
                          <th>タイプ</th>
                          <th>現在点</th>
                          <th>0凸</th>
                          <th>1凸</th>
                          <th>2凸</th>
                          <th>3凸</th>
                          <th>4凸</th>
                          <th>SP率</th>
                        </tr>
                      </thead>

                      <tbody>
                        {supportCardScoreList.map((result) => (
                          <tr key={result.card.card_id}>
                            {scoreListMode === "allFour" && (
                              <td>{result.isOwned ? "○" : ""}</td>
                            )}

                            <td>{result.card.name}</td>
                            <td>{result.card.param_type}</td>
                            <td>{formatScore(result.currentScore)}</td>
                            <td>{formatScore(result.score0)}</td>
                            <td>{formatScore(result.score1)}</td>
                            <td>{formatScore(result.score2)}</td>
                            <td>{formatScore(result.score3)}</td>
                            <td>{formatScore(result.score4)}</td>
                            <td>{getSpRate(result.card)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {supportCardScoreList.length === 0 && (
                    <p className="subText">
                      表示できるサポカがありません。所持サポカを登録してください。
                    </p>
                  )}
                </section>
              )}

            </div>
          )}

          <div className="sectionTitleRow">
            <h2>所持サポカ登録</h2>

            <button
              className="commonButton smallButton"
              onClick={() => setShowCsvHelp(true)}
            >
              csv保存ってなに？
            </button>
          </div>

          {showCsvHelp && (
            <div className="modalOverlay" onClick={() => setShowCsvHelp(false)}>
              <div className="helpModal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modalCloseButton"
                  onClick={() => setShowCsvHelp(false)}
                >
                  ×
                </button>

                <h2>CSV保存について</h2>

                <ul>
                  <li>所持サポカと凸数を保存できます</li>
                  <li>別端末に所持状況を移行する際に使います</li>
                  <li>データのバックアップとして使えます</li>
                  <li>「読み込む」から復元できます</li>
                </ul>
              </div>
            </div>
          )}

          <div className="ownedButtons">
            <button className="dangerButton" onClick={resetOwnedCards}>
              所持状況をリセット
            </button>

            <button className="secondaryButton" onClick={downloadOwnedCardsCsv}>
              所持状況を保存（.csv）
            </button>

            <button
              className="secondaryButton"
              onClick={() => document.getElementById("csvInput").click()}
            >
              所持状況を読み込む（.csv）
            </button>
          </div>

          <input
            id="csvInput"
            type="file"
            accept=".csv"
            onChange={uploadOwnedCardsCsv}
            hidden
          />

          <div className="filterRow">
            <label>
              名前検索
              <input
                type="text"
                value={ownedSearchText}
                onChange={(e) => setOwnedSearchText(e.target.value)}
                placeholder="カード名で検索"
              />
            </label>

            <label>
              タイプ絞り込み
              <select
                value={ownedTypeFilter}
                onChange={(e) => setOwnedTypeFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="Vo">Vo</option>
                <option value="Da">Da</option>
                <option value="Vi">Vi</option>
              </select>
            </label>

            <label>
              プラン絞り込み
              <select
                value={ownedPlanFilter}
                onChange={(e) => setOwnedPlanFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="sense">センス</option>
                <option value="logic">ロジック</option>
                <option value="anomaly">アノマリー</option>
              </select>
            </label>
          </div>

          <div className="ownedList">
            {filteredOwnedCards
              .slice()
              .sort((a, b) => {
                if (a.card_id === NEW_CARD_ID) return -1;
                if (b.card_id === NEW_CARD_ID) return 1;
                return 0;
              })
              .map((card) => {

                const owned = ownedCards[card.card_id]?.owned ?? false;
                const limitBreak = ownedCards[card.card_id]?.limitBreak ?? 0;

                return (
                  <div
                    className="ownedRow clickable"
                    key={card.card_id}
                    onClick={() => updateOwnedCard(card.card_id, "owned", !owned)}
                  >
                    <div className="ownedCheck">
                      <input
                        type="checkbox"
                        checked={owned}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          updateOwnedCard(card.card_id, "owned", e.target.checked)
                        }
                      />
                      <span>{card.name}</span>
                    </div>

                    <span className="ownedType">{card.param_type}</span>

                    <select
                      value={limitBreak}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        updateOwnedCard(
                          card.card_id,
                          "limitBreak",
                          Number(e.target.value)
                        )
                      }
                    >
                      <option value={0}>0凸</option>
                      <option value={1}>1凸</option>
                      <option value={2}>2凸</option>
                      <option value={3}>3凸</option>
                      <option value={4}>4凸</option>
                    </select>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </main>
  );
}
export default App;