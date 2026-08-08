-- Enum extensions (own migration: new values usable only after commit).
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'DEALER';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_31_40';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_41_50';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_51_PLUS';
