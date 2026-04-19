
April 2026 already exists in the database with value R$ 3.037,72, but `variacao_mensal` is NULL (acumulado_ano shows 4.17 — likely stale from before March 2026 was inserted). That's why the table shows "-" for the monthly variation.

Calculated correctly: (3037,72 − 3028,45) / 3028,45 = **0,31%** ✓

The `calculate_cub_variations` trigger only fires on INSERT/UPDATE of the row itself, so inserting March later didn't recompute April.

## Fix

Re-trigger the calculation for April 2026 by running an UPDATE that sets the same value, which will fire the trigger and recompute both `variacao_mensal` (→ 0,31%) and `acumulado_ano`.

```sql
UPDATE cub_values 
SET value = 3037.72 
WHERE month = 4 AND year = 2026;
```

After this, the admin history table for 2026 will show the correct 0,31% variation for April.
