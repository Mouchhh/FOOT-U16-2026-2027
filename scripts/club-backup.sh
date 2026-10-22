#!/usr/bin/env bash
# Données du club uniquement ; connexion via pg_service.conf / pgpass.
set -euo pipefail
umask 077
if [[ $# != 1 || -z ${PGSERVICE:-} ]]; then
  echo 'Usage : PGSERVICE=club_source bash scripts/club-backup.sh /dossier-prive/club.dump' >&2
  exit 2
fi
command -v pg_dump >/dev/null
command -v pg_restore >/dev/null
target=$1
if [[ -e "$target" ]]; then echo 'Le fichier existe déjà ; choisissez un autre nom.' >&2; exit 2; fi
stage=$(mktemp "${target}.XXXXXX")
trap 'rm -f "$stage"' EXIT
pg_dump --format=custom --data-only --no-owner --no-privileges \
  --table=public.club_members --table=public.club_documents \
  --table=public.club_invitations --table=public.club_sport_leads \
  --table=public.club_document_reviews --file="$stage"
pg_restore --list "$stage" >/dev/null
# Ne jamais écraser une archive existante, même créée pendant le dump.
ln "$stage" "$target"
echo 'Archive créée. Elle contient des données personnelles : conservez-la hors du dépôt et du site.'
echo 'Les comptes Authentication, fichiers Storage et brouillons locaux ne sont pas inclus.'
