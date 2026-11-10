#!/usr/bin/env python3
"""Prépare les missions et consolide des rapports. N'exécute aucun modèle ni déploiement."""
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'organisation-agents'

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

def date_value(value):
    return dt.date.fromisoformat(value).isoformat()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('list')
    brief = sub.add_parser('brief')
    brief.add_argument('agent')
    brief.add_argument('--mission', required=True)
    report = sub.add_parser('report')
    report.add_argument('--date', type=date_value, required=True)
    report.add_argument('--input', type=Path, required=True, help='Dossier privé contenant les rapports JSON')
    args = parser.parse_args()
    config = read_json(ROOT / 'agents.json')
    agents = {a['id']: a for a in config['agents']}
    if args.command == 'list':
        for a in agents.values():
            print(f"{a['id']} | {a['pole']} | {a['name']}")
    elif args.command == 'brief':
        if args.agent not in agents:
            parser.error('Agent inconnu : utiliser list.')
        for filename in ('CHARTE.md', 'CONTEXTE.md', agents[args.agent]['instructions']):
            print((ROOT / filename).read_text(encoding='utf-8'))
        print('\n# Mission confiée\n\n' + args.mission)
        print('\nRetour attendu : JSON suivant le modèle ci-dessous. Ne pas inventer de résultats.\n')
        print((ROOT / 'modeles/rapport-agent.json').read_text(encoding='utf-8'))
        print(f'Utiliser agent={args.agent} et la date réelle du travail.')
    else:
        if not args.input.is_dir():
            parser.error('Le dossier de rapports est introuvable.')
        reports = {}
        try:
            for path in sorted(args.input.glob('*.json')):
                row = read_json(path)
                if row.get('date') != args.date:
                    continue
                agent = row['agent']
                if agent not in agents or agent in reports:
                    raise ValueError(f'{path.name}: agent inconnu ou rapport en double')
                if row.get('statut') not in ('a_valider', 'bloque', 'termine', 'en_cours'):
                    raise ValueError(f'{path.name}: statut non reconnu')
                if not isinstance(row.get('resume'), str):
                    raise ValueError(f'{path.name}: résumé absent')
                for field in ('preuves', 'blocages', 'propositions', 'decisions'):
                    if not isinstance(row.get(field), list) or not all(isinstance(x, str) for x in row[field]):
                        raise ValueError(f'{path.name}: {field} doit être une liste de textes')
                reports[agent] = row
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            parser.error(str(error))
        lines = [f'# Rapport du {args.date}', '', 'Compilation des déclarations reçues ; les preuves restent à vérifier par la qualité et le directeur. Aucune décision ni publication automatique.', '']
        for agent, definition in agents.items():
            lines += [f"## {agent} · {definition['name']}", '']
            row = reports.get(agent)
            if not row:
                lines += ['Rapport non reçu — aucun travail confirmé.', '']
                continue
            lines += [f"Statut déclaré : {row['statut']}", '', row['resume'], '']
            for label, field in [('Preuves', 'preuves'), ('Blocages', 'blocages'), ('Propositions', 'propositions'), ('Décisions attendues', 'decisions')]:
                lines += [f'### {label}', '']
                for i, item in enumerate(row[field], 1):
                    ident = f'{args.date}/{agent}/D{i:02d} — ' if field == 'decisions' else ''
                    lines.append(f'- {ident}{item}')
                if not row[field]:
                    lines.append('Aucun élément déclaré.')
                lines.append('')
        lines += ['## Validation du propriétaire', '', 'Pour chaque décision : identifiant, valider / modifier / refuser, version ou livrable concerné, commentaire et date. Conserver cette réponse dans un registre privé. Ce script ne déclenche aucune action après validation.']
        print('\n'.join(lines))

if __name__ == '__main__':
    main()
