import unittest,csv,copy
from pathlib import Path
from audit import audit_rows
class AuditTest(unittest.TestCase):
    def setUp(self):
        with Path(__file__).with_name('orders.csv').open() as f:self.rows=list(csv.DictReader(f))
    def test_totals(self):
        clean,r=audit_rows(self.rows)
        self.assertEqual((len(clean),r['original_total'],r['removed_amount'],r['cleaned_total']),(6,'15000','3000','12000'))
        self.assertEqual(r['repeated_ids'][0]['removed_csv_row'],8)
        self.assertEqual(len(self.rows),7)
    def test_bad_values(self):
        for field,value in [('amount','NaN'),('amount','bad'),('amount','-1'),('date','2026-02-30'),('date','2026-11-01'),('currency','USD'),('order_id','')]:
            with self.subTest(field=field,value=value):
                rows=copy.deepcopy(self.rows);rows[0][field]=value
                with self.assertRaises(ValueError):audit_rows(rows)
    def test_conflicting_id(self):
        rows=copy.deepcopy(self.rows);rows[-1]['amount']='3500'
        with self.assertRaisesRegex(ValueError,'Conflicting'):audit_rows(rows)
    def test_missing(self):
        rows=copy.deepcopy(self.rows);del rows[0]['date']
        with self.assertRaises(ValueError):audit_rows(rows)
if __name__=='__main__':unittest.main()
