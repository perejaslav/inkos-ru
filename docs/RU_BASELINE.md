# InkOS RU — исходный контроль и безопасность выпуска

- Исходный upstream: `53adac4e974b54dafda975edc4edd07cad364c18` (Narcooo/inkos master, 2026-10-24).
- Родитель форка на момент начала работ: `c4bba03d2ec1976c46aa24f403393f387b1ee41c`.
- Windows 11, Node v24.21.0; глобальный pnpm 11.24.0 не подходит для `pnpm install --frozen-lockfile` (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH). Исходный CI использует pnpm 9.
- Первоочередное действие безопасности: исходный workflow `.github/workflows/release.yml`, автоматически публиковавший upstream npm-пакеты `@actalk/*` по тегам `v*`, перемещён в `.github/upstream-release.yml.disabled`. Исходный workflow сохранён для аудита, но больше не является исполняемым GitHub Actions workflow.
- Релиз и публикация в npm запрещены до отдельного решения по namespace, токенам и правам доступа.
- `npx --yes pnpm@9.15.9 install --frozen-lockfile` — **PASS**, 1011 установленных зависимостей; lockfile не перегенерирован.
- Первое выполнение общего `build` после внесения `ru_words` завершилось **FAIL**, так как расширение старого `LengthLanguage` затронуло несовместимые конвейерные типы. Тип исправлен обратно на `zh|en`; новый `SupportedLengthLanguage` добавлен отдельно без разрыва старого контракта.
- `npx --yes pnpm@9.15.9 --filter @actalk/inkos-core typecheck` — **PASS** после исправления.
- `npx --yes pnpm@9.15.9 --filter @actalk/inkos-core test` — **PASS: 124 тестовых файла / 703 теста** (после первого `ru_words`, до добавления `language-code.test.ts`).
- `npx --yes pnpm@9.15.9 --filter @actalk/inkos-core exec vitest run src/__tests__/language-code.test.ts src/__tests__/length-metrics.test.ts` — **PASS: 2 файла / 19 тестов** после добавления нормализатора.
- Все package-wide UI/CLI test, E2E, flow и повторная общая сборка после последних изменений: **NOT VERIFIED**; результаты не приписываются этой контрольной точке.
- Важно: первый общий build был запущен во время начальных исправлений, поэтому не является чистым неизменённым upstream baseline; результаты относятся к первой рабочей итерации форка.

## Следующая последовательность

1. Установить зависимости на pnpm 9 с неизменным `pnpm-lock.yaml`.
2. Запустить исходные `build`, `typecheck`, `test`, при возможности `test:flows`.
3. Добавить строгий русский счётчик и тесты, затем расширять языковые контракты в отдельных шагах.
4. При каждом изменении сравнивать результаты с исходным baseline и отдельно фиксировать сохранность `zh/en`.
