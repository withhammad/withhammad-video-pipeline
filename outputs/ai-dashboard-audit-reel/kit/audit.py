"""Audit the bundled fictional sample only. Python 3, standard library."""
import csv
import json
import hashlib
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIELDS = ['order_id', 'date', 'currency', 'amount']


def audit_rows(rows):
    if not rows:
        raise ValueError('No orders')
    seen, clean, duplicates, currencies = {}, [], [], set()
    original_total = Decimal(0)
    for line, row in enumerate(rows, 2):
        if set(row) != set(FIELDS) or any(not isinstance(row[k], str) or not row[k].strip() for k in FIELDS):
            raise ValueError(f'Missing or unexpected values at CSV row {line}')
        try:
            parsed_date = date.fromisoformat(row['date'])
            amount = Decimal(row['amount'])
        except (ValueError, InvalidOperation):
            raise ValueError(f'Invalid date or numeric amount at CSV row {line}') from None
        if not amount.is_finite() or amount < 0 or amount.as_tuple().exponent < -2:
            raise ValueError(f'Invalid amount at CSV row {line}')
        if not date(2026, 10, 1) <= parsed_date <= date(2026, 10, 6):
            raise ValueError(f'Outside sample date window at CSV row {line}')
        currencies.add(row['currency'])
        original_total += amount
        key = row['order_id']
        if key in seen:
            previous_line, previous_row = seen[key]
            if previous_row != row:
                raise ValueError(f'Conflicting repeated order ID {key}: rows {previous_line} and {line}; no cleaning allowed')
            duplicates.append({'order_id': key, 'retained_csv_row': previous_line, 'removed_csv_row': line, 'amount': str(amount), 'classification': 'exact duplicate; reviewed synthetic sample'})
        else:
            seen[key] = (line, row)
            clean.append(row)
    if currencies != {'AED'}:
        raise ValueError('Expected one currency: AED; mixed or unexpected currencies rejected')
    cleaned_total = sum((Decimal(r['amount']) for r in clean), Decimal(0))
    removed = sum((Decimal(r['amount']) for r in duplicates), Decimal(0))
    assert original_total - removed == cleaned_total
    return clean, {'sample_only': True, 'unit_of_row': 'one complete order, not a line item', 'currency': 'AED', 'date_range': ['2026-10-01', '2026-10-06'], 'original_rows': len(rows), 'cleaned_rows': len(clean), 'original_total': str(original_total), 'removed_amount': str(removed), 'cleaned_total': str(cleaned_total), 'reconciliation_pass': True, 'repeated_ids': duplicates, 'policy': 'Exact duplicate removal is approved for this fictional sample only. Review repeated IDs in real data before any change.'}


def main():
    source = ROOT / 'orders.csv'
    before = source.read_bytes()
    with source.open(newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != FIELDS:
            raise ValueError('Unexpected CSV columns')
        rows = list(reader)
    clean, report = audit_rows(rows)
    # Guard against operating on other datasets: the CLI accepts no input path.
    expected = [{'order_id': f'O-{1001+i}', 'date': f'2026-10-0{i+1}', 'currency': 'AED', 'amount': str(a)} for i, a in enumerate([1200, 1800, 3000, 2400, 1600, 2000])]
    if rows != expected + [expected[2]]:
        raise ValueError('This script only operates on the unchanged bundled seven-row sample')
    with (ROOT / 'cleaned-orders.csv').open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(clean)
    report['source_sha256'] = hashlib.sha256(before).hexdigest()
    (ROOT / 'audit.json').write_text(json.dumps(report, indent=2) + '\n')
    assert source.read_bytes() == before, 'Original changed'
    print('Sample audit passed: AED 15,000 - AED 3,000 = AED 12,000. Original preserved.')

if __name__ == '__main__':
    main()
