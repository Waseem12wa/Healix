import argparse
import csv
import os


BASE_DRUGS = [
    "aspirin", "ibuprofen", "paracetamol", "acetaminophen", "metformin", "warfarin",
    "amoxicillin", "lisinopril", "atorvastatin", "omeprazole", "simvastatin", "cetirizine",
    "naproxen", "pantoprazole", "clopidogrel", "azithromycin", "insulin", "metoprolol",
    "losartan", "amlodipine", "rosuvastatin", "furosemide", "levothyroxine", "sertraline",
]

BASE_FOODS = [
    "grapefruit", "grapefruit juice", "alcohol", "milk", "cheese", "yogurt", "coffee",
    "caffeine", "spinach", "broccoli", "soy", "cranberry juice", "green tea", "salt",
    "orange juice", "apple juice", "garlic", "ginger", "dark chocolate", "nuts",
]


def write_scaled_csv(path: str, seeds: list[str], total: int) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for i in range(total):
            seed = seeds[i % len(seeds)]
            # Keep canonical terms unchanged so DDI/DFI name normalization resolves correctly.
            writer.writerow([seed])


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate large drugs/foods CSV dictionaries")
    parser.add_argument("--drugs", type=int, default=1_000_000, help="Number of drug names to generate")
    parser.add_argument("--foods", type=int, default=1_000_000, help="Number of food names to generate")
    parser.add_argument("--out-dir", default=os.path.join(os.path.dirname(__file__), "..", "data"), help="Output directory")
    args = parser.parse_args()

    out_dir = os.path.abspath(args.out_dir)
    drugs_path = os.path.join(out_dir, "drugs.csv")
    foods_path = os.path.join(out_dir, "foods.csv")

    print(f"Generating drugs.csv with {args.drugs:,} rows...")
    write_scaled_csv(drugs_path, BASE_DRUGS, args.drugs)
    print(f"Wrote: {drugs_path}")

    print(f"Generating foods.csv with {args.foods:,} rows...")
    write_scaled_csv(foods_path, BASE_FOODS, args.foods)
    print(f"Wrote: {foods_path}")

    print("Done.")


if __name__ == "__main__":
    main()
