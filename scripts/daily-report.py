#!/usr/bin/env python3
"""Bilan Git factuel, sans IA et sans modification du dépôt."""
import argparse
from datetime import datetime, time, timedelta, timezone
from email.message import EmailMessage
import json
import os
from pathlib import Path
import smtplib
import ssl
import subprocess
from zoneinfo import ZoneInfo

PARIS = ZoneInfo('Europe/Paris')
ROOT = Path(__file__).resolve().parents[1]

def reporting_window(now):
    day = now.astimezone(PARIS).date() - timedelta(days=1)
    return (datetime.combine(day, time.min, PARIS),
            datetime.combine(day + timedelta(days=1), time.min, PARIS))

def scheduled_slot(schedule, now):
    # Choisir le créneau UTC selon l'heure d'hiver/été, même si Actions démarre en retard.
    target = datetime.combine(now.astimezone(PARIS).date(), time(8, 30), PARIS)
    return schedule == f'30 {target.astimezone(timezone.utc).hour} * * *'

def build_report(now):
    start, end = reporting_window(now)
    # Filtrer les dates explicitement : git --since peut arrêter la recherche sur un historique non monotone.
    raw = subprocess.check_output(['git', 'log', '--first-parent', '--format=%H%x09%cI%x09%s'], cwd=ROOT, text=True)
    commits = []
    for line in raw.splitlines():
        sha, stamp, subject = line.split('\t', 2)
        if start <= datetime.fromisoformat(stamp) < end:
            commits.append((sha, subject))
    lines = [f'# Le Vestiaire — bilan du {start:%d/%m/%Y}', '',
             'Source : historique Git de main, dates de commit en heure de Paris. '
             'Ce relevé ne prouve ni les tests réussis ni le déploiement. Il ne représente pas une exécution autonome des agents.', '',
             '## Modifications enregistrées', '']
    lines += [f'- {sha[:12]} : {subject}' for sha, subject in commits] or ['Aucun commit daté de cette journée dans l’historique consulté.']
    lines += ['', '## Pôles', '']
    config = json.loads((ROOT / 'organisation-agents/agents.json').read_text())
    for agent in config['agents']:
        lines.append(f"- {agent['id']} · {agent['name']} : aucun rapport structuré collecté automatiquement ; travail du pôle non confirmé.")
    lines += ['', '## Tests, blocages et validations', '',
              'Les résultats de tests et décisions des conversations ChatGPT ne sont pas accessibles à ce workflow. '
              'Ils restent à fournir au directeur ; aucune approbation ni mise en ligne n’est déclenchée par ce bilan.', '',
              'Consulter GitHub Actions pour les résultats des exécutions. Les messages de commit sont des déclarations de leurs auteurs.', '']
    return '\n'.join(lines)

def send_report(body):
    required = ['REPORT_SMTP_HOST', 'REPORT_SMTP_USER', 'REPORT_SMTP_PASSWORD', 'REPORT_FROM', 'REPORT_TO']
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise ValueError('Configuration e-mail manquante : ' + ', '.join(missing))
    message = EmailMessage()
    message['Subject'] = body.splitlines()[0].removeprefix('# ')
    message['From'] = os.environ['REPORT_FROM']
    message['To'] = os.environ['REPORT_TO']
    message.set_content(body)
    # Pas de retry automatique : éviter un doublon si l'accusé de réception se perd.
    with smtplib.SMTP_SSL(os.environ['REPORT_SMTP_HOST'], 465, context=ssl.create_default_context(), timeout=30) as server:
        server.login(os.environ['REPORT_SMTP_USER'], os.environ['REPORT_SMTP_PASSWORD'])
        server.send_message(message)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--gate', action='store_true')
    parser.add_argument('--send', action='store_true')
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    if args.gate:
        event = os.environ.get('GITHUB_EVENT_NAME')
        should_run = event == 'workflow_dispatch' or scheduled_slot(os.environ.get('REPORT_SCHEDULE', ''), now)
        with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
            stream.write(f"run={'true' if should_run else 'false'}\n")
        return
    body = build_report(now)
    if args.send:
        try:
            send_report(body)
        except Exception as error:
            # Ne pas imprimer les réponses SMTP qui peuvent contenir des adresses.
            raise SystemExit(f'Envoi non confirmé ({type(error).__name__}). Vérifier la configuration privée et la boîte destinataire avant de relancer.') from None
        print('Rapport transmis au serveur e-mail ; livraison à vérifier dans la boîte destinataire.')
    else:
        print(body)

if __name__ == '__main__':
    main()
