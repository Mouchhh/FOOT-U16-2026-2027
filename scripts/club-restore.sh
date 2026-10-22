#!/usr/bin/env bash
# Restauration des tables applicatives sur cible vide, comptes déjà restaurés.
set -euo pipefail
umask 077
if [[ $# != 2 || "$1" != '--empty-target' || -z ${PGSERVICE:-} ]]; then
  echo 'Usage : PGSERVICE=club_test bash scripts/club-restore.sh --empty-target /dossier-prive/club.dump' >&2
  exit 2
fi
command -v pg_restore >/dev/null
command -v psql >/dev/null
[[ -f "$2" ]] || { echo 'Archive introuvable.' >&2; exit 2; }
stage=$(mktemp)
trap 'rm -f "$stage"' EXIT
cat > "$stage" <<'SQL'
-- Verrouille les tables pendant le contrôle et toute la restauration.
lock table public.club_members,public.club_documents,public.club_invitations,
 public.club_sport_leads,public.club_document_reviews in access exclusive mode;
do $$begin
 if exists(select 1 from public.club_members)
 or exists(select 1 from public.club_documents)
 or exists(select 1 from public.club_invitations)
 or exists(select 1 from public.club_sport_leads)
 or exists(select 1 from public.club_document_reviews) then
 raise exception 'Restauration refusée : les tables cibles doivent être vides';
 end if;
end $$;
SQL
pg_restore --data-only --no-owner --no-privileges --file=- "$2" >> "$stage"
# Aucun DELETE/TRUNCATE ni désactivation des droits, contraintes ou triggers.
# Une erreur (notamment compte auth manquant) annule toute la transaction.
psql --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction --file="$stage"
echo 'Transaction terminée. Vérifiez les comptes, droits et documents avant de remettre le site en service.'
