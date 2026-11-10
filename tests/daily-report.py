import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('daily_report', Path(__file__).resolve().parents[1]/'scripts/daily-report.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class Tests(unittest.TestCase):
    def test_winter_summer_and_delayed_run(self):
        self.assertTrue(m.scheduled_slot('30 7 * * *', datetime(2026,11,10,10,tzinfo=timezone.utc)))
        self.assertFalse(m.scheduled_slot('30 6 * * *', datetime(2026,11,10,10,tzinfo=timezone.utc)))
        self.assertTrue(m.scheduled_slot('30 6 * * *', datetime(2026,7,10,7,tzinfo=timezone.utc)))
    def test_dst_day_window(self):
        start,end=m.reporting_window(datetime(2026,3,30,7,tzinfo=timezone.utc))
        self.assertEqual((end.astimezone(timezone.utc)-start.astimezone(timezone.utc)).total_seconds(),23*3600)
    def test_report_filters_dates_and_does_not_claim_tests(self):
        raw='abc\t2026-11-09T15:00:00+01:00\tCorrection\ndef\t2026-11-10T10:00:00+01:00\tAutre\n'
        with patch.object(m.subprocess,'check_output',return_value=raw):
            result=m.build_report(datetime(2026,11,10,8,tzinfo=timezone.utc))
        self.assertIn('Correction',result)
        self.assertNotIn('Autre',result)
        self.assertIn('ne prouve ni les tests',result)
    def test_no_credentials_no_send(self):
        with patch.dict(m.os.environ,{},clear=True), patch.object(m.smtplib,'SMTP_SSL') as smtp:
            with self.assertRaises(ValueError): m.send_report('Bilan')
            smtp.assert_not_called()
if __name__=='__main__': unittest.main()
