export const KIND_TO_CONTEXT_KEY = {
  flat_vo: null,
  flat_da: null,
  flat_vi: null,
  param_bonus_vo: "param_vo_total",
  param_bonus_da: "param_da_total",
  param_bonus_vi: "param_vi_total",

  on_sp_vo: "sp_vo_count",
  on_sp_da: "sp_da_count",
  on_sp_vi: "sp_vi_count",
  on_sp_20: "totalSpLessonCount",

  on_lesson_vo: "lesson_vo_count",
  on_lesson_da: "lesson_da_count",
  on_lesson_vi: "lesson_vi_count",
  on_normal_lesson: "normal_lesson_count",

  on_enhance: "enhance_count",
  on_enhance_A: "enhance_a_count",
  on_enhance_M: "enhance_m_count",
  on_delete: "delete_count",
  on_delete_A: "delete_a_count",
  on_delete_M: "delete_m_count",
  on_convert: "convert_count",
  get_card: "get_card_count",
  get_active: "get_active_count",
  get_mental: "get_mental_count",
  get_buff: "get_buff_count",
  get_energy: "get_energy_count",
  get_motivation: "get_motivation_count",
  get_impression: "get_impression_count",
  get_reserve: "get_reserve_count",
  get_all_out: "get_all_out_count",
  get_ssr: "get_ssr_count",
  on_class: "class_count",
  on_supply: "supply_count",
  on_consult: "consult_count",
  on_outing: "outing_count",
  on_rest: "rest_count",
  on_exam_end: "exam_end_count",
  on_special_training: "special_training_count",
  get_drink: "get_drink_count",
  on_drink_exchange: "drink_exchange_count",
  on_customize: "customize_count",
  get_item: "get_item_count",
  on_param_event: "param_event_count",
  on_param_event_ssr: "param_event_ssr_count",
  get_focus: "get_focus_count",
};

function getLimitBreakIndex(limitBreak) {
  return Math.max(0, Math.min(4, Number(limitBreak)));
}

export function getAbilityGradeIndex(limitBreak, abilityIndex) {
  const lb = Math.max(0, Math.min(4, Number(limitBreak) || 0));

  if (abilityIndex === 0) {
    // ab1: 凸が1上がるごとにグレードが1上がる
    return lb;
  }

  if (abilityIndex === 1) {
    // ab2: 2凸時にグレードII
    return lb >= 2 ? 1 : 0;
  }

  if (abilityIndex === 2) {
    // ab4: 3凸時にグレードII
    return lb >= 3 ? 1 : 0;
  }

  if (abilityIndex === 3) {
    // ab5: 4凸時にグレードII
    return lb >= 4 ? 1 : 0;
  }

  if (abilityIndex === 4) {
    // ab6: 1凸時にグレードII、4凸時にグレードIII
    if (lb >= 4) return 2;
    if (lb >= 1) return 1;
    return 0;
  }

  // itemは常にI
  return 0;
}


export function calcAbilityScore(kind, value, context, limitCount) {
  kind = kind.trim();

  if (kind === "sp_rate") return 0;
  if (kind === "none") return 0;

  if (kind.startsWith("flat")) {
    return value;
  }

  if (kind === "on_sp_20") {
    const count =
      (context.sp_vo_count || 0) +
      (context.sp_da_count || 0) +
      (context.sp_vi_count || 0);

    const limitedCount =
      limitCount >= 0 ? Math.min(count, limitCount) : count;

    return value * limitedCount;
  }

  if (!(kind in KIND_TO_CONTEXT_KEY)) {
    throw new Error(`未登録のkind: ${kind}`);
  }

  const contextKey = KIND_TO_CONTEXT_KEY[kind];

  if (kind.startsWith("param_bonus")) {
    return Math.floor((context[contextKey] || 0) * (value / 100));
  }

  let count = context[contextKey] || 0;

  if (limitCount >= 0) {
    count = Math.min(count, limitCount);
  }

  return value * count;
}

export function calcCardScore(card, abilityDb, context, limitBreak = 0) {
  const tier = (card.ability_tier || card.rarity || "").trim();

  let total = 0;

  for (const [abilityIndex, abilityId] of card.abilities.entries()) {
    const ability = abilityDb[`${abilityId}__${tier}`];

    if (!ability) continue;

    const idx = getAbilityGradeIndex(limitBreak, abilityIndex);
    const value = ability.values[idx];

    const score = calcAbilityScore(
      ability.kind,
      value,
      context,
      ability.limit_count
    );

    total += score;
  }

  return total;
}

export function calcDeckSynergyScore(deckResults, abilityDb, context) {
  const ssrGainCards = deckResults.filter((result) =>
    result.card.synergy_tags?.includes("ssr_gain")
  );

  const pItemGainCards = deckResults.filter((result) =>
    result.card.synergy_tags?.includes("p_item_gain")
  );

  const ssrGainCount = ssrGainCards.length;
  const pItemGainCount = pItemGainCards.length;

  const bonusByCardId = {};
  let totalSynergyScore = 0;

  // SSRサポカ札シナジー
  if (ssrGainCount > 0) {
    let ssrSynergyScore = 0;

    for (const result of deckResults) {
      const card = result.card;
      const limitBreak = result.limitBreak ?? 0;
      const tier = (card.ability_tier || card.rarity || "").trim();

      if (!Array.isArray(card.abilities)) continue;

      for (const [abilityIndex, abilityId] of card.abilities.entries()) {
        const ability = abilityDb[`${abilityId}__${tier}`];

        if (!ability) continue;
        if (ability.kind !== "get_ssr") continue;

        const idx = getAbilityGradeIndex(limitBreak, abilityIndex);
        const value = Number(ability.values[idx] ?? 0);

        const baseCount = context?.get_ssr_count ?? 0;

        let additionalCount = ssrGainCount;

        if (ability.limit_count >= 0) {
          additionalCount = Math.max(
            0,
            Math.min(ssrGainCount, ability.limit_count - baseCount)
          );
        }

        ssrSynergyScore += value * additionalCount;
      }
    }

    totalSynergyScore += ssrSynergyScore;

    const bonusPerSsrGainCard = ssrSynergyScore / ssrGainCount;

    for (const result of ssrGainCards) {
      bonusByCardId[result.card.card_id] =
        (bonusByCardId[result.card.card_id] ?? 0) + bonusPerSsrGainCard;
    }
  }

  // Pアイテム獲得シナジー
  if (pItemGainCount > 0) {
    let pItemSynergyScore = 0;

    for (const result of deckResults) {
      const card = result.card;
      const limitBreak = result.limitBreak ?? 0;
      const tier = (card.ability_tier || card.rarity || "").trim();

      if (!Array.isArray(card.abilities)) continue;

      for (const [abilityIndex, abilityId] of card.abilities.entries()) {
        const ability = abilityDb[`${abilityId}__${tier}`];

        if (!ability) continue;
        if (abilityId !== "get_item_id") continue;

        const idx = getAbilityGradeIndex(limitBreak, abilityIndex);
        const value = Number(ability.values[idx] ?? 0);

        const baseCount = context?.get_item_count ?? 0;

        let additionalCount = pItemGainCount;

        if (ability.limit_count >= 0) {
          additionalCount = Math.max(
            0,
            Math.min(pItemGainCount, ability.limit_count - baseCount)
          );
        }

        pItemSynergyScore += value * additionalCount;
      }
    }

    totalSynergyScore += pItemSynergyScore;

    const bonusPerPItemGainCard = pItemSynergyScore / pItemGainCount;

    for (const result of pItemGainCards) {
      bonusByCardId[result.card.card_id] =
        (bonusByCardId[result.card.card_id] ?? 0) + bonusPerPItemGainCard;
    }
  }

  return {
    totalScore: totalSynergyScore,
    bonusByCardId,
  };
}