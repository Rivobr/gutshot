-- Provisional finishing place recorded during a live tournament
-- (before finish awards XP via TournamentResult).
ALTER TABLE "Registration" ADD COLUMN "place" INTEGER;
