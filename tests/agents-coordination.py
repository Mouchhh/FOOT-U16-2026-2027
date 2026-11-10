import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts/agents.py'

class CoordinationTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True)

    def test_every_role_has_complete_brief(self):
        config = json.loads((ROOT / 'organisation-agents/agents.json').read_text())
        self.assertFalse(config['automation_enabled'])
        for agent in config['agents']:
            result = self.run_cli('brief', agent['id'], '--mission', 'Mission de vérification')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('Règles communes', result.stdout)
            self.assertIn('Mission de vérification', result.stdout)
            self.assertIn(agent['name'], result.stdout)

    def test_reports_do_not_invent_work_and_reject_duplicates(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            args = ('report', '--date', '2026-11-10', '--input', directory)
            empty = self.run_cli(*args)
            self.assertEqual(empty.stdout.count('Rapport non reçu'), 13)
            report = dict(agent='03-donnees', date='2026-11-10', statut='a_valider', resume='Audit fictif pour test', preuves=['fixture'], blocages=[], propositions=[], decisions=['Examiner le livrable'])
            (path/'one.json').write_text(json.dumps(report))
            result = self.run_cli(*args)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout.count('Rapport non reçu'), 12)
            self.assertIn('2026-11-10/03-donnees/D01', result.stdout)
            (path/'two.json').write_text(json.dumps(report))
            self.assertNotEqual(self.run_cli(*args).returncode, 0)

    def test_invalid_report_fails_without_partial_report(self):
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory)/'invalid.json').write_text('{"date":"2026-11-10","agent":"unknown"}')
            result = self.run_cli('report', '--date', '2026-11-10', '--input', directory)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stdout, '')

if __name__ == '__main__':
    unittest.main()
