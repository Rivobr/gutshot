import { Prisma } from '@prisma/client';

/**
 * Клиент Prisma внутри интерактивной транзакции.
 * Сервисы принимают его, чтобы вызывающий код мог объединять
 * несколько операций в одну атомарную транзакцию.
 */
export type PrismaTransaction = Prisma.TransactionClient;
