import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { calcCardScore, calcDeckSynergyScore, getAbilityGradeIndex } from "./lib/calc";
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

  lesson_vo_count: "Voレッスン回数",
  lesson_da_count: "Daレッスン回数",
  lesson_vi_count: "Viレッスン回数",
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
  "2/3/1": [2, 3, 1],
  "2/2/2": [2, 2, 2],
};

const CANDIDATE_LIMIT_PER_TYPE = 7;

const NEW_CARD_ID = "card_108"; // あなたとふたり、電車で

function App() {

  const [mode, setMode] = useState("legend");
  const [plan, setPlan] = useState("sense");
  const [type, setType] = useState("voda");
  const [minSpCards, setMinSpCards] = useState(0);
  const [spTypePriority, setSpTypePriority] = useState("none");

  const [calculationSettings, setCalculationSettings] = useState({
    mode: "legend",
    plan: "sense",
    type: "voda",
    minSpCards: 0,
    spTypePriority: "none",
  });

  const calculationMode = calculationSettings.mode;
  const calculationPlan = calculationSettings.plan;
  const calculationType = calculationSettings.type;
  const calculationMinSpCards = calculationSettings.minSpCards;
  const calculationSpTypePriority =
    calculationSettings?.spTypePriority ?? "none";
  const minDaSpCards =
    calculationSpTypePriority === "da2" ? 2 : 0;

  const calculationContext =
    contextPresets[calculationMode]
      .plans[calculationPlan]
      .types[calculationType]
      .context;


  const [showResult, setShowResult] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [resultViewMode, setResultViewMode] = useState("recommend");
  const [scoreListMode, setScoreListMode] = useState("owned");
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const feedbackFormUrl = "https://forms.gle/BNPXUKgdaQP4gG197";

  const xUrl = "https://x.com/wandering_sen";

  const [showChangelog, setShowChangelog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const shouldShowSpTypePriority =
    mode === "enhancedLegendTheory" && Number(minSpCards) >= 3;

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

  useEffect(() => {
    if (!shouldShowSpTypePriority) {
      setSpTypePriority("none");
    }
  }, [shouldShowSpTypePriority]);

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

  function getSpRate(result) {
    if (!result) return 0;

    const card = result.card ?? result;
    const limitBreak = result.limitBreak ?? 0;

    if (!card || !Array.isArray(card.abilities)) return 0;

    const abilityIndex = card.abilities.indexOf("sp_rate_id");
    if (abilityIndex === -1) return 0;

    const tier = (card.ability_tier || card.rarity || "").trim();
    const ability = abilityDb[`sp_rate_id__${tier}`];

    if (!ability) return 0;

    const idx = getAbilityGradeIndex(limitBreak, abilityIndex);
    return Number(ability.values[idx] ?? 0);
  }

  function isDaSpCard(result) {
    return result?.card?.param_type === "Da" && getSpRate(result) > 0;
  }

  function hasSpRateUp(card) {
    return Array.isArray(card.abilities)
      ? card.abilities.includes("sp_rate_id")
      : false;
  }

  function hasValidSpRateUp(card, calculationType) {
    if (!hasSpRateUp(card)) return false;

    if (calculationType === "voda") {
      return card.param_type === "Vo" || card.param_type === "Da";
    }

    if (calculationType === "davi") {
      return card.param_type === "Da" || card.param_type === "Vi";
    }

    if (calculationType === "vovi") {
      return card.param_type === "Vo" || card.param_type === "Vi";
    }

    return true;
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

  function isSynergyRelatedCard(result) {
    const tags = result.card.synergy_tags ?? [];

    return (
      tags.includes("ssr_gain") ||
      tags.includes("p_item_gain")
    );
  }

  function limitCandidatesByType(
    results,
    limit,
    { requireDaSp = false, daSpExtraLimit = 4, synergyExtraLimit = 4 } = {}
  ) {
    const sorted = [...results].sort((a, b) => b.score - a.score);

    const topCandidates = sorted.slice(0, limit);

    const ssrGainCandidates = sorted
      .filter((result) => result.card.synergy_tags?.includes("ssr_gain"))
      .slice(0, synergyExtraLimit);

    const pItemGainCandidates = sorted
      .filter((result) => result.card.synergy_tags?.includes("p_item_gain"))
      .slice(0, synergyExtraLimit);

    const daSpCandidates = requireDaSp
      ? sorted.filter(isDaSpCard).slice(0, daSpExtraLimit)
      : [];

    const merged = [];

    for (const candidate of [
      ...topCandidates,
      ...ssrGainCandidates,
      ...pItemGainCandidates,
      ...daSpCandidates,
    ]) {
      const alreadyExists = merged.some(
        (result) => result.card.card_id === candidate.card.card_id
      );

      if (!alreadyExists) {
        merged.push(candidate);
      }
    }

    return merged;
  }

  function findBestOwnedCardsByPattern({
    ownedResults,
    rentalResult,
    pattern,
    minSpCards,
    minDaSpCards,
    trend,
    abilityDb,
    calculationContext,
  }) {

    const groups = Object.fromEntries(
      TYPE_ORDER.map((cardType) => [
        cardType,
        limitCandidatesByType(
          ownedResults.filter((result) => result.card.param_type === cardType),
          CANDIDATE_LIMIT_PER_TYPE,
          {
            requireDaSp: minDaSpCards > 0 && cardType === "Da",
            daSpExtraLimit: 4,
            synergyExtraLimit: 3,
          }
        ),
      ])
    );

    const rentalDaSpCount = rentalResult && isDaSpCard(rentalResult) ? 1 : 0;
    const requiredOwnedDaSpCount = Math.max(0, minDaSpCards - rentalDaSpCount);

    const choices = TYPE_ORDER.map((cardType) => {
      const comboList = combinations(groups[cardType], pattern[cardType] ?? 0);

      if (cardType !== "Da" || requiredOwnedDaSpCount <= 0) {
        return comboList;
      }

      return comboList.filter((combo) => {
        const daSpCount = combo.filter(isDaSpCard).length;
        return daSpCount >= requiredOwnedDaSpCount;
      });
    });

    let bestResult = null;
    let bestTotalScore = -Infinity;

    for (const voGroup of choices[0]) {
      for (const daGroup of choices[1]) {
        for (const viGroup of choices[2]) {
          const ownTeam = [...voGroup, ...daGroup, ...viGroup];
          const team = rentalResult ? [...ownTeam, rentalResult] : ownTeam;

          const spCardCount = team.filter((result) =>
            hasValidSpRateUp(result.card, trend)
          ).length;

          if (spCardCount < minSpCards) {
            continue;
          }

          const daSpCardCount = team.filter(isDaSpCard).length;

          if (daSpCardCount < minDaSpCards) {
            continue;
          }

          const baseScore = team.reduce((sum, result) => sum + result.score, 0);

          const synergyResult = calcDeckSynergyScore(
            team,
            abilityDb,
            calculationContext
          );

          const synergyScore = synergyResult.totalScore;
          const totalScore = baseScore + synergyScore;

          if (totalScore > bestTotalScore) {
            bestTotalScore = totalScore;
            bestResult = {
              ownTeam,
              team,
              baseScore,
              synergyScore,
              synergyBonusByCardId: synergyResult.bonusByCardId,
              totalScore,
            };
          }
        }
      }
    }

    return bestResult;
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

  const rentalCardResults = useMemo(() => {
    return cards
      .filter((card) => card.rental_candidate === 1)
      .filter((card) => {
        if (calculationPlan === "sense") return card.sense === 1;
        if (calculationPlan === "motivation") return card.logic === 1;
        if (calculationPlan === "impression") return card.logic === 1;
        if (calculationPlan === "anomaly") return card.anomaly === 1;
        return true;
      })
      .map((card) => {
        const limitBreak = 4;
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
          isRental: true,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [calculationPlan, calculationContext]);

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
      : filteredCards.filter(
        (card) => calculationOwnedCards[card.card_id]?.owned
      );

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

      const spRateLimitBreak = isAllFourLimitBreakMode
        ? 4
        : currentLimitBreak;

      const spRate = getSpRate({
        card,
        limitBreak: spRateLimitBreak,
      });

      return {
        card,
        isOwned,
        limitBreak: currentLimitBreak,
        currentScore,
        score0: scoreByLimitBreak[0],
        score1: scoreByLimitBreak[1],
        score2: scoreByLimitBreak[2],
        score3: scoreByLimitBreak[3],
        score4: scoreByLimitBreak[4],
        spRate,
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

  function selectRecommendedCardsWithRentalAndPattern({
    ownedResults,
    rentalResults,
    patternName,
    minSpCards,
    minDaSpCards,
    trend,
    abilityDb,
    calculationContext,
  }) {
    const pattern = makeTypePattern(trend, patternName);

    let bestResult = {
      cards: [],
      baseScore: 0,
      synergyScore: 0,
      synergyBonusByCardId: {},
      totalScore: 0,
    };

    let bestTotalScore = -Infinity;

    const limitedRentalResults = rentalResults.slice(0, 12);

    for (const rentalResult of limitedRentalResults) {
      const remainingPattern = { ...pattern };
      const rentalType = rentalResult.card.param_type;

      remainingPattern[rentalType] =
        (remainingPattern[rentalType] ?? 0) - 1;

      if (remainingPattern[rentalType] < 0) {
        continue;
      }

      const ownCandidates = ownedResults.filter(
        (ownedResult) =>
          ownedResult.card.card_id !== rentalResult.card.card_id
      );

      const rentalSpCount = hasValidSpRateUp(rentalResult.card, trend) ? 1 : 0;

      const availableSpCount =
        ownCandidates.filter((result) =>
          hasValidSpRateUp(result.card, trend)
        ).length + rentalSpCount;

      if (availableSpCount < minSpCards) {
        continue;
      }

      const rentalDaSpCount = isDaSpCard(rentalResult) ? 1 : 0;

      const availableDaSpCount =
        ownCandidates.filter(isDaSpCard).length + rentalDaSpCount;

      if (availableDaSpCount < minDaSpCards) {
        continue;
      }

      const result = findBestOwnedCardsByPattern({
        ownedResults: ownCandidates,
        rentalResult,
        pattern: remainingPattern,
        minSpCards,
        minDaSpCards,
        trend,
        abilityDb,
        calculationContext,
      });

      if (!result) continue;

      const cardsWithDisplayScore = result.team.map((cardResult) => {
        const synergyBonus =
          result.synergyBonusByCardId?.[cardResult.card.card_id] ?? 0;

        return {
          ...cardResult,
          synergyBonus,
          displayScore: cardResult.score + synergyBonus,
        };
      });

      const sortedCards = cardsWithDisplayScore.sort(
        (a, b) => b.displayScore - a.displayScore
      );

      if (result.totalScore > bestTotalScore) {
        bestTotalScore = result.totalScore;

        bestResult = {
          cards: sortedCards,
          baseScore: result.baseScore,
          synergyScore: result.synergyScore,
          synergyBonusByCardId: result.synergyBonusByCardId,
          totalScore: result.totalScore,
        };
      }
    }

    return bestResult;
  }

  const recommendedPatternResults = useMemo(() => {
    if (!showResult) return [];

    return Object.keys(PATTERN_COUNTS).map((patternName) => {
      const result = selectRecommendedCardsWithRentalAndPattern({
        ownedResults: ownedCardResults,
        rentalResults: rentalCardResults,
        patternName,
        minSpCards: calculationMinSpCards,
        minDaSpCards,
        trend: calculationType,
        abilityDb,
        calculationContext,
      });

      return {
        patternName,
        cards: result.cards,
        baseScore: result.baseScore,
        synergyScore: result.synergyScore,
        totalScore: result.totalScore,
      };
    });
  }, [
    showResult,
    ownedCardResults,
    rentalCardResults,
    calculationMinSpCards,
    minDaSpCards,
    calculationType,
    calculationContext,
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
        <section className="calculator">

          <div className="topRightButtons">
            <button
              className="commonButton smallButton"
              onClick={() => setShowChangelog(true)}
            >
              更新履歴
            </button>

            <button
              className="commonButton smallButton"
              onClick={() => setShowStatus(true)}
            >
              対応状況
            </button>
          </div>

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
            <span className="version">v1.0.4 - サポカ札/Pアイテムシナジー対応・使い方更新</span>
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

                <p><strong>v1.0.4</strong></p>
                <span className="versionDate"> - 2026/05/07</span>
                <p className="changelogNote">サイトに以下の機能を追加しました：</p>
                <ul>
                  <li>「初レジェンド - 強化月間（アノマリー）」の理論値踏みに仮対応しました</li>
                  <li>SSRサポカ札による「SSR札獲得」アビリティの追加発動を考慮して、</li>
                  <p>おすすめ編成を計算・反映するようにしました</p>
                  <li>SSRサポカ札のシナジーへの対応に伴い、計算条件のSSR獲得枚数を調整しました</li>
                  <li>Pアイテムを獲得するサポカによる「Pアイテム獲得時」アビリティの追加発動を考慮して、</li>
                  <p>おすすめ編成を計算・反映するようにしました</p>
                  <li>Pアイテム獲得のシナジーへの対応に伴い、計算条件のPアイテム獲得数を調整しました</li>
                </ul>


                <p className="changelogNote">以下の表示・動作を改善しました：</p>
                <ul>
                  <li>SP率表示が、サポカの凸状況を正しく反映するようにしました</li>
                  <li>特定の設定で、おすすめ編成の計算・表示が重くなるケースを軽減しました</li>
                  <li>おすすめ編成の選出ロジックが分かりやすくなるよう、「使い方」の説明を更新しました</li>
                </ul>

                <p><strong>v1.0.3</strong></p>
                <span className="versionDate"> - 2026/05/06</span>
                <p className="changelogNote">サイトに以下の要素を追加しました。：</p>
                <ul>
                  <li>「対応状況」（いただいた不具合報告や意見・要望への回答）</li>
                </ul>

                <p><strong>v1.0.2</strong></p>
                <span className="versionDate"> - 2026/05/01</span>
                <p className="changelogNote">以下の問題への対応・修正を行いました。：</p>
                <ul>
                  <li>一部の状況でサポカの凸状況が反映されていなかった</li>
                  <li>「もうっ！　冷たいよ！」がSP枠として扱われていなかった</li>
                  <li>ロジックのM強化回数が想定より低くなっていた</li>
                </ul>

                <p><strong>v1.0.1</strong></p>
                <span className="versionDate"> - 2026/04/29</span>
                <p className="changelogNote">以下の問題への対応・修正を行いました。：</p>
                <ul>
                  <li>傾向外のSP枚数もカウントされていた</li>
                  <li>"SP時に20枚以上~"アビリティが反映されていなかった</li>
                  <li>SP枚数の条件を変更しても反映されないことがあった</li>
                </ul>

                <p><strong>v1.0.0</strong></p>
                <span className="versionDate"> - 2026/04/29</span>
                <ul>
                  <li>React Web版として公開</li>
                </ul>
              </div>
            </div>
          )}

          {showStatus && (
            <div className="modalOverlay" onClick={() => setShowStatus(false)}>
              <div className="helpModal statusModal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modalCloseButton"
                  onClick={() => setShowStatus(false)}
                >
                </button>

                <h2>対応状況</h2>
                <p className="changelogNote">
                  フォーム等でいただいた不具合報告・ご意見・ご要望への回答ページです。
                </p>

                <ul className="statusList">

                  <li>
                    <p className="statusTitle">
                      「あなたとふたり、電車で」の点数が想定より低くおすすめされづらい
                    </p>
                    <div className="statusBody">
                      <p>このご意見を受けて、SSRサポカ札獲得のシナジーによる加点を反映するようにしました。</p>
                      <p>「あなたとふたり、電車で」や「あたしの勝ち、ですね～！」等、</p>
                      <p>サポカ札を持つサポカの点数が全体的に底上げされています。</p>
                      <p>今後は、Pアイテムの「カタメコイメ」等、複雑な挙動をするサポカも同様に</p>
                      <p>計算ロジックに組み込めるよう進めてまいります。</p>
                      <span className="versionDate"> - 2026/05/07（追記）</span>
                    </div>
                  </li>

                  <li>
                    <p className="statusTitle">更新の際に毎回csvファイルを変えないでほしい</p>
                    <div className="statusBody">
                      <p>現状はHIF編以降もこのサイトで運営しようと考えているため、</p>
                      <p>これ以上、急にcsvファイルの中身や様式が変わることはありません。</p>
                      <p>稼働初期に何度もcsvファイルを作り直してしまい、申し訳ございません。</p>
                      <span className="versionDate"> - 2026/05/06</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <button className="helpButton" onClick={() => setShowHelp(true)}>
            使い方
          </button>

          {showHelp && (
            <div className="modalOverlay" onClick={() => setShowHelp(false)}>
              <div className="helpModal usageModal" onClick={(e) => e.stopPropagation()}>
                <button className="modalCloseButton" onClick={() => setShowHelp(false)}>
                  ×
                </button>

                <h2>使い方</h2>

                <h3>1. 条件を選ぶ ⚙️ </h3>
                <div className="usageTextBlock">
                  <p>
                    モード・プラン・傾向・<br className="spOnly" />
                    SP率サポカの最低枚数を選択してください。
                  </p>
                </div>


                <h3>2. 所持サポカを登録する ✅</h3>
                <div className="usageTextBlock">
                  <p>所持しているサポカにチェックを入れ、<br className="spOnly" />凸数を選択してください。</p>
                  <p className="subText">入力したサポカの情報は、端末ごとに自動保存されます。</p>
                </div>

                <h3>4. おすすめ編成の選出について 🧮</h3>
                <div className="usageTextBlock">
                  <p>
                    おすすめ編成は、サポカ単体の点数順ではなく、編成全体の合計点が高くなるように選出しています。
                  </p>
                  <p>
                    SSRサポカ札やPアイテム獲得によって他サポカのアビリティを追加発動させる場合、
                    おすすめ編成では「追加発動させた側」のサポカの点数を上昇して表示させています。
                  </p>
                  <p>
                    そのため、単体点が低く表示されるサポカであっても、編成全体では強いと判断されて選ばれる場合があります。
                  </p>
                </div>
                <hr className="divider" />

                <h3>注意事項 ⚠️</h3>
                <div className="usageTextBlock">
                  <p>この計算機は簡易計算です。実際の立ち回りによって最適編成が変わる場合があります。</p>
                  <p>SRサポカは一部のみ実装しています。追加までしばらくお待ちください。</p>
                </div>
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
              <option value={0}>0枚以上</option>
              <option value={1}>1枚以上</option>
              <option value={2}>2枚以上</option>
              <option value={3}>3枚以上</option>
            </select>
          </label>

          {shouldShowSpTypePriority && (
            <>
              <label>
                SPタイプ優先
              </label>
              <select
                className="selectBox"
                value={spTypePriority}
                onChange={(e) => setSpTypePriority(e.target.value)}
              >
                <option value="none">指定なし</option>
                <option value="da2">DaSPを2枚以上</option>
              </select>
            </>
          )}

          <button
            className="primaryButton"
            onClick={() => {
              setCalculationOwnedCards(ownedCards);
              setCalculationSettings({
                mode,
                plan,
                type,
                minSpCards,
                spTypePriority,
              });
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
                                  <td>{formatScore(result.displayScore ?? result.score)}</td>
                                  <td>{result.card.param_type}</td>
                                  <td>{getSpRate(result)}</td>
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
                            <td>{result.spRate}</td>
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