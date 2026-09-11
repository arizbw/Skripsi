-- Backfill delivery_order.volume dan delivery_order.quantity
-- dari penjumlahan product_line yang berasosiasi
--
-- Jalankan: psql -U postgres -d paragon -f backfill_do_volume_quantity.sql
-- Atau via Docker: docker exec -i <container> psql -U postgres -d paragon < backfill_do_volume_quantity.sql

-- 1. Cek kondisi sebelum update (opsional)
SELECT 
    COUNT(*) AS total_do,
    COUNT(volume) AS has_volume,
    COUNT(quantity) AS has_quantity
FROM delivery_order;

-- 2. Update volume dan quantity dari product_line
UPDATE delivery_order d
SET volume   = sub.total_volume,
    quantity = sub.total_quantity
FROM (
    SELECT 
        delivery_order_id,
        SUM(volume)   AS total_volume,
        SUM(quantity)  AS total_quantity
    FROM product_line
    GROUP BY delivery_order_id
) sub
WHERE d.id = sub.delivery_order_id;

-- 3. Verifikasi hasil
SELECT 
    d.id,
    d.delivery_order_num,
    d.volume,
    d.quantity,
    COUNT(pl.product_id) AS jumlah_produk
FROM delivery_order d
LEFT JOIN product_line pl ON pl.delivery_order_id = d.id
GROUP BY d.id, d.delivery_order_num, d.volume, d.quantity
ORDER BY d.id
LIMIT 20;
