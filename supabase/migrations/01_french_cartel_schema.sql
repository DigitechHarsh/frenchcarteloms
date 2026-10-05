-- ==============================================================================
-- FRENCH CARTEL OMS - COMPLETE DATABASE SCHEMA & MIGRATION
-- Database: PostgreSQL (Supabase)
-- Timezone convention: Asia/Kolkata (+05:30)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE menu_item_type AS ENUM ('size', 'flavor', 'topping', 'free_topping');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('new', 'preparing', 'ready', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type menu_item_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    short_code VARCHAR(20),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    color_hint VARCHAR(30), -- Custom accent color for UI tiles
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 4. DAILY TOKEN TRACKER (Safe atomic token sequence per date)
CREATE TABLE IF NOT EXISTS daily_token_counters (
    order_date DATE PRIMARY KEY,
    last_token INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number INT NOT NULL,
    order_date DATE NOT NULL DEFAULT (timezone('Asia/Kolkata', now())::DATE),
    status order_status NOT NULL DEFAULT 'new',
    is_priority BOOLEAN NOT NULL DEFAULT false,
    customer_name VARCHAR(120),
    notes TEXT,
    payment_type payment_method NOT NULL DEFAULT 'upi',
    is_paid BOOLEAN NOT NULL DEFAULT true,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    assigned_chef VARCHAR(50), -- e.g. 'Chef 1' | 'Chef 2'
    is_demo BOOLEAN NOT NULL DEFAULT false, -- For easy deletion of seed data
    cancellation_reason TEXT,
    audit_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_token_per_date UNIQUE(order_date, token_number)
);

-- 6. ORDER ITEMS (Bowls)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    size_id UUID REFERENCES menu_items(id),
    flavor_id UUID REFERENCES menu_items(id),
    size_name VARCHAR(100) NOT NULL,
    size_code VARCHAR(20) NOT NULL,
    flavor_name VARCHAR(100) NOT NULL,
    free_topping VARCHAR(50) NOT NULL DEFAULT 'None', -- 'Jalapeno' | 'Olives' | 'None'
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Snapshot of bowl total price
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    CONSTRAINT chk_free_topping CHECK (free_topping IN ('Jalapeno', 'Olives', 'None'))
);

-- 7. ORDER ITEM PAID TOPPINGS
CREATE TABLE IF NOT EXISTS order_item_toppings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    topping_id UUID REFERENCES menu_items(id),
    topping_name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 -- Snapshot of topping price
);

-- 8. APP SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_is_demo ON orders(is_demo);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_toppings_item_id ON order_item_toppings(order_item_id);

-- 10. SAFE ATOMIC TOKEN GENERATOR
CREATE OR REPLACE FUNCTION get_next_daily_token(p_date DATE)
RETURNS INT AS $$
DECLARE
    v_token INT;
BEGIN
    INSERT INTO daily_token_counters (order_date, last_token, updated_at)
    VALUES (p_date, 1, timezone('Asia/Kolkata', now()))
    ON CONFLICT (order_date)
    DO UPDATE SET 
        last_token = daily_token_counters.last_token + 1,
        updated_at = timezone('Asia/Kolkata', now())
    RETURNING last_token INTO v_token;
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- 11. RPC FUNCTION: ATOMIC PLACE ORDER
CREATE OR REPLACE FUNCTION place_order_atomic(
    p_order JSONB,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_date DATE;
    v_token INT;
    v_order_id UUID;
    v_item RECORD;
    v_topping RECORD;
    v_item_id UUID;
    v_result JSONB;
BEGIN
    -- Determine Kolkata date
    v_date := COALESCE((p_order->>'order_date')::DATE, timezone('Asia/Kolkata', now())::DATE);
    
    -- Atomic token increment
    v_token := get_next_daily_token(v_date);
    
    -- Insert order
    INSERT INTO orders (
        token_number,
        order_date,
        status,
        is_priority,
        customer_name,
        notes,
        payment_type,
        is_paid,
        total_amount,
        assigned_chef,
        is_demo,
        created_at
    ) VALUES (
        v_token,
        v_date,
        COALESCE((p_order->>'status')::order_status, 'new'::order_status),
        COALESCE((p_order->>'is_priority')::BOOLEAN, false),
        p_order->>'customer_name',
        p_order->>'notes',
        COALESCE((p_order->>'payment_type')::payment_method, 'upi'::payment_method),
        COALESCE((p_order->>'is_paid')::BOOLEAN, true),
        (p_order->>'total_amount')::NUMERIC,
        p_order->>'assigned_chef',
        COALESCE((p_order->>'is_demo')::BOOLEAN, false),
        COALESCE((p_order->>'created_at')::TIMESTAMPTZ, timezone('Asia/Kolkata', now()))
    )
    RETURNING id INTO v_order_id;
    
    -- Insert bowls
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            size_id,
            flavor_id,
            size_name,
            size_code,
            flavor_name,
            free_topping,
            price
        ) VALUES (
            v_order_id,
            (v_item.value->>'size_id')::UUID,
            (v_item.value->>'flavor_id')::UUID,
            v_item.value->>'size_name',
            v_item.value->>'size_code',
            v_item.value->>'flavor_name',
            COALESCE(v_item.value->>'free_topping', 'None'),
            (v_item.value->>'price')::NUMERIC
        )
        RETURNING id INTO v_item_id;
        
        -- Insert toppings
        IF v_item.value ? 'toppings' AND jsonb_array_length(v_item.value->'toppings') > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_array_elements(v_item.value->'toppings')
            LOOP
                INSERT INTO order_item_toppings (
                    order_item_id,
                    topping_id,
                    topping_name,
                    price
                ) VALUES (
                    v_item_id,
                    (v_topping.value->>'topping_id')::UUID,
                    v_topping.value->>'topping_name',
                    (v_topping.value->>'price')::NUMERIC
                );
            END LOOP;
        END IF;
    END LOOP;
    
    SELECT jsonb_build_object(
        'order_id', v_order_id,
        'token_number', v_token,
        'order_date', v_date
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 12. AGGREGATE RPC: DASHBOARD METRICS
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_start_date DATE, p_end_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_total_revenue NUMERIC;
    v_total_orders INT;
    v_total_bowls INT;
    v_avg_order_value NUMERIC;
    v_cancelled_orders INT;
    v_avg_prep_time_minutes NUMERIC;
    v_prev_start DATE;
    v_prev_end DATE;
    v_prev_revenue NUMERIC;
    v_prev_orders INT;
    v_result JSONB;
BEGIN
    -- Main period stats
    SELECT 
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount ELSE NULL END), 0)
    INTO v_total_revenue, v_total_orders, v_cancelled_orders, v_avg_order_value
    FROM orders
    WHERE order_date BETWEEN p_start_date AND p_end_date;
    
    -- Bowls count
    SELECT COUNT(*)
    INTO v_total_bowls
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_date BETWEEN p_start_date AND p_end_date AND o.status != 'cancelled';
    
    -- Prep time (from created_at to ready_at in minutes)
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (ready_at - created_at)) / 60.0), 0)
    INTO v_avg_prep_time_minutes
    FROM orders
    WHERE order_date BETWEEN p_start_date AND p_end_date 
      AND ready_at IS NOT NULL 
      AND status IN ('ready', 'completed');

    -- Previous period for comparison
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (p_end_date - p_start_date);
    
    SELECT 
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_prev_revenue, v_prev_orders
    FROM orders
    WHERE order_date BETWEEN v_prev_start AND v_prev_end;

    SELECT jsonb_build_object(
        'total_revenue', ROUND(v_total_revenue, 0),
        'total_orders', v_total_orders,
        'total_bowls', v_total_bowls,
        'avg_order_value', ROUND(v_avg_order_value, 0),
        'cancelled_orders', v_cancelled_orders,
        'avg_prep_time_minutes', ROUND(v_avg_prep_time_minutes, 1),
        'prev_revenue', ROUND(v_prev_revenue, 0),
        'prev_orders', v_prev_orders
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 13. SEED DEFAULT MENU ITEMS
INSERT INTO menu_items (type, name, short_code, price, is_active, sort_order, color_hint)
VALUES
    -- Bowl Sizes
    ('size', 'Bite', 'B', 169.00, true, 1, '#FAAD14'),
    ('size', 'KiloBite', 'KB', 279.00, true, 2, '#F5222D'),
    ('size', 'MegaBite', 'MB', 329.00, true, 3, '#D4380D'),
    ('size', 'GigaBite', 'GB', 389.00, true, 4, '#722ED1'),
    -- Flavors
    ('flavor', 'Spicy Chipotle', 'SC', 0.00, true, 1, '#D4380D'),
    ('flavor', 'Chilly Cheese', 'CC', 0.00, true, 2, '#FA8C16'),
    ('flavor', 'Cheese Peri Peri', 'CPP', 0.00, true, 3, '#FAAD14'),
    ('flavor', 'Korean BBQ', 'KBBQ', 0.00, true, 4, '#873800'),
    -- Paid Toppings
    ('topping', 'Nachos', 'NCH', 60.00, true, 1, '#D48806'),
    ('topping', 'Extra Cheese', 'XC', 30.00, true, 2, '#FFC069'),
    ('topping', 'Kurkure', 'KK', 40.00, true, 3, '#CF1322'),
    -- Free Toppings (Radio button: One only or None)
    ('free_topping', 'Jalapeno', 'JAL', 0.00, true, 1, '#389E0D'),
    ('free_topping', 'Olives', 'OLV', 0.00, true, 2, '#262626'),
    ('free_topping', 'None', 'NON', 0.00, true, 3, '#8C8C8C')
ON CONFLICT DO NOTHING;

-- 14. SEED DEFAULT APP SETTINGS
INSERT INTO app_settings (key, value)
VALUES
    ('truck_name', '"French Cartel"'::jsonb),
    ('pin_cashier', '"1111"'::jsonb),
    ('pin_kitchen', '"2222"'::jsonb),
    ('pin_admin', '"9999"'::jsonb),
    ('timer_amber_minutes', '10'::jsonb),
    ('timer_red_minutes', '15'::jsonb),
    ('sound_alerts_enabled', 'true'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 15. SEED DATA GENERATOR: 30 DAYS OF REALISTIC ORDERS
CREATE OR REPLACE FUNCTION generate_seed_data(p_days_back INT DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
    v_cur_date DATE;
    v_day_offset INT;
    v_order_count INT;
    v_hour INT;
    v_minute INT;
    v_timestamp TIMESTAMPTZ;
    v_size RECORD;
    v_flavor RECORD;
    v_topping RECORD;
    v_token INT;
    v_order_id UUID;
    v_bowl_count INT;
    v_order_total NUMERIC;
    v_bowl_price NUMERIC;
    v_item_id UUID;
    v_free_top TEXT;
    v_chef TEXT;
    v_status order_status;
    v_prep_mins INT;
    v_payment payment_method;
    v_rnd FLOAT;
    v_sizes UUID[];
    v_flavors UUID[];
    v_toppings UUID[];
BEGIN
    -- Cache active IDs
    SELECT array_agg(id) INTO v_sizes FROM menu_items WHERE type = 'size' AND is_active = true;
    SELECT array_agg(id) INTO v_flavors FROM menu_items WHERE type = 'flavor' AND is_active = true;
    SELECT array_agg(id) INTO v_toppings FROM menu_items WHERE type = 'topping' AND is_active = true;

    FOR v_day_offset IN 0..p_days_back LOOP
        v_cur_date := (timezone('Asia/Kolkata', now())::DATE) - v_day_offset;
        
        -- Peak on weekends (Fri-Sun: 45-70 orders, Mon-Thu: 25-45 orders)
        IF EXTRACT(DOW FROM v_cur_date) IN (0, 5, 6) THEN
            v_order_count := 45 + floor(random() * 25)::INT;
        ELSE
            v_order_count := 25 + floor(random() * 20)::INT;
        END IF;

        FOR v_token IN 1..v_order_count LOOP
            -- Realistic food truck hours: 12 PM - 11 PM, peak at 1-3 PM and 6-9 PM
            v_rnd := random();
            IF v_rnd < 0.25 THEN
                v_hour := 12 + floor(random() * 3)::INT; -- Lunch 12-14
            ELSIF v_rnd < 0.80 THEN
                v_hour := 18 + floor(random() * 4)::INT; -- Evening 18-21
            ELSE
                v_hour := 15 + floor(random() * 3)::INT; -- Afternoon 15-17
            END IF;
            v_minute := floor(random() * 60)::INT;
            v_timestamp := (v_cur_date || ' ' || LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_minute::TEXT, 2, '0') || ':00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';

            -- Status: past days are mostly completed or small % cancelled
            v_rnd := random();
            IF v_day_offset = 0 THEN
                IF v_rnd < 0.15 THEN v_status := 'new';
                ELSIF v_rnd < 0.35 THEN v_status := 'preparing';
                ELSIF v_rnd < 0.50 THEN v_status := 'ready';
                ELSIF v_rnd < 0.95 THEN v_status := 'completed';
                ELSE v_status := 'cancelled';
                END IF;
            ELSE
                IF v_rnd < 0.96 THEN v_status := 'completed';
                ELSE v_status := 'cancelled';
                END IF;
            END IF;

            -- Payment distribution: UPI 65%, Card 20%, Cash 15%
            v_rnd := random();
            IF v_rnd < 0.65 THEN v_payment := 'upi';
            ELSIF v_rnd < 0.85 THEN v_payment := 'card';
            ELSE v_payment := 'cash';
            END IF;

            -- Prep duration: 8 to 18 minutes
            v_prep_mins := 7 + floor(random() * 11)::INT;
            v_chef := CASE WHEN random() < 0.5 THEN 'Chef 1' ELSE 'Chef 2' END;

            -- Create order row with placeholder total
            INSERT INTO orders (
                token_number,
                order_date,
                status,
                is_priority,
                customer_name,
                notes,
                payment_type,
                is_paid,
                total_amount,
                assigned_chef,
                is_demo,
                created_at,
                preparing_at,
                ready_at,
                completed_at
            ) VALUES (
                v_token,
                v_cur_date,
                v_status,
                (random() < 0.12), -- 12% priority
                (ARRAY['Rahul', 'Aman', 'Pooja', 'Sneha', 'Vikram', 'Rohan', 'Ananya', 'Kavya', 'Aditya', 'Neha', 'Karan'])[floor(random()*11 + 1)],
                CASE WHEN random() < 0.25 THEN (ARRAY['Extra crispy please', 'Less spicy', 'Pack separately', 'Keep warm', 'Sauce on side'])[floor(random()*5 + 1)] ELSE NULL END,
                v_payment,
                (v_status != 'cancelled' AND random() > 0.05),
                0,
                v_chef,
                true, -- Mark as demo seed
                v_timestamp,
                CASE WHEN v_status IN ('preparing', 'ready', 'completed') THEN v_timestamp + INTERVAL '2 minutes' ELSE NULL END,
                CASE WHEN v_status IN ('ready', 'completed') THEN v_timestamp + (v_prep_mins || ' minutes')::INTERVAL ELSE NULL END,
                CASE WHEN v_status = 'completed' THEN v_timestamp + ((v_prep_mins + 3) || ' minutes')::INTERVAL ELSE NULL END
            ) RETURNING id INTO v_order_id;

            -- 1 to 3 bowls per order
            v_bowl_count := CASE WHEN random() < 0.60 THEN 1 WHEN random() < 0.90 THEN 2 ELSE 3 END;
            v_order_total := 0;

            FOR b IN 1..v_bowl_count LOOP
                SELECT * INTO v_size FROM menu_items WHERE id = v_sizes[floor(random() * array_length(v_sizes, 1) + 1)];
                SELECT * INTO v_flavor FROM menu_items WHERE id = v_flavors[floor(random() * array_length(v_flavors, 1) + 1)];
                
                -- Free topping rule (One only: 40% Jalapeno, 35% Olives, 25% None)
                v_rnd := random();
                IF v_rnd < 0.40 THEN v_free_top := 'Jalapeno';
                ELSIF v_rnd < 0.75 THEN v_free_top := 'Olives';
                ELSE v_free_top := 'None';
                END IF;

                v_bowl_price := v_size.price;

                INSERT INTO order_items (
                    order_id,
                    size_id,
                    flavor_id,
                    size_name,
                    size_code,
                    flavor_name,
                    free_topping,
                    price
                ) VALUES (
                    v_order_id,
                    v_size.id,
                    v_flavor.id,
                    v_size.name,
                    v_size.short_code,
                    v_flavor.name,
                    v_free_top,
                    v_bowl_price
                ) RETURNING id INTO v_item_id;

                -- 40% chance of 1 or 2 paid toppings
                IF random() < 0.45 THEN
                    SELECT * INTO v_topping FROM menu_items WHERE id = v_toppings[floor(random() * array_length(v_toppings, 1) + 1)];
                    INSERT INTO order_item_toppings (order_item_id, topping_id, topping_name, price)
                    VALUES (v_item_id, v_topping.id, v_topping.name, v_topping.price);
                    v_bowl_price := v_bowl_price + v_topping.price;

                    -- Update bowl price snapshot with toppings
                    UPDATE order_items SET price = v_bowl_price WHERE id = v_item_id;
                END IF;

                v_order_total := v_order_total + v_bowl_price;
            END LOOP;

            -- Update order total
            UPDATE orders SET total_amount = v_order_total WHERE id = v_order_id;
        END LOOP;

        -- Record daily token counter
        INSERT INTO daily_token_counters (order_date, last_token)
        VALUES (v_cur_date, v_order_count)
        ON CONFLICT (order_date) DO UPDATE SET last_token = EXCLUDED.last_token;
    END LOOP;

    RETURN 'Generated realistic seed data successfully';
END;
$$ LANGUAGE plpgsql;

-- 16. CLEANUP FUNCTION FOR DEMO ORDERS
CREATE OR REPLACE FUNCTION clean_demo_data()
RETURNS VOID AS $$
BEGIN
    DELETE FROM orders WHERE is_demo = true;
END;
$$ LANGUAGE plpgsql;

-- 17. SUPABASE REALTIME PUBLICATION
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- 18. ROW LEVEL SECURITY (RLS) POLICIES
-- NOTE: For Food Truck OMS MVP, Cashier/Kitchen/Admin operate within internal trusted network.
-- For production, connect Supabase Auth and restrict table mutability based on JWT claims.
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_token_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public write on menu_items" ON menu_items FOR ALL USING (true);

CREATE POLICY "Allow public read access on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);

CREATE POLICY "Allow public read on order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on order_item_toppings" ON order_item_toppings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_item_toppings" ON order_item_toppings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write on app_settings" ON app_settings FOR ALL USING (true);

CREATE POLICY "Allow public read on daily_tokens" ON daily_token_counters FOR SELECT USING (true);
CREATE POLICY "Allow public write on daily_tokens" ON daily_token_counters FOR ALL USING (true);
