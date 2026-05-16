export const SPECIAL_ITEM_EFFECTS = {
    supportCardA: {
        label: "おとものミミズク",
        cardId: "card_035",
        maxCount: 2,
        contextAdds: {
            enhance_count: 1,
            enhance_m_count: 1,
        },
    },
    supportCardB: {
        label: "カタメコイメ",
        cardId: "card_040",
        maxCount: 2,
        contextAdds: {
            delete_count: 1,
            delete_a_count: 1,
            get_reserve_count: 1,
            get_card_count: 1,
        },
    },
    supportCardC: {
        label: "体力自慢の本気",
        cardId: "card_048",
        maxCount: 7,
        scoreAdds: {
            flat_vi: 15,
        },
        contextAdds: {
            convert_count: 1,
        },
    },
    supportCardD: {
        label: "ゆうじょーのきろく",
        cardId: "card_049",
        maxCount: 2,
        contextAdds: {
            enhance_count: 1,
            enhance_m_count: 1,
        },
    },
    supportCardE: {
        label: "パワーをくれるモノ",
        cardId: "card_042",
        maxCount: 2,
        contextAdds: {
            convert_count: 1,
        },
    },

    supportCardF: {
        label: "とうちょーのきろく",
        cardId: "card_067",
        maxCount: 7,
        scoreAdds: {
            flat_vi: 15,
        },
        contextAdds: {},
    },

    supportCardG: {
        label: "ふわふわでもこもこ",
        cardId: "card_105",
        maxCount: 7,
        contextAdds: {
            get_drink_count: 2,
        },
    },

    supportCardH: {
        label: "美鈴からの贈り物",
        cardId: "card_104",
        maxCount: 7,
        contextAdds: {
            enhance_count: 1,
            enhance_m_count: 1,
            enhance_a_count: 1,
        },
    },

};


export const GENERAL_EFFECTS = {
    drink: {
        label: "ドリンク獲得追加",
        maxCount: 12,
        contextAdds: {
            get_drink_count: 1,
        },
    },
};