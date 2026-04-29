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

  on_lesson_vo: "lesson_count",
  on_lesson_da: "lesson_count",
  on_lesson_vi: "lesson_count",
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

export function getLimitBreakIndex(limitBreak) {
  return Math.max(0, Math.min(4, limitBreak));
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
  const tier = card.ability_tier;
  const idx = getLimitBreakIndex(limitBreak);

  let total = 0;

  for (const abilityId of card.abilities) {
    const ability = abilityDb[`${abilityId}__${tier}`];

    console.log("abilityId:", abilityId);
    console.log("ability:", ability);
    console.log("context:", context);

    if (!ability) continue;

    const score = calcAbilityScore(
      ability.kind,
      ability.values[idx],
      context,
      ability.limit_count
    );

    console.log("score:", score);

    total += score;
  }

  return total;
}