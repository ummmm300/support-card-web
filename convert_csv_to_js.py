import csv
import os
import json

BASE_DIR = os.path.dirname(__file__)

ABILITY_CSV = os.path.join(BASE_DIR, "src", "csv", "ability_db.csv")
CARD_CSV = os.path.join(BASE_DIR, "src", "csv", "support_card_db.csv")

ABILITY_JS = os.path.join(BASE_DIR, "src", "data", "abilityDb.js")
CARD_JS = os.path.join(BASE_DIR, "src", "data", "cards.js")


def parse_float(x):
    if x is None or x == "":
        return 0
    return float(x)


def parse_int(x):
    if x is None or x == "":
        return 0
    return int(x)


def parse_tags(x):
    if x is None:
        return []

    raw = str(x).strip()

    if raw == "":
        return []

    return [tag.strip() for tag in raw.split("|") if tag.strip()]


def convert_ability_db():
    result = {}

    with open(ABILITY_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for row in reader:
            ability_id = row["id"].strip()
            tier = row["tier"].strip()

            key = f"{ability_id}__{tier}"

            limit_raw = str(row.get("limit_count", "")).strip()
            limit_count = float(limit_raw) if limit_raw else -1

            result[key] = {
                "kind": row["kind"].strip(),
                "values": [
                    parse_float(row["I"]),
                    parse_float(row["II"]),
                    parse_float(row["III"]),
                    parse_float(row["IV"]),
                    parse_float(row["V"]),
                ],
                "limit_count": limit_count,
            }

    with open(ABILITY_JS, "w", encoding="utf-8") as f:
        f.write("export const abilityDb = ")
        f.write(json.dumps(result, ensure_ascii=False, indent=2))
        f.write(";\n")

    print("abilityDb.js 生成完了")


def convert_card_db():
    result = []

    with open(CARD_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for row in reader:
            abilities = [
                row.get("ab1", "none_id").strip() or "none_id",
                row.get("ab2", "none_id").strip() or "none_id",
                row.get("ab4", "none_id").strip() or "none_id",
                row.get("ab5", "none_id").strip() or "none_id",
                row.get("ab6", "none_id").strip() or "none_id",
                row.get("item", "none_id").strip() or "none_id",
            ]

            result.append({
                "card_id": row["card_id"].strip(),
                "name": row["name"].strip(),
                "rarity": row["rarity"].strip(),
                "ability_tier": row["ability_tier"].strip(),
                "param_type": row["param_type"].strip(),
                "sp_rate": parse_int(row.get("sp_rate", 0)),

                "sense": parse_int(row.get("sense", 0)),
                "logic": parse_int(row.get("logic", 0)),
                "anomaly": parse_int(row.get("anomaly", 0)),

                "rental_candidate": parse_int(row.get("rental_candidate", 0)),

                "abilities": abilities,
                "synergy_tags": parse_tags(row.get("synergy_tags", "")),
            })

    with open(CARD_JS, "w", encoding="utf-8") as f:
        f.write("export const cards = ")
        f.write(json.dumps(result, ensure_ascii=False, indent=2))
        f.write(";\n")

    print("cards.js 生成完了")


if __name__ == "__main__":
    convert_ability_db()
    convert_card_db()