-- AlterEnum: места 11–20 для шкалы рейтинга
-- Значения enum добавляются отдельной миграцией от INSERT,
-- т.к. в PostgreSQL новый enum value нельзя использовать в той же транзакции.
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_11';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_12';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_13';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_14';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_15';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_16';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_17';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_18';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_19';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_20';
