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
    def test_missing_secret_diagnostic_never_contains_values(self):
        env = dict(REPORT_SMTP_HOST='smtp.gmail.com', REPORT_SMTP_USER='private-user', REPORT_SMTP_PASSWORD='private-password', REPORT_FROM='private-from')
        with patch.dict(m.os.environ,env,clear=True), patch.object(m.smtplib,'SMTP_SSL') as smtp:
            with self.assertRaises(m.EmailConfigurationError) as caught:
                m.send_report('Bilan')
            self.assertIn('REPORT_TO',str(caught.exception))
            self.assertNotIn('private-',str(caught.exception))
            smtp.assert_not_called()
    def test_newline_diagnostic_redacts_value(self):
        env = {key:'private' for key in ['REPORT_SMTP_HOST','REPORT_SMTP_USER','REPORT_SMTP_PASSWORD','REPORT_FROM','REPORT_TO']}
        env['REPORT_TO']='private\naddress'
        with patch.dict(m.os.environ,env,clear=True):
            with self.assertRaises(m.EmailConfigurationError) as caught:
                m.send_report('Bilan')
            self.assertIn('REPORT_TO',str(caught.exception))
            self.assertNotIn('private',str(caught.exception))
    def test_disconnect_stage_and_no_retry(self):
        env = {key:'private' for key in ['REPORT_SMTP_HOST','REPORT_SMTP_USER','REPORT_SMTP_PASSWORD','REPORT_FROM','REPORT_TO']}
        with patch.dict(m.os.environ,env,clear=True), patch.object(m.smtplib,'SMTP_SSL') as smtp:
            smtp.return_value.login.side_effect=m.smtplib.SMTPServerDisconnected('private response')
            with self.assertRaises(m.EmailTransportError) as caught:
                m.send_report('Bilan')
            self.assertIn('authentification',str(caught.exception))
            self.assertNotIn('private',str(caught.exception))
            smtp.return_value.send_message.assert_not_called()
            self.assertEqual(smtp.call_count,1)
    def test_accepted_mail_survives_quit_disconnect(self):
        env = {key:'private' for key in ['REPORT_SMTP_HOST','REPORT_SMTP_USER','REPORT_SMTP_PASSWORD','REPORT_FROM','REPORT_TO']}
        with patch.dict(m.os.environ,env,clear=True), patch.object(m.smtplib,'SMTP_SSL') as smtp:
            smtp.return_value.send_message.return_value={}
            smtp.return_value.quit.side_effect=m.smtplib.SMTPServerDisconnected('private response')
            m.send_report('Bilan')
            smtp.return_value.send_message.assert_called_once()
            smtp.return_value.close.assert_called_once()
if __name__=='__main__': unittest.main()
