import sys, csv, json, os


def read_csv(path: str):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing CSV path'}))
        return
    csv_path = sys.argv[1]
    if not os.path.isfile(csv_path):
        print(json.dumps({'error': f"File not found: {csv_path}"}))
        return
    rows = read_csv(csv_path)
    json.dump({'rows': rows}, sys.stdout)


if __name__ == '__main__':
    main()
